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
  const attribution = useAttributes({ attributes, supportedDataTypes, t });
  const validation = useValidator(validator);
  validator.configure({
    validators: {
      selectedAttribute: attribution.validateAttribute(() => clauseType.value === "byValue"),
    },
  });
  validation.validated("selectedAttribute", attribution.selectedAttribute);

  const clauseType = ref<ClauseType>("static");
  const localClause = reactive({} as T);
  watch(
    modelValue,
    (value) => {
      if (!value) return;
      clauseType.value = value.byValue ? "byValue" : "static";
      Object.assign(localClause, value);
      attribution.selectAttribute(value.byValue?.attribute);
    },
    { immediate: true }
  );

  function updateClause(clause?: Partial<T>) {
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
  watch(attributes, (value, old) => {
    if (!isEqual(value, old)) {
      delete localClause.static;
      delete localClause.byValue;
      attribution.selectAttribute();
      clauseType.value = "static";
    }
  });
  watch(clauseType, () => {
    validator.touch("selectedAttribute");
    emitClause();
  });
  return {
    ...validation,
    ...attribution,
    clauseType,
    localClause,
    updateClause,
  };
}
