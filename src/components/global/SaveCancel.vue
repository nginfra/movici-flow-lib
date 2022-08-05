<template>
  <MovButtons
    :value="buttons"
    :isPulledRight="isPulledRight"
    :isSticky="isSticky"
    :size="size"
    @cancel="$emit('cancel')"
    @save="$emit('save')"
  >
    <slot></slot>
  </MovButtons>
</template>

<script lang="ts">
import { ButtonItem } from '@movici-flow-common/types';
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component({ name: 'MovSaveCancel' })
export default class MovSaveCancel extends Vue {
  @Prop({ type: Boolean, default: false }) readonly isPulledRight!: boolean;
  @Prop({ type: Boolean, default: false }) readonly isSticky!: boolean;
  @Prop({ type: String, default: '' }) readonly size!: string;
  @Prop({ type: Array, default: () => [false, false] }) readonly disableds!: boolean[];

  get buttons(): ButtonItem[] {
    return [
      {
        label: '' + this.$t('actions.cancel'),
        icon: 'times',
        iconPack: 'fas',
        isDisabled: this.disableds?.[0] ?? false,
        event: 'cancel'
      },
      {
        colorScheme: 'is-primary',
        label: '' + this.$t('actions.save'),
        icon: 'fa-mov-save',
        iconPack: 'fak',
        isDisabled: this.disableds?.[1] ?? false,
        event: 'save'
      }
    ];
  }
}
</script>

<style scoped lang="scss"></style>
