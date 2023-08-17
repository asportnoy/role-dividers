import { Guild, Role, User } from "discord-types/general";
import { Injector, common, components, settings, webpack } from "replugged";
const { React } = common;
const { Clickable, Text } = components;
import SPACER_CHARACTER_SET from "./chars";
import Collapse from "./Collapse";
import "./divider.css";

const MIN_DIVIDER_CHARACTERS = 2;

const SPACERS_REGEX_TEXT = `[${SPACER_CHARACTER_SET.join("")}]{${MIN_DIVIDER_CHARACTERS},}`;
const REGEX = new RegExp(`^(${SPACERS_REGEX_TEXT})?(.+?)(${SPACERS_REGEX_TEXT})?$`);

const inject = new Injector();

type RoleArg = Record<string, unknown> & {
  role: Record<string, unknown> & { name: string; id: string };
  className: string;
};

type RoleListArg = Record<string, unknown> & {
  guild: Guild;
  user: User;
  userRoles: string[];
};

type Settings = {
  hideEmpty?: boolean;
  enableCollapse?: boolean;
  collapsedRoles?: string[];
};

const settingDefaults: Partial<Settings> = {
  hideEmpty: true,
  enableCollapse: true,
  collapsedRoles: [],
};

export const cfg = await settings.init<Settings, keyof typeof settingDefaults>(
  "dev.albertp.RoleDividers",
  settingDefaults,
);

export { Settings } from "./Settings";

let forceUpdate: () => void;

function matchRole(role: string): { isMatch: boolean; roleName: string } {
  const match = role.match(REGEX);
  const [, frontSpace, roleName, backSpace] = match || [];
  const isMatch = Boolean(frontSpace || backSpace);

  return { isMatch, roleName };
}

function toggleCollapse(role: string): void {
  const collapsedRoles = cfg.get("collapsedRoles");
  if (collapsedRoles.includes(role)) {
    cfg.set(
      "collapsedRoles",
      collapsedRoles.filter((r) => r !== role),
    );
  } else {
    cfg.set("collapsedRoles", [...collapsedRoles, role]);
  }

  forceUpdate();
}

function isCollapsed(role: string): boolean {
  return cfg.get("collapsedRoles").includes(role);
}

const hiddenRoles = new Set<string>();

export async function start(): Promise<void> {
  const roleMod = await webpack.waitForModule(
    webpack.filters.bySource(/\w+\.canRemove,\w+=\w+\.className/),
  );
  const renderExport = webpack.getExportsForProps<{
    render: (role: RoleArg) => React.ReactNode;
  }>(roleMod, ["render"]);
  if (!renderExport) return;

  const memberRoleList = await webpack.waitForModule<
    Record<string, (args: RoleListArg) => React.ReactElement>
  >(webpack.filters.bySource("MemberRolesList: currentUser cannot be undefined"));
  const memberRoleListExport = Object.entries(memberRoleList).find(
    ([, v]) => typeof v === "function",
  )?.[0];
  if (!memberRoleListExport) return;

  inject.before(memberRoleList, memberRoleListExport, ([args]) => {
    return ((args: RoleListArg) => {
      const [state, setState] = React.useState(0);
      forceUpdate = () => setState(state + 1);

      const hideEmpty = cfg.get("hideEmpty");
      const enableCollapse = cfg.get("enableCollapse");

      hiddenRoles.clear();

      const guildRoles = args.guild.roles;
      let roles: string[] = Array.from(args.userRoles).sort((a, b) => {
        const aRole: Role = guildRoles[a];
        const bRole: Role = guildRoles[b];
        if (!aRole || !bRole) return 0;
        return bRole.position - aRole.position;
      });
      const dividers = new Set<string>();

      for (const id of roles) {
        if (!id) continue;
        const role = guildRoles[id];
        if (!role) {
          hiddenRoles.add(id);
          continue;
        }
        const { isMatch } = matchRole(role.name);
        if (isMatch) {
          dividers.add(id);
        }
      }

      if (hideEmpty) {
        // Reversing the array makes it easier to deal with this
        roles.reverse();

        let lastWasDivider = true;

        // Filter out all dividers that do not have a divider before them (remember that the array is reversed)
        for (const id of roles) {
          if (hiddenRoles.has(id)) continue;
          const isDivider = dividers.has(id);
          const realLastWasDivider = lastWasDivider;
          lastWasDivider = isDivider;

          if (isDivider) {
            if (realLastWasDivider) {
              hiddenRoles.add(id);
            }
          }
        }

        roles.reverse();
      }

      if (enableCollapse) {
        // Filter out all roles under collapsed dividers until we hit another divider
        let isSectionHidden = false;

        for (const id of roles) {
          if (hiddenRoles.has(id)) continue;
          const isDivider = dividers.has(id);
          if (isDivider) {
            isSectionHidden = isCollapsed(id);
          } else if (isSectionHidden) {
            hiddenRoles.add(id);
          }
        }
      }
    })(args);
  });

  inject.instead(renderExport, "render", (args, fn) => {
    const enableCollapse = cfg.get("enableCollapse");

    const [{ className, role }] = args;
    // Do not inject into the members tab or other parts of the app besides the profile role list
    if (!/^rolePill-/.test(className)) return fn(...args);

    if (hiddenRoles.has(role.id)) return null;
    const { isMatch, roleName } = matchRole(role.name);
    if (isMatch) {
      return (
        <Clickable
          onClick={() => enableCollapse && toggleCollapse(role.id)}
          style={{ width: "100%" }}>
          <Text.Eyebrow className="role-divider">
            {enableCollapse && <Collapse collapsed={isCollapsed(role.id)} />}
            {roleName}
          </Text.Eyebrow>
        </Clickable>
      );
    }
    return fn(...args);
  });
}

export function stop(): void {
  inject.uninjectAll();
}
