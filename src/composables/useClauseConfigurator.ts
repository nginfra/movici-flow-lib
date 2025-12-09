import type { AttributeSummary, ByValueClause } from "@movici-flow-lib/types";
import type { IFormValidator } from "@movici-flow-lib/utils/FormValidator";
import isEqual from "lodash/isEqual";
import { reactive, ref, watch, type Ref } from "vue";
import { useAttributes } from "./useAttributes";
import { useValidator } from "./useValidator";

type ClauseType = "static" | "byValue";
export function useClauseConfigurator<
  Static,
  ByValue extends ByValueClause,
  T extends { static?: Static; byValue?: ByValue } = { static?: Static; byValue?: ByValue }
>({
  attributes,
  supportedDataTypes,
  t,
  validator,
  modelValue,
  onEmit,
}: {
  attributes: Ref<AttributeSummary[] | undefined>;
  supportedDataTypes: string[];
  validator: IFormValidator;
  modelValue: Ref<T | undefined>;
  t: (val: string) => string;
  onEmit: (val: T) => void;
}) {
  const attributeHelper = useAttributes({ attributes, supportedDataTypes, t });
  const validation = useValidator(validator);
  validator.configure({
    validators: {
      selectedAttribute: attributeHelper.validateAttribute(() => clauseType.value === "byValue"),
    },
  });
  validation.validated("selectedAttribute", attributeHelper.selectedAttribute);

  const clauseType = ref<ClauseType>("static");
  const localClause = reactive({} as T);
  watch(
    modelValue,
    (value) => {
      if (!value) return;
      clauseType.value = value.byValue ? "byValue" : "static";
      Object.assign(localClause, value);
      attributeHelper.selectAttribute(value.byValue?.attribute);
    },
    { immediate: true }
  );

  function updateClause(clause?: Partial<T>) {
    console.log(localClause, clause);
    Object.assign(localClause, clause);
    emitClause();
  }
  function emitClause() {
    const toEmit =
      clauseType.value === "static"
        ? { static: (localClause.static ?? {}) as Static }
        : { byValue: (localClause.byValue ?? {}) as ByValue };
    onEmit(toEmit as T);
  }

  function selectAttribute(attr?: AttributeSummary | null) {
    if (!attr) {
      return;
    }
    localClause.byValue ??= {} as any;
    if (localClause.byValue) {
      localClause.byValue.attribute = attr;
    }
    attributeHelper.selectAttribute(attr);
  }
  watch(attributes, (value, old) => {
    if (!isEqual(value, old)) {
      delete localClause.static;
      delete localClause.byValue;
      attributeHelper.selectAttribute();
      clauseType.value = "static";
    }
  });
  watch(clauseType, () => {
    validator.touch("selectedAttribute");
    emitClause();
  });
  watch(attributeHelper.selectedAttribute, (attribute) => {
    if (!attribute) return;
    console.log("here", attribute);

    localClause.byValue ??= {
      attribute,
    } as any;
  });
  return {
    ...validation,
    ...attributeHelper,
    clauseType,
    localClause,
    selectAttribute,
    updateClause,
  };
}
