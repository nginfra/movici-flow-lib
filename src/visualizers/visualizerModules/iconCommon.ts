import SOLID_ICONS from "@movici-flow-common/assets/icons/icons.json";
import SHAPE_ICONS from "@movici-flow-common/assets/icons/shapes.json";
import ICON_OVERRIDES_ from "./icon_overrides.json";
import type { IconMapping, IconMappingItem, IconMappingOverrides } from "../layers/ShapeIconLayer";

const ICON_OVERRIDES = ICON_OVERRIDES_ as Record<string, IconMappingOverrides>,
  ICON_PACKS: IconPackName[] = ["icons", "shapes"],
  ICONS = {
    icons: SOLID_ICONS,
    shapes: SHAPE_ICONS,
  } as Record<IconPackName, IconMapping>;

function overridingIconMapping(icons: IconMapping, overrides: IconMappingOverrides): IconMapping {
  return Object.entries(icons).reduce(
    (rv: IconMapping, [icon, attrs]: [string, IconMappingItem]) => {
      const iconOverrides = (overrides[icon] ?? {}) as Partial<IconMappingItem>;

      return {
        ...rv,
        [icon]: {
          ...attrs,
          ...iconOverrides,
          anchorX: (iconOverrides.anchorX ?? 0.5) * attrs.width,
          anchorY: (iconOverrides.anchorY ?? 0.5) * attrs.height,
          mask: true,
        },
      };
    },
    {} as IconMapping
  );
}

function getIconMapping(pack: IconPackName) {
  return ICON_PACKS.reduce((prev, curr) => {
    prev[curr] = overridingIconMapping(ICONS[curr], ICON_OVERRIDES[curr]);
    return prev;
  }, {} as Record<string, IconMapping>)[pack];
}

export type IconPackName = "icons" | "shapes";

export const MAPPED_ICONS = ICON_PACKS.reduce((acc, pack) => {
  return { ...acc, [pack]: getIconMapping(pack) };
}, {} as Record<IconPackName, IconMapping>);
