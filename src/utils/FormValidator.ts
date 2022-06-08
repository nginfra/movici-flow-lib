export type ErrorDict = Record<string, string>;
export type NestedErrorDict = { [key: string]: string | NestedErrorDict };

export interface ValidatorFunc {
  (): string | void;
}

export interface SingleValidatorConfig {
  depends?: string | string[];
  validator: ValidatorFunc;
}
export interface FormValidatorConfig {
  validators?: Record<string, ValidatorFunc | SingleValidatorConfig>;
  onValidate?: ValidatorCallback;
  parentCallback?: ValidatorCallback;
}

type ValidatorCallback = (e: ErrorDict) => void;

export interface IFormValidator {
  configure(module: FormValidatorConfig): void;
  touch(key: string): void;
  validate(): void;
  onValidate(cb: ValidatorCallback): void;
  child(name: string): IFormValidator;
  reset(): void;
  removeChild(name: string): void;
}

/**
 * The FormValidator class can help with validating form fields. It can be given certain validation
 * functions (`ValidatorFunc`) that should return a string (or throw ValidationError) whenever they
 * are called and find an error. These functions are not called with an argument so must be able to
 * determine errors on their own. Most commonly, these are arrow functions that are bound to a Vue
 * component and they'd check something in their own state. Validators are given a key by which the
 * error can be identified.
 *
 * A Validator function can also be given dependencies. In that case, the validator key holds an
 * object with a `depends` attribute, next to a `validator` attribute. The `validator` holds the
 * ValidatorFunc and the `depends attribute contains an array of strings, all keys to other
 * validators. See the following example:
 *
 * ```
 * formValidator.configure({
 *  validators: {
 *    a: ()=>{}
 *    b: {
 *       depends: ['a'],
 *       validator: ()=>{}
 *    }
 *   }
 * })
 * ```
 *
 * Whenever `a` is touched (using formValidator.touch('a')), both any errors for `a` and `b` are
 * reset, since `b` depends on `a`
 *
 * After validation, at which all `ValidatorFunc`s are called, the `onValidate` callback is invoked
 * with a dictionary containing the keys and string output of all validators that produced an
 * error. This callback can be used to synchronize a Vue component attribute.
 *
 * You can create child validators by calling `FormValidator.spawn`. This function takes a single
 * `name` argument to identify the child Validator by. The child validator can be used as a
 * standalone form validator. However, whenever `validate` is called on the parent, `validate` is
 * also called on the child. The child validator has its own onValidate to report errors from the
 * on the child FormValidator. the child validator also reports errors back to the parent
 * validator. These errors are then also reported in the parent's `onValidate` callback, where they
 * are prefixed by the child validators name and a `.`, such as `child.validator-key`
 *
 * see also `mixins/ValidationProvider.vue` for an example usage
 */

export default class FormValidator implements IFormValidator {
  private errors!: NestedErrorDict;
  private children!: Record<string, IFormValidator>;
  private validators!: Record<string, ValidatorFunc>;
  private dependents!: Record<string, string[]>;
  private callbacks!: ValidatorCallback[];
  private resetting!: boolean;
  private parentCallback?: ValidatorCallback;

  constructor(config?: FormValidatorConfig) {
    this.doReset();
    this.parentCallback = config?.parentCallback;
    config && this.configure(config);
  }

  private doReset() {
    this.resetting = false;
    this.errors = {};
    this.children = {};
    this.validators = {};
    this.dependents = {};
    this.callbacks = [];
  }
  configure(config: FormValidatorConfig) {
    config.validators && this.processValidators(config.validators);
    this.onValidate(config.onValidate);
  }

  private processValidators(validators: Record<string, ValidatorFunc | SingleValidatorConfig>) {
    for (const [key, val] of Object.entries(validators)) {
      if (typeof val === 'function') {
        this.validators[key] = val;
        continue;
      }
      let depends = val.depends ?? [];
      if (typeof depends === 'string') {
        depends = [depends];
      }
      for (const dep of depends) {
        if (!this.validators[dep] || !validators[dep]) {
          throw new Error(`Undefined dependency '${dep}' for validator '${key}'`);
        }
        this.dependents[dep] ??= [];
        this.dependents[dep].push(key);
      }
      this.validators[key] = val.validator;
    }
  }

  onValidate(callback?: ValidatorCallback) {
    callback && this.callbacks.push(callback);
  }

  touch(key: string) {
    this.resetError(key) && this.invokeCallbacks();
  }

  private resetError(key: string): boolean {
    let touched = false;
    if (this.errors[key]) {
      delete this.errors[key];
      touched = true;
    }
    for (const dep of this.dependents[key] ?? []) {
      touched = this.resetError(dep) || touched;
    }
    return touched;
  }

  validate() {
    this.errors = {};

    for (const [name, validator] of Object.entries(this.validators)) {
      const result = this.getValidationResult(validator);
      if (typeof result === 'string') {
        this.errors[name] ??= result;
      }
    }
    for (const child of Object.values(this.children)) {
      child.validate();
    }

    this.invokeCallbacks();
  }

  private invokeCallbacks() {
    const errors = flatten(this.errors);
    this.parentCallback?.(errors);
    for (const cb of this.callbacks) {
      cb(errors);
    }
  }

  private getValidationResult(validator: ValidatorFunc): string | null | void {
    let result = null;
    try {
      result = validator();
    } catch (e) {
      if (e instanceof ValidationError) {
        result = e.message;
      } else {
        throw e;
      }
    }
    return result;
  }

  child(name: string): IFormValidator {
    if (!name) {
      throw new Error('Validator name cannot be empty');
    }

    this.children[name] ??= new FormValidator({
      onValidate: (e: ErrorDict) => {
        this.processChildErrors(name, e);
      }
    });
    return this.children[name];
  }

  reset(): void {
    this.resetting = true;
    for (const child of Object.keys(this.children)) {
      this.removeChild(child);
    }
    this.errors = {};
    this.invokeCallbacks();
    this.doReset();
  }

  removeChild(name: string): void {
    const validator = this.children[name];
    if (validator) {
      delete this.children[name];
      delete this.errors[name];
      validator.reset();
    }
  }

  private processChildErrors(child: string, e: ErrorDict) {
    if (this.resetting) return;

    if (Object.keys(e).length) {
      this.errors[child] = e;
    } else {
      delete this.errors[child];
    }
    this.invokeCallbacks();
  }
}

function flatten(errors: NestedErrorDict, path = '', result: ErrorDict | null = null) {
  result = result || {};

  for (const [key, val] of Object.entries(errors)) {
    if (typeof val === 'string') {
      result[path + key] = val;
    } else {
      flatten(val, path + key + '.', result);
    }
  }
  return result;
}

export class ValidationError extends Error {}

export function required(value: unknown, resource = 'Input') {
  ``;
  if (value === undefined || value === null) return `${resource} is required.`;
}

export function isPositive(value: unknown, resource = 'Input') {
  if (value && typeof value === 'number' && value < 0) return `${resource} must be at least 0.`;
}
