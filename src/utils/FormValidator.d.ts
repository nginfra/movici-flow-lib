export declare type ErrorDict = Record<string, string>;
export declare type ValidatorFunc = () => string | void;
interface FormValidatorConfig {
    validators?: Record<string, ValidatorFunc>;
    onValidate?: (e: ErrorDict) => void;
    modules?: ValidationModule[];
}
export declare class ValidationError extends Error {
}
declare type ValidatorCallback = (e: ErrorDict) => void;
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
    private readonly modules;
    errors: ErrorDict;
    constructor(config?: FormValidatorConfig);
    setValidator(key: string, func: ValidatorFunc): void;
    setValidators(validators: Record<string, ValidatorFunc>): void;
    addModule(module: ValidationModule): void;
    removeModule(identifier: string): void;
    onValidate(callback: ValidatorCallback): void;
    touch(key: string): void;
    validate(): void;
    private invokeCallbacks;
    private getValidationResult;
}
export {};
