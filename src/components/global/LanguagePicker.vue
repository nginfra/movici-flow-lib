<template>
  <o-field :label="label">
    <o-select :value="value" @input="$emit('input', $event)">
      <option v-for="lang in languages" :key="lang" :value="lang">{{ lang }}</option>
    </o-select>
  </o-field>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import upperFirst from 'lodash/upperFirst';

@Component({ name: 'MovLanguagePicker' })
export default class MovLanguagePicker extends Vue {
  @Prop({ type: String, default: 'en' }) readonly value!: string;
  @Prop({ type: Boolean, default: false }) readonly hasLabel!: boolean;

  languages = ['en', 'nl'];

  get label() {
    if (this.hasLabel) {
      return upperFirst('' + this.$t('settings.selectLanguage'));
    }
    return '';
  }
}
</script>

<style scoped></style>
