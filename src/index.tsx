import { Injector, common, settings, webpack } from "replugged";
const { React } = common;
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

  const titleClass = webpack
    .getByProps<
      "title" | "body",
      {
        title: string;
        body: string;
      }
    >(["title", "body"], { all: true })
    .find(
      (x) =>
        Object.keys(x).length === 2 &&
        typeof x.title === "string" &&
        typeof x.body === "string" &&
        x.title.startsWith("title-") &&
        x.body.startsWith("body-"),
    );
  if (!titleClass) return;
  const eyebrowClass = webpack.getByProps("eyebrow");
  if (!eyebrowClass) return;

  inject.instead(renderExport, "render", (args, fn) => {
    const headerClass = [
      titleClass.title,
      eyebrowClass.eyebrow,
      "role-divider",
      cfg.get("hideEmpty") ? "hide-empty" : "",
    ]
      .filter(Boolean)
      .join(" ");

    const [{ role }] = args;
    const match = role.name.match(REGEX);
    const [, frontSpace, roleName, backSpace] = match || [];
    const isMatch = Boolean(frontSpace || backSpace);
    if (isMatch) {
      return <h2 className={headerClass}>{roleName}</h2>;
    }
    return fn(...args);
  });
}

export function stop(): void {
  inject.uninjectAll();
}
