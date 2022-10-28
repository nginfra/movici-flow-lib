<template>
  <MovModal :title="title" :active="active" @close="$emit('close')">
    <template v-slot:content>
      <div class="column">
        <b-field
          v-for="field in fields"
          :key="field.name"
          :label="field.name"
          :message="errors[field.name] || ''"
          :type="{ 'is-danger': errors[field.name] }"
        >
          <b-input
            v-if="field.type === 'text'"
            :value="local[field.boundVariable]"
            @input="local[field.boundVariable] = $event"
            :placeholder="field.name"
          />
          <b-select
            v-else-if="field.type === 'choice'"
            :value="local[field.boundVariable]"
            @input="local[field.boundVariable] = $event"
            :placeholder="field.name"
          >
            <option v-for="choice in field.choices" :value="choice" :key="choice">
              {{ choice }}
            </option>
          </b-select>
        </b-field>
      </div>
      <MovButtons
        isPulledRight
        :value="buttons"
        @delete="onDelete"
        @save="saveAndClose"
      ></MovButtons>
    </template>
  </MovModal>
</template>

<script lang="ts">
import upperFirst from 'lodash/upperFirst';
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { ButtonItem, Field } from '@movici-flow-common/types';

@Component({ name: 'EditModal' })
export default class EditModal<T> extends Vue {
  @Prop({ type: Boolean }) readonly active!: boolean;
  @Prop({ type: Object }) readonly value!: T;
  @Prop({ type: Array }) readonly fields!: Field<T>[];
  @Prop({ type: String }) readonly resource!: string;
  @Prop({
    type: String,
    default: 'add',
    validator(value: unknown): boolean {
      if (typeof value === 'string') {
        return value == 'add' || value == 'edit';
      }
      return false;
    }
  })
  readonly mode!: 'add' | 'edit';
  local: T | null = null;
  shouldValidate = false;

  get buttons(): ButtonItem[] {
    const buttons =
      this.mode === 'edit'
        ? [
            {
              colorScheme: 'is-danger',
              label: '' + this.$t('actions.delete'),
              icon: 'times',
              iconPack: 'fas',
              event: 'delete'
            }
          ]
        : [];

    buttons.push({
      colorScheme: 'is-primary',
      label: '' + this.$t('actions.save'),
      icon: 'fa-mov-save',
      iconPack: 'fak',
      event: 'save'
    });

    return buttons;
  }

  get title() {
    return upperFirst(this.mode) + ' ' + this.resource;
  }

  get hasErrors() {
    return Object.keys(this.errors).length;
  }

  get requiredFields() {
    return this.fields.filter(f => f.required);
  }

  get errors(): Record<string, string> {
    if (!this.shouldValidate) return {};
    const errors: Record<string, string> = {};
    for (let field of this.requiredFields) {
      if (!this.local?.[field.boundVariable]) {
        errors[field.name] = `${field.name} is a required field`;
      }
    }
    return errors;
  }

  created() {
    this.assignLocal();
  }
  @Watch('value')
  assignLocal() {
    this.local = Object.assign({}, this.value);
  }

  saveAndClose() {
    const out = this.validateBeforeSave();
    if (out) {
      this.$emit('input', out);
      this.$emit('close');
    }
  }

  validateBeforeSave() {
    this.shouldValidate = true;
    if (this.hasErrors) return null;
    return this.local;
  }
  onDelete() {
    this.$emit('close');
    this.$emit('delete', this.local);
  }
}
</script>

<style scoped></style>
