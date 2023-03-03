<template>
  <div class="buttons-container" :class="{ 'is-sticky': isSticky }">
    <div :class="{ 'is-pulled-right': isPulledRight }">
      <o-button
        v-for="(btn, idx) in value"
        :class="{ 'mr-2': idx !== value.length }"
        :key="idx"
        :size="size"
        :disabled="btn.isDisabled"
        @click="$emit(btn.event)"
        :icon-left="btn.icon"
        :icon-pack="btn.iconPack"
        :variant="btn.variant"
      >
        {{ btn.label }}
      </o-button>
      <slot></slot>
    </div>
    <div v-if="isPulledRight" class="is-clearfix"></div>
  </div>
</template>

<script lang="ts">
import { ButtonItem } from '@movici-flow-common/types';
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component({ name: 'MovButtons' })
export default class MovButtons extends Vue {
  @Prop({ type: Boolean, default: false }) readonly isPulledRight!: boolean;
  @Prop({ type: Boolean, default: false }) readonly isSticky!: boolean;
  @Prop({ type: String, default: '' }) readonly size!: string;
  @Prop({ type: Array }) readonly value!: ButtonItem[];
}
</script>

<style scoped lang="scss">
.is-sticky {
  position: sticky;
  bottom: 0;
  z-index: 39;
  div {
    display: flex;
    justify-content: flex-end;
    padding: 1em 0;
    background: $white;
  }
}
</style>
