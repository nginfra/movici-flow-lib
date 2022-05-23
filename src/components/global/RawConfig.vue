<template>
  <div class="has-background-white is-fluid">
    <b-field :label="label" :type="{ 'is-danger': !isJsonString(formattedRawData) }">
      <b-input custom-class="monospace" type="textarea" v-model="formattedRawData"></b-input>
    </b-field>
    <MovSaveCancel is-sticky @save="validateBeforeSave" @cancel="onCancel"></MovSaveCancel>
  </div>
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';

@Component({ name: 'MovRawConfig' })
export default class MovRawConfig extends Vue {
  @Prop({ type: Object, default: () => new Object() }) readonly value!: unknown;
  @Prop({ type: String }) readonly label!: string;
  errors: string[] = [];
  formattedRawData = '';
  initialRawData = '';
  minRows = 20;

  isJsonString(str: string) {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }

  @Watch('value', { immediate: true })
  initializeRawConfigFromProp(value: string) {
    this.formattedRawData = JSON.stringify(value, null, 2);
    this.initialRawData = this.formattedRawData;
  }

  validateBeforeSave() {
    if (!this.isJsonString(this.formattedRawData)) {
      this.$emit('error', ['The config contains invalid JSON']);
      return Promise.reject();
    } else {
      this.$emit('save', JSON.parse(this.formattedRawData));
    }
  }

  onCancel() {
    if (this.hasChanges) {
      this.confirmCancel();
    } else {
      this.$emit('cancel');
    }
  }

  confirmCancel() {
    this.$buefy.dialog.confirm({
      message: 'You have unsaved changes, do you want to discard them?',
      confirmText: 'Discard Changes',
      type: 'is-warning',
      hasIcon: true,
      onConfirm: () => this.$emit('cancel')
    });
  }

  get numOfRows() {
    return Math.max(this.minRows, this.formattedRawData.split(/\r\n|\r|\n/).length);
  }

  get hasChanges() {
    return this.formattedRawData !== this.initialRawData;
  }
}
</script>

<style lang="scss" scoped></style>
