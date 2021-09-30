<template>
  <div class="has-background-white is-fluid">
    <div class="is-pulled-right mb-4">
      <b-button class="mr-2" @click="onCancel">{{ $t('actions.cancel') }}</b-button>
      <b-button type="is-primary" @click="validateBeforeSave">
        {{ $t('actions.save') }}
      </b-button>
      <div class="is-clearfix"></div>
    </div>
    <div class="is-clearfix"></div>
    <b-field :label="label" :type="{ 'is-danger': !isJsonString(formattedRawData) }">
      <b-input type="textarea" v-model="formattedRawData"></b-input>
    </b-field>
    <div class="is-pulled-right">
      <b-button class="mr-2" @click="onCancel">{{ $t('actions.cancel') }}</b-button>
      <b-button type="is-primary" @click="validateBeforeSave">
        {{ $t('actions.save') }}
      </b-button>
    </div>
    <div class="is-clearfix"></div>
  </div>
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';

@Component({
  name: 'MovRawConfig'
})
export default class MovRawConfig extends Vue {
  @Prop([Object]) value!: unknown;
  @Prop({ type: String }) label!: string;
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

<style lang="scss" scoped>
::v-deep .textarea {
  max-height: unset !important;
  min-height: unset !important;
  height: 75vh;
  width: 100% !important;
  resize: none;
  font-family: monospace;
  color: #000;
  font-size: 0.875em;
  padding: 1.5rem;
  white-space: pre;
  word-wrap: normal;
  background-color: $white !important;
  border-radius: unset;
  // border: none !important;
  overflow: hidden;
  &:hover {
    overflow: auto;
  }
}
</style>
