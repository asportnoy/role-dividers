import React from "react";
import { Injector, webpack } from "replugged";
import SPACER_CHARACTER_SET from "./chars";

const MIN_DIVIDER_CHARACTERS = 2;

const SPACERS_REGEX_TEXT = `[${SPACER_CHARACTER_SET.join("")}]{${MIN_DIVIDER_CHARACTERS},}`;
const REGEX = new RegExp(`^(${SPACERS_REGEX_TEXT})?(.+?)(${SPACERS_REGEX_TEXT})?$`);

const inject = new Injector();

// todo: we need a better way to do this
const globalStorage: Record<string, unknown> = {};
// @ts-expect-error
window.replugged.plugins._devAlbertpRoledividers = globalStorage;

let headerClass: string;

function processRole(role: Record<string, unknown> & { name: string }): React.ReactElement | null {
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

  return null;
}

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
  headerClass = [titleClass.title as string, eyebrowClass.eyebrow as string].join(" ");

  globalStorage.processRole = processRole;
}

export function stop(): void {
  inject.uninjectAll();
}

export function runPlaintextPatches(): void {
  console.log(processRole.toString());

  webpack.patchPlaintext([
    {
      replacements: [
        {
          match: /(MemberRolesList.+?\.map\(\(function\((.+?)\){)(.+?)(\}\)\);)/g,
          replace: (_, prefix, varName, code, suffix) => {
            console.log(_, prefix, suffix);
            const newCode = `${prefix}var val = window.replugged.plugins._devAlbertpRoledividers.processRole(${varName}); if (val) {return val;} ${code} ${suffix}`;
            console.log(newCode);
            return newCode;
          },
        },
      ],
    },
  ]);
}
