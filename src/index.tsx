import { Injector, components, settings, webpack } from "replugged";
const { Text } = components;
import SPACER_CHARACTER_SET from "./chars";
import "./divider.css";

const MIN_DIVIDER_CHARACTERS = 2;

const SPACERS_REGEX_TEXT = `[${SPACER_CHARACTER_SET.join("")}]{${MIN_DIVIDER_CHARACTERS},}`;
const REGEX = new RegExp(`^(${SPACERS_REGEX_TEXT})?(.+?)(${SPACERS_REGEX_TEXT})?$`);

const inject = new Injector();

type RoleArg = Record<string, unknown> & {
  role: Record<string, unknown> & { name: string; id: string };
};

const cfg = await settings.init("dev.albertp.RoleDividers");

export async function start(): Promise<void> {
  const roleMod = await webpack.waitForModule(
    webpack.filters.bySource(/\w+\.canRemove,\w+=\w+\.className/),
  );
  if (!roleMod) return;
  const renderExport = webpack.getExportsForProps<
    "render",
    {
      render: (role: RoleArg) => React.ReactElement;
    }
  >(roleMod, ["render"]);
  if (!renderExport) return;

  inject.instead(renderExport, "render", (args, fn) => {
    const headerClass = ["role-divider", cfg.get("hideEmpty") ? "hide-empty" : ""]
      .filter(Boolean)
      .join(" ");

    const [{ role }] = args;
    const match = role.name.match(REGEX);
    const [, frontSpace, roleName, backSpace] = match || [];
    const isMatch = Boolean(frontSpace || backSpace);
    if (isMatch) {
      return <Text.Eyebrow className={headerClass}>{roleName}</Text.Eyebrow>;
    }
    return fn(...args);
  });
}

export function stop(): void {
  inject.uninjectAll();
}
