import { FormValidator, type FormValidatorConfig } from "@movici-flow-lib/utils/FormValidator";
import { describe, it, expect, vi } from "vitest";

describe("formValidator", () => {
  function newValidator(validators?: FormValidatorConfig["validators"]) {
    const onValidate = vi.fn();
    return { validator: new FormValidator({ validators: validators, onValidate }), onValidate };
  }
  it("returns empty dictionary on no errors", () => {
    const { validator, onValidate } = newValidator();
    validator.validate();
    expect(onValidate).toBeCalledWith({});
  });

  it("can return multiple errors", () => {
    const { validator, onValidate } = newValidator({
      a: () => "error a",
      b: () => "error b",
    });
    validator.validate();
    expect(onValidate).toBeCalledWith({ a: "error a", b: "error b" });
  });

  it("can spawn a child validator", () => {
    const validator = new FormValidator();
    expect(validator.child("child")).toBeInstanceOf(FormValidator);
  });

  it("reuses spawned child", () => {
    const validator = new FormValidator();
    expect(validator.child("child")).toBe(validator.child("child"));
  });

  it("Child can be configured", () => {
    const child = new FormValidator().child("child");
    const onValidate = vi.fn();
    child.configure({
      validators: {
        a: () => "error",
      },
      onValidate,
    });
    child.validate();
    expect(onValidate).toBeCalledWith({ a: "error" });
  });

  it("Child reports errors back to parent", () => {
    const { validator, onValidate } = newValidator();
    const child = validator.child("child");
    child.configure({
      validators: {
        a: () => "error",
      },
    });
    validator.validate();
    expect(onValidate).toHaveBeenLastCalledWith({ "child.a": "error" });
  });

  it("removing clears all validators, errors and callbacks", () => {
    const validate = vi.fn();
    const { validator, onValidate } = newValidator({ a: validate });
    validator.reset();
    validate.mockReset();
    onValidate.mockReset();

    validator.validate();
    expect(onValidate).not.toBeCalled();
    expect(validate).not.toBeCalled();
  });

  it("can remove a child", () => {
    const validator = new FormValidator();
    const child = validator.child("child");
    const onValidate = vi.fn();
    child.configure({ onValidate });
    validator.removeChild("child");
    onValidate.mockReset();
    validator.validate();
    expect(onValidate).not.toBeCalled();
  });

  it("removing a child clears errors", () => {
    const { validator, onValidate } = newValidator();
    const child = validator.child("child");
    child.configure({
      validators: {
        a: () => "error",
      },
    });
    validator.validate();
    expect(onValidate).toHaveBeenLastCalledWith({ "child.a": "error" });
    validator.removeChild("child");
    expect(onValidate).toHaveBeenLastCalledWith({});
  });

  it("only calls onValidate once after removing child", () => {
    const onValidate = vi.fn();
    const validator = new FormValidator({ onValidate });
    const child = validator.child("child");
    child.child("grandchild");
    expect(onValidate).toBeCalledTimes(0);

    validator.removeChild("child");
    expect(onValidate).toBeCalledTimes(1);
  });

  it("resets errors on touch", () => {
    const { validator, onValidate } = newValidator({
      a: () => "error",
    });
    validator.validate();
    expect(onValidate).toBeCalledWith({ a: "error" });
    validator.touch("a");
    expect(onValidate).toBeCalledWith({});
  });

  it("can have dependent validators that are reset on touch", () => {
    const { validator, onValidate } = newValidator({
      c: () => {},
      b: {
        depends: ["c"],
        validator: () => "error b",
      },
      a: {
        depends: ["b"],
        validator: () => "error a",
      },
    });
    validator.validate();
    expect(onValidate).toBeCalledWith({ a: "error a", b: "error b" });
    validator.touch("c");
    expect(onValidate).toBeCalledWith({});
  });
});
