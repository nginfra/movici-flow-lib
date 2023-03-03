<template>
  <o-field class="is-flex-grow-1 ml-2" :label="$t('flow.visualization.colorConfig.palette')">
    <o-dropdown
      :value="value"
      @input="$emit('input', $event)"
      class="select is-small"
      aria-role="list"
      expanded
    >
      <template #trigger>
        <span class="color-option">
          <o-tooltip variant="black" position="top" :label="currentName">
            <span
              class="color-piece is-size-7"
              v-for="(color, index) in currentColors"
              :style="{ 'background-color': color }"
              :key="index"
            ></span>
          </o-tooltip>
        </span>
      </template>
      <o-dropdown-item
        class="color-option"
        v-for="[index, palette] in validPalettes"
        :value="index"
        :key="index"
        :focusable="false"
        aria-role="listitem"
      >
        <o-tooltip variant="black" position="top" :label="palette.name">
          <span
            class="color-piece"
            v-for="(color, index) in palette.getHexColorsForSize(nSteps)"
            :style="{ 'background-color': color }"
            :key="index"
          />
        </o-tooltip>
      </o-dropdown-item>
    </o-dropdown>
  </o-field>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import ColorPalette from './colorPalettes';

@Component({ name: 'ColorPaletteDropdown' })
export default class ColorPaletteDropdown extends Vue {
  @Prop({ type: Number, default: null }) value!: number | null;
  @Prop({ type: Number, default: 2 }) nSteps!: number;
  @Prop({ type: Array, default: () => [] }) colorPalettes!: ColorPalette[];
  @Prop({ type: Function, default: () => () => true }) filter!: (palette: ColorPalette) => boolean;

  get currentName() {
    return this.value != null ? this.colorPalettes[this.value].name : 'Select a palette';
  }
  get currentColors() {
    return this.value != null
      ? this.colorPalettes[this.value].getHexColorsForSize(this.nSteps)
      : [];
  }
  get validPalettes(): [number, ColorPalette][] {
    return Array.from(this.colorPalettes.entries()).filter(entry => {
      return this.filter(entry[1]);
    });
  }
}
</script>
<style lang="scss" scoped>
::v-deep {
  .dropdown {
    &.is-active {
      border-color: $primary;
      box-shadow: 0 0 0 0.125em rgba($primary, 0.25);
    }
    .dropdown-trigger {
      @include border-radius;
      cursor: pointer;
      border: 2px solid $white-ter;
      line-height: unset;
      background-color: $white;
      user-select: none;
      .color-option {
        .tooltip-trigger {
          padding: 10px 20px 10px 0 !important;
        }
      }
      &:hover {
        border-color: $grey-light;
        &::after {
          border-color: $grey-darker;
        }
      }
    }

    .color-option {
      display: block;
      line-height: 6px;
      text-align: center;
      height: 28px;
      padding: 0;

      .b-tooltip {
        width: 100%;
        height: 28px;
        .tooltip-content {
          line-height: initial !important;
        }
        .tooltip-trigger {
          padding: 10px 0;
        }
      }
      &.is-active {
        background-color: unset;
      }
      span.color-piece {
        height: 8px;
        width: 16px;
        display: inline-block;
      }
    }
  }
}
</style>
