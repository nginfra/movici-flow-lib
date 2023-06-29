import type { AttributeSummary, AttributeType, RefLike } from "@movici-flow-lib/types";
import { computed, ref, unref } from "vue";

export function useAttributes({
  attributes,
  supportedDataTypes,
  t,
}: {
  attributes: RefLike<AttributeSummary[] | undefined>;
  supportedDataTypes: string[];
  t: (val: string) => string;
}) {
  const selectedAttribute = ref<AttributeSummary>();
  function isAttributeSupported(attr: AttributeType) {
    return supportedDataTypes.includes(attr.data_type);
  }
  const supportedAttributes = computed(() => unref(attributes)?.filter(isAttributeSupported) ?? []);

  function selectAttribute(attr?: AttributeSummary | null) {
    const found = supportedAttributes.value.find((a) => a.name === attr?.name);
    selectedAttribute.value = found;
  }
  function selectFirstAttribute() {
    selectAttribute(supportedAttributes.value[0]);
  }
  function selectAttributeOrFirst(attr?: AttributeSummary | null) {
    if (attr) {
      return selectAttribute(attr);
    }
    selectFirstAttribute();
  }
  function validateAttribute(when: () => boolean) {
    return () => {
      if (when()) {
        if (!supportedAttributes.value?.length) {
          return t("flow.visualization.noCompatibleAttributes");
        }

        if (!selectedAttribute.value) {
          return "Please select an attribute for the configurator to be based on";
        }
      }
    };
  }
  return {
    isAttributeSupported,
    selectAttribute,
    selectAttributeOrFirst,
    selectedAttribute,
    supportedAttributes,
    validateAttribute,
  };
}
