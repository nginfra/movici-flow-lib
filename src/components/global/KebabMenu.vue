<template>
  <div
    tabindex="0"
    @blur="visible = false"
    class="dropdown dropdown-menu-animation is-mobile-modal"
  >
    <div
      ref="anchorRef"
      role="button"
      aria-haspopup="true"
      class="dropdown-trigger"
      @click="toggle(!visible)"
    >
      <span class="ellipsis">
        <b-icon size="is-small" pack="far" :icon="visible ? 'angle-right' : 'ellipsis-v'"></b-icon>
      </span>
    </div>
    <div :style="style" v-show="visible" ref="popupRef">
      <MovActionMenu>
        <MovActionMenuItem
          v-for="(item, index) in value"
          :key="index"
          :value="item"
          @emitAndClose="emitAndClose($event.event, $event.value)"
        />
      </MovActionMenu>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Ref } from 'vue-property-decorator';
import FixedPosition from '@movici-flow-common/mixins/FixedPosition';
import { ActionMenuItem } from '@movici-flow-common/types';
import MovActionMenuItem from './ActionMenuItem.vue';

@Component({
  name: 'MovKebabMenu',
  components: {
    MovActionMenuItem
  }
})
export default class MovKebabMenu extends Mixins(FixedPosition) {
  @Prop({ type: Array, default: () => [] }) readonly value!: ActionMenuItem[];
  @Ref('anchorRef') declare readonly anchorRef: HTMLElement;
  @Ref('popupRef') declare readonly popupRef_: Vue;
  adjust = {
    top: -12,
    left: 4
  };

  emitAndClose(event: string, value: unknown) {
    this.$emit(event, value);
    this.visible = false;
  }
}
</script>

<style scoped lang="scss">
.dropdown {
  .dropdown-trigger {
    border: 0;
    background: transparent;
    height: 24px;
    .ellipsis {
      width: 16px;
      height: 20px;
      font-size: 16px !important;
      cursor: pointer;
    }
  }
}
</style>
