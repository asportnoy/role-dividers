import React from "react";
import { Injector, webpack } from "replugged";
import SPACER_CHARACTER_SET from "./chars";

const MIN_DIVIDER_CHARACTERS = 2;

const SPACERS_REGEX_TEXT = `[${SPACER_CHARACTER_SET.join("")}]{${MIN_DIVIDER_CHARACTERS},}`;
const REGEX = new RegExp(`^(${SPACERS_REGEX_TEXT})?(.+?)(${SPACERS_REGEX_TEXT})?$`);

const inject = new Injector();

export async function start(): Promise<void> {
  const roleMod = await webpack.waitForModule(
    webpack.filters.bySource(/\w+\.canRemove,\w+=\w+\.className/),
  );
  if (!roleMod) return;
  const renderExport = webpack.getExportsForProps(roleMod, ["render"]) as {
    // eslint-disable-next-line no-unused-vars
    render: (opts: unknown) => React.Component;
  };
  if (!renderExport) return;

  const titleClass = webpack
    .getByProps(["title", "body"], { all: true })
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
  const headerClass = [titleClass.title as string, eyebrowClass.eyebrow as string].join(" ");

  inject.instead(
    renderExport,
    "render",
    // eslint-disable-next-line no-unused-vars
    (args, fn: (...args: unknown[]) => void): React.ReactElement | void => {
      const [{ role }] = args as [
        Record<string, unknown> & { role: Record<string, unknown> & { name: string } },
      ];
      console.log(role.name);
      const match = role.name.match(REGEX);
      const [, frontSpace, roleName, backSpace] = match || [];
      const isMatch = Boolean(frontSpace || backSpace);
      if (isMatch) {
        return (
          <h2
            className={headerClass}
            style={{
              color: "var(--header-primary)",
              width: "100%",
              marginTop: "8px",
            }}>
            {roleName}
          </h2>
        );
      }
      return fn(...args);
    },
  );
}

export function stop(): void {
  inject.uninjectAll();
}
