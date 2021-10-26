export type ErrorDict = Record<string, string>;
export type ValidatorFunc = () => string | void;
interface FormValidatorConfig {
  validators?: Record<string, ValidatorFunc>;
  onValidate?: (e: ErrorDict) => void;
  modules?: ValidationModule[];
}

export class ValidationError extends Error {}
type ValidatorCallback = (e: ErrorDict) => void;

export interface ValidationModule {
  name: string;
  validators: Record<string, ValidatorFunc>;
  onValidate?: ValidatorCallback;
}

/**
 * The FormValidator class can help with validating form fields. It can be given certain validation
 * functions (`ValidatorFunc`) that should return a string (or throw ValidationError) whenever they
 * are called and find an error. These functions are not called with an argument so must be able to
 * determine errors on their own. Most commonly, these are arrow functions that are bound to a Vue
 * component and they'd check something in their own state. Validators are given a key by which the
 * error can be identified.
 *
 * After validation, at which all `ValidatorFunc`s are called, the `onValidate` callback is invoked
 * with a dictionary containing the keys and string output of all validators that produced an error.
 * This callback can be used to synchronize an Vue component attribute.
 *
 * Validators and an `onValidate` callback can also be grouped in a module and registered using the
 * `addModule` method. These can then later be removed from the FormValidator using the
 * `removeModule` method. This makes it possible to dynamically attach and detach a group of
 * validators
 *
 * see also `mixins/ValidationProvider.vue` for an example usage
 */
export default class FormValidator {
  private readonly modules: { _: ValidationModule; [key: string]: ValidationModule };

  errors: ErrorDict;

  constructor(config?: FormValidatorConfig) {
    this.errors = {};
    this.modules = {
      _: {
        name: '_',
        validators: config?.validators ?? {},
        onValidate: config?.onValidate
      }
    };
    this.modules =
      config?.modules?.reduce((result, module) => {
        result[module.name] = module;
        return result;
      }, this.modules) ?? this.modules;
  }

  setValidator(key: string, func: ValidatorFunc) {
    this.modules._.validators[key] = func;
  }

  setValidators(validators: Record<string, ValidatorFunc>) {
    Object.assign(this.modules._.validators, validators);
  }

  addModule(module: ValidationModule) {
    if (this.modules[module.name]) {
      console.warn(`Duplicate validation module [${module.name}]`);
    }
    this.modules[module.name] = module;
  }

  removeModule(identifier: string) {
    const module = this.modules[identifier];
    delete this.modules[identifier];

    for (const key of Object.keys(module.validators)) {
      delete this.errors[key];
    }
    this.invokeCallbacks();
  }

  onValidate(callback: ValidatorCallback) {
    this.modules._.onValidate = callback;
  }

  touch(key: string) {
    delete this.errors[key];
    this.invokeCallbacks();
  }

  validate() {
    this.errors = {};

    for (const validators of Object.values(this.modules).map(m => m.validators)) {
      for (const key of Object.keys(validators)) {
        const result = this.getValidationResult(validators[key]);

        if (typeof result === 'string') {
          this.errors[key] = result;
        }
      }
    }

    this.invokeCallbacks();
  }

  private invokeCallbacks() {
    for (const callback of Object.values(this.modules).map(m => m.onValidate)) {
      callback && callback(this.errors);
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
}
