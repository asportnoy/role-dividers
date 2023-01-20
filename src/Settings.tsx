import { cfg } from ".";
import { components } from "replugged";
const { SwitchItem } = components;

export function Settings() {
  return (
    <div>
      <SwitchItem
        note="If a divider has no roles under it, it will be hidden."
        {...cfg.useSetting("hideEmpty")}>
        Hide empty dividers
      </SwitchItem>
      <SwitchItem
        note="If enabled, you can collapse dividers by clicking on them. This will hide all roles under
        the divider."
        {...cfg.useSetting("hideEmpty")}>
        Enable collapsing
      </SwitchItem>
    </div>
  );
}
