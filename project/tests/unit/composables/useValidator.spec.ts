import { useValidator } from "@movici-flow-lib/composables/useValidator";
import type { FormValidator } from "@movici-flow-lib/utils/FormValidator";
import { describe, expect, it, vitest, type Mock } from "vitest";
import { nextTick, ref } from "vue";

describe("useValidator", () => {
  const validator = {
    touch: vitest.fn(),
    reset: vitest.fn(),
    onValidate: vitest.fn(),
  } as unknown as FormValidator;

  it("updates hasErrors", () => {
    const { errors, hasErrors } = useValidator(ref(validator));
    expect(hasErrors.value).toBeFalsy();
    errors.value.field = "some-error";
    expect(hasErrors.value).toBeTruthy();
  });

  it("validated touches key when modified", async () => {
    const { validated } = useValidator(ref(validator));
    const field = validated("field", ref());
    field.value = "some-value";
    await nextTick();
    expect(validator.touch).toHaveBeenCalledWith("field");
  });

  it("validated updates field value", () => {
    const { validated } = useValidator(ref(validator));
    const field = validated("field", ref());
    field.value = "some-value";
    expect(field.value).toEqual("some-value");
  });

  it("resets validator on destroyValidator", () => {
    const { destroyValidator } = useValidator(ref(validator));
    destroyValidator();
    expect(validator.reset).toHaveBeenCalled();
  });

  it("registers onValidate with error setter", () => {
    const { errors } = useValidator(ref(validator));
    expect(validator.onValidate).toHaveBeenCalled();

    const callback = (validator.onValidate as Mock).mock.lastCall[0];
    const sentinel = Symbol("errors");
    callback(sentinel);
    expect(errors.value).toBe(sentinel);
  });
});
