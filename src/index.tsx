import { Guild, Role, User } from "discord-types/general";
import { Injector, common, components, settings, webpack } from "replugged";
const {
  React,
  lodash: { compact },
} = common;
const { Text } = components;
import SPACER_CHARACTER_SET from "./chars";
import Collapse from "./Collapse";
import "./divider.css";

const MIN_DIVIDER_CHARACTERS = 2;

const SPACERS_REGEX_TEXT = `[${SPACER_CHARACTER_SET.join("")}]{${MIN_DIVIDER_CHARACTERS},}`;
const REGEX = new RegExp(`^(${SPACERS_REGEX_TEXT})?(.+?)(${SPACERS_REGEX_TEXT})?$`);

const inject = new Injector();

type RoleArg = Record<string, unknown> & {
  role: Record<string, unknown> & { name: string; id: string };
};

type RoleListArg = Record<string, unknown> & {
  guild: Guild;
  user: User;
  userRoles: string[];
  _roleDividersOriginalRoles: string[];
};

type Settings = {
  hideEmpty?: boolean;
  enableCollapse?: boolean;
  collapsedRoles?: string[];
};

const cfg = await settings.init<Settings>("dev.albertp.RoleDividers");
let forceUpdate: () => void;

function matchRole(role: string): { isMatch: boolean; roleName: string } {
  const match = role.match(REGEX);
  const [, frontSpace, roleName, backSpace] = match || [];
  const isMatch = Boolean(frontSpace || backSpace);

  return { isMatch, roleName };
}

function toggleCollapse(role: string): void {
  const collapsedRoles = cfg.get("collapsedRoles", [] as string[]);
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
  return cfg.get("collapsedRoles", [] as string[]).includes(role);
}

export async function start(): Promise<void> {
  const roleMod = await webpack.waitForModule(
    webpack.filters.bySource(/\w+\.canRemove,\w+=\w+\.className/),
  );
  const renderExport = webpack.getExportsForProps<
    "render",
    {
      render: (role: RoleArg) => React.ReactElement;
    }
  >(roleMod, ["render"]);
  if (!renderExport) return;

  const memberRoleList = await webpack.waitForModule<
    Record<string, (args: RoleListArg) => React.ReactElement>
  >(webpack.filters.bySource("MemberRolesList: currentUser cannot be undefined"));
  const memberRoleListExport = Object.entries(memberRoleList).find(
    ([, v]) => typeof v === "function",
  )?.[0];
  if (!memberRoleListExport) return;

  inject.instead(memberRoleList, memberRoleListExport, ([args], fn) => {
    return ((args: RoleListArg) => {
      const [state, setState] = React.useState(0);
      forceUpdate = () => setState(state + 1);

      const hideEmpty = cfg.get("hideEmpty", true);
      const enableCollapse = cfg.get("enableCollapse", true);

      const guildRoles = args.guild.roles;
      // Want to make sure we're not modifying the original array
      args._roleDividersOriginalRoles ||= args.userRoles;
      let roles: Array<string | null> = Array.from(args._roleDividersOriginalRoles).sort((a, b) => {
        const aRole: Role = guildRoles[a];
        const bRole: Role = guildRoles[b];
        if (!aRole || !bRole) return 0;
        return bRole.position - aRole.position;
      });
      const dividers = new Set<string>();

      for (const [i, id] of roles.entries()) {
        if (!id) continue;
        const role = guildRoles[id];
        if (!role) {
          roles[i] = null;
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

        let lastWasDivider = false;

        // Filter out all dividers that do not have a divider before them (remember that the array is reversed)
        for (const [i, id] of roles.entries()) {
          if (!id) continue;
          const isDivider = dividers.has(id);
          const realLastWasDivider = lastWasDivider;
          lastWasDivider = isDivider;

          if (isDivider) {
            if (realLastWasDivider) {
              roles[i] = null;
            }
          }
        }

        roles.reverse();
      }

      if (enableCollapse) {
        // Filter out all roles under collapsed dividers until we hit another divider
        let isSectionHidden = false;

        for (const [i, id] of roles.entries()) {
          if (!id) continue;
          const isDivider = dividers.has(id);
          if (isDivider) {
            isSectionHidden = isCollapsed(id);
          } else if (isSectionHidden) {
            roles[i] = null;
          }
        }
      }

      args.userRoles = compact(roles).reverse();

      const result: React.ReactElement = fn(args);
      return result;
    })(args);
  });

  inject.instead(renderExport, "render", (args, fn) => {
    const enableCollapse = cfg.get("enableCollapse", true);

    const [{ role }] = args;
    const { isMatch, roleName } = matchRole(role.name);
    if (isMatch) {
      // Todo: switch to Clickable once released
      return (
        <a onClick={() => enableCollapse && toggleCollapse(role.id)} style={{ width: "100%" }}>
          <Text.Eyebrow className="role-divider">
            {enableCollapse && <Collapse collapsed={isCollapsed(role.id)} />}
            {roleName}
          </Text.Eyebrow>
        </a>
      );
    }
    return fn(...args);
  });
}

export function stop(): void {
  inject.uninjectAll();
}
