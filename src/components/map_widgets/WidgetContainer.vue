<template>
  <div class="data-viewer box popup-fixed" :class="{ collapsed }">
    <o-collapse v-if="collapsable" :open.sync="open" animation="none" aria-id="container">
      <template #trigger>
        <slot name="collapse-title" :collapsed="collapsed"></slot>
      </template>
      <slot name="collapse-content" :collapsed="collapsed"></slot>
    </o-collapse>
    <slot></slot>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component({ name: 'WidgetContainer' })
export default class WidgetContainer extends Vue {
  @Prop({ type: Boolean, default: false }) readonly collapsable!: boolean;
  @Prop({ type: Boolean, default: false }) readonly startCollapsed!: boolean;
  @Prop({ type: Boolean, default: null }) readonly focused!: boolean;
  collapsed_: null | boolean = null;

  get collapsed() {
    return this.collapsed_ ?? this.startCollapsed;
  }
  get open() {
    return !this.collapsed;
  }

  set open(val: boolean) {
    this.collapsed_ = !val;
  }
}
</script>

<style scoped lang="scss">
.popup-fixed {
  &.box {
    min-width: 250px;
    max-width: 500px;
    padding: calc(0.75rem - 2px);
  }

  &.collapsed {
    max-width: 3rem;
    max-height: 3rem;
    &.box {
      min-width: 0;
      padding: 0.5rem;
    }
  }
}
</style>
