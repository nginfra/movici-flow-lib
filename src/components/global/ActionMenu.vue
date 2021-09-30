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
      @click="toggle"
    >
      <span class="ellipsis">
        <b-icon size="is-small" pack="far" icon="ellipsis-v"></b-icon>
      </span>
    </div>
    <div ref="popupRef" class="dropdown-menu" :style="style" v-show="visible">
      <div class="dropdown-content">
        <a
          v-for="(item, index) in value"
          :key="index"
          :focusable="false"
          :disabled="item.isDisabled ? item.isDisabled() : null"
          :class="item.colorScheme"
          @click="emitAndClose(item.event, $event)"
          class="dropdown-item"
        >
          <b-icon :icon="item.icon" :pack="item.iconPack || 'far'" class="mr-2"></b-icon>
          <span>
            {{ item.label }}
          </span>
        </a>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Ref } from 'vue-property-decorator';
import FixedPosition from '../../mixins/FixedPosition';

export interface ActionMenuItem {
  icon?: string;
  iconPack?: string;
  label: string;
  event: string;
  colorScheme?: string;
  isDisabled?: () => boolean;
}

@Component({ name: 'MovActionMenu' })
export default class MovActionMenu extends Mixins(FixedPosition) {
  @Prop({ default: [] }) readonly value!: ActionMenuItem[];
  @Ref('anchorRef') declare readonly anchorRef: HTMLElement;
  @Ref('popupRef') declare readonly popupRef: HTMLElement;
  adjust = {
    top: -12,
    left: 8
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
    .ellipsis {
      cursor: pointer;
    }
  }

  .dropdown-menu {
    a.dropdown-item {
      color: $black;
      font-size: 0.8em;
      &:hover {
        color: $primary;
        background-color: $primary-invert;
        .icon {
          color: $primary;
        }
      }
      &.danger {
        &:hover {
          color: $danger;
          background-color: $danger-invert;
          .icon {
            color: $danger;
          }
        }
      }
      &.info {
        &:hover {
          color: $info;
          background-color: $info-invert;
          .icon {
            color: $info;
          }
        }
      }
    }
  }
}
</style>
