import { Component, Prop, Vue } from 'vue-property-decorator';
import FormValidator, { ErrorDict, GlobalErrorDict } from '../utils/FormValidator';

/**
 * Mixin to use with form validation. Any error messages will be made available in the `this.errors`
 * attribute of the component. It is the responsibility of the consumer of this class to create a
 * FormValidator object. This way a validator object can either be created as a data-attribute or
 * passed to the component as a prop. The component can then register their validators as a module
 * to the FormValidator in the mounted hook, and remove their module in the beforeDestroy hook.
 *
 * To make the validation reactive, use the provided `validated` method instead of v-model.
 * This will indicate to the FormValidator that the value has changed (and
 * therefore revalidate the field) before updating the components attribute
 *
 * Alternatively, when using a custom method to handle the `input` event, you can call
 * `this.validator?.touch('someValue')` directly to indicate that a revalidation is necessary
 *
 * To perform the validation of all fields, call`this.validator.validate()`
 *
 * See also `utils/FormValidator.ts`
 *
 * Example usage:
 * ```
 * <template>
 *   <BField :type="{ 'is-danger': errors['someValue'] }" :message="errors['someValue'] || ''">
 *         <BInput
 *           :value="someValue"
 *           @input="validated('someValue', $event)"
 *           @keydown.native.enter="validator.validate()"
 *         />
 *   </BField>
 * </template>
 *
 * <script lang="ts">
 * import { Component, Mixins } from 'vue-property-decorator';
 * import ValidationProvider from './ValidationProvider';
 * import FormValidator from '@movici-flow-common/utils/formValidator';
 *
 * @Component({ name: 'MyComponent' })
 * export default class MyComponent extends Mixins(ValidationProvider) {
 *  validator: FormValidator | null = null;
 *  someValue = '';
 *
 *  mounted() {
 *    this.validator = new FormValidator();
 *    this.validator.addModule({
 *      name: 'MyModule',
 *      validators: {
 *        someValue: () => {
 *          if (!this.someValue) {
 *            return 'Please type a value';
 *          }
 *        }
 *      },
 *
 *      onValidate: e => {
 *        this.errors = e;
 *      }
 *    });
 *  }
 *
 *  beforeDestroy() {
 *    this.validator?.removeModule('MyModule');
 *  }
 * }
 * </script>
 *
 *
 */
@Component
export default class ValidationProvider extends Vue {
  // Must be instantiate by consumers of this class
  @Prop([String]) readonly name!: string;
  validator!: FormValidator | null;
  errors: ErrorDict | GlobalErrorDict = {};

  get hasErrors() {
    for (const err of Object.values(this.errors)) {
      if (typeof err === 'object') {
        if (Object.keys(err).length) return true;
      } else {
        return true;
      }
    }
    return false;
  }

  validated<T extends this, K extends keyof this>(
    key: keyof this,
    value: unknown,
    moduleName?: string
  ) {
    this.validator?.touch(key as string, moduleName);
    this[key] = value as T[K];
  }
}
