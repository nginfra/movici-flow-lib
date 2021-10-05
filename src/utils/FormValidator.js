export class ValidationError extends Error {
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
    constructor(config) {
        var _a, _b, _c;
        this.errors = {};
        this.modules = {
            _: {
                name: '_',
                validators: (_a = config === null || config === void 0 ? void 0 : config.validators) !== null && _a !== void 0 ? _a : {},
                onValidate: config === null || config === void 0 ? void 0 : config.onValidate
            }
        };
        this.modules =
            (_c = (_b = config === null || config === void 0 ? void 0 : config.modules) === null || _b === void 0 ? void 0 : _b.reduce((result, module) => {
                result[module.name] = module;
                return result;
            }, this.modules)) !== null && _c !== void 0 ? _c : this.modules;
    }
    setValidator(key, func) {
        this.modules._.validators[key] = func;
    }
    setValidators(validators) {
        Object.assign(this.modules._.validators, validators);
    }
    addModule(module) {
        if (this.modules[module.name]) {
            console.warn(`Duplicate validation module [${module.name}]`);
        }
        this.modules[module.name] = module;
    }
    removeModule(identifier) {
        const module = this.modules[identifier];
        delete this.modules[identifier];
        for (const key of Object.keys(module.validators)) {
            delete this.errors[key];
        }
        this.invokeCallbacks();
    }
    onValidate(callback) {
        this.modules._.onValidate = callback;
    }
    touch(key) {
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
    invokeCallbacks() {
        for (const callback of Object.values(this.modules).map(m => m.onValidate)) {
            callback && callback(this.errors);
        }
    }
    getValidationResult(validator) {
        let result = null;
        try {
            result = validator();
        }
        catch (e) {
            if (e instanceof ValidationError) {
                result = e.message;
            }
            else {
                throw e;
            }
        }
        return result;
    }
}
