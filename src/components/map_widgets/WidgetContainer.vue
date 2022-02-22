<template>
  <div class="popup-fixed" :class="{ collapsed: collapsedComputed }">
    <div class="data-viewer box">
      <b-collapse v-if="collapsable" :open.sync="open" animation="none" aria-id="container">
        <template #trigger>
          <slot name="collapse-title" :collapsed="collapsedComputed"></slot>
        </template>
        <slot name="collapse-content" :collapsed="collapsedComputed"></slot>
      </b-collapse>
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component({
  name: 'WidgetContainer'
})
export default class WidgetContainer extends Vue {
  @Prop({ type: Boolean }) collapsable!: boolean;
  @Prop({ type: Boolean, default: false }) startCollapsed!: boolean;
  collapsed_: null | boolean = null;

  get collapsedComputed() {
    return this.collapsed_ ?? this.startCollapsed;
  }
  get open() {
    return !this.collapsedComputed;
  }

  set open(val: boolean) {
    this.collapsed_ = !val;
  }
}
</script>

<style scoped lang="scss">
.popup-fixed {
  .box {
    min-width: 250px;
    max-width: 500px;
    padding: 0.75rem;
  }
  &.collapsed {
    max-width: 3rem;
    max-height: 3rem;
    .box {
      min-width: 0;
      padding: 0.5rem;
    }
  }
}
</style>
