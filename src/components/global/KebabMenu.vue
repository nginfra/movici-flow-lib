<template>
  <div
    tabindex="0"
    @blur="visible = false"
    class="dropdown dropdown-menu-animation is-mobile-modal"
  >
    <div
      ref="anchor"
      role="button"
      aria-haspopup="true"
      class="dropdown-trigger"
      @click.stop="toggle()"
    >
      <span class="ellipsis">
        <o-icon size="small" pack="far" :icon="visible ? 'angle-right' : 'ellipsis-v'" />
      </span>
    </div>
    <div :style="style" v-show="visible" ref="fixedposition">
      <MovActionMenu>
        <MovActionMenuItem
          v-for="(item, index) in modelValue"
          :key="index"
          :modelValue="item"
          @action="handleAction"
        />
      </MovActionMenu>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFixedPosition } from "@movici-flow-common/composables/useFixedPosition";
import type { ActionItem } from "@movici-flow-common/types";

defineProps<{
  modelValue: ActionItem[];
}>();

const emit = defineEmits<{
  (e: "action", action: string): void;
  (e: string): void;
}>();

const { anchor, fixedposition, visible, toggle, style } = useFixedPosition({
  overflowClass: "overflox",
  adjust: {
    top: -12,
    left: 4,
  },
});

function handleAction(action: string) {
  emit("action", action);
  emit(action);
  visible.value = false;
}
</script>

<style scoped lang="scss">
.dropdown {
  .dropdown-trigger {
    border: 0;
    background: transparent;
    height: 24px;
    border-radius: 4px;
    &:hover {
      @include hover-grey-bgcolor;
    }
    .ellipsis {
      width: 16px;
      height: 20px;
      font-size: 16px !important;
      cursor: pointer;
    }
  }
}
</style>
