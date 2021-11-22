<template>
  <b-field :label="label">
    <b-select :value="value" @input="$emit('input', $event)">
      <option v-for="lang in languages" :key="lang" :value="lang">{{ lang }}</option>
    </b-select>
  </b-field>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import upperFirst from 'lodash/upperFirst';

@Component({ name: 'MovLanguagePicker' })
export default class MovLanguagePicker extends Vue {
  @Prop({ type: String, default: 'en' }) value!: string;
  @Prop({ type: Boolean, default: false }) hasLabel!: boolean;

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
