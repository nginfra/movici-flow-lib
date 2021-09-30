<template>
  <div>
    <slot name="before"></slot>
    <MovAction
      v-for="(action, idx) in actionList"
      :action="action"
      :key="idx"
      :size="size"
      :disabled="isDisabled(action)"
      :class="additionalClasses"
      @click="$emit(action)"
    ></MovAction>
    <slot name="after"></slot>
  </div>
</template>
<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component({ name: 'MovActionBar' })
export default class MovActionBar extends Vue {
  @Prop({ type: [String, Array] }) readonly actions!: string | string[];
  @Prop({ type: [String, Array] }) readonly disabled?: string | string[];
  @Prop({ type: [String, Array] }) readonly enabled?: string | string[];
  @Prop({ type: String, default: 'is-medium' }) readonly size!: string;
  @Prop({ type: Array, default: () => [] }) readonly additionalClasses!: string[];

  get actionList() {
    if (this.actions)
      if (Array.isArray(this.actions)) {
        return this.actions;
      } else {
        return this.actions.trim().split(' ');
      }
    else return [];
  }

  get disabledList() {
    if (this.disabled)
      if (Array.isArray(this.disabled)) {
        return this.disabled;
      } else {
        return this.disabled.trim().split(' ');
      }
    else return [];
  }

  get enabledList() {
    if (this.enabled)
      if (Array.isArray(this.enabled)) {
        return this.enabled;
      } else {
        return this.enabled.trim().split(' ');
      }
    else return [];
  }

  isDisabled(action: string) {
    if (!this.enabled && !this.disabled) return false;

    if (this.enabled) {
      return !this.enabledList.includes(action);
    }

    if (this.disabled) {
      return this.disabledList.includes(action);
    }
  }
}
</script>
<style scoped></style>
