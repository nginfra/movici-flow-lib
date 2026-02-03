import type { RefLike } from "@movici-flow-lib/types";
import type { ErrorDict, IFormValidator } from "@movici-flow-lib/utils/FormValidator";
import { computed, ref, unref, watch } from "vue";

export function useValidator(validator: RefLike<IFormValidator>) {
  const errors = ref<ErrorDict>({});
  const hasErrors = computed(() => Object.keys(errors.value).length > 0);

  unref(validator).onValidate((e) => (errors.value = e));
  function validated<T extends Parameters<typeof watch>[0]>(
    name: string,
    ref: T,
    opts?: { immediate?: boolean },
  ) {
    watch(
      ref,
      () => {
        const theValidator = unref(validator);
        theValidator.touch(name);
        if (opts?.immediate) {
          theValidator.validate();
        }
      },
      { deep: true },
    );
    return ref;
  }

  function destroyValidator() {
    unref(validator).reset();
  }
  return { errors, hasErrors, validated, destroyValidator };
}
