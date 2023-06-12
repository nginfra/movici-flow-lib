import type {
  GeneralSection,
  RawSpecialValues,
  DatasetSpecialValues,
} from "@movici-flow-common/types";

export function specialValues(generalSection: GeneralSection): DatasetSpecialValues {
  if (generalSection.special !== undefined) {
    return readSpecialSection(generalSection.special);
  }
  if (generalSection.no_data !== undefined) {
    return readSpecialSection(generalSection.no_data);
  }
  return {};
}

function readSpecialSection(section: RawSpecialValues): DatasetSpecialValues {
  const rv: DatasetSpecialValues = {};
  for (const [key, value] of Object.entries(section)) {
    const [entityGroup, ...attr] = key.split(".");
    rv[entityGroup] ??= {};
    rv[entityGroup][attr.join(".")] = value;
  }
  return rv;
}
