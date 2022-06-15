<template>
  <b-field class="is-flex-grow-1 ml-2" :label="$t('flow.visualization.colorConfig.palette')">
    <b-dropdown
      :value="value"
      @input="$emit('input', $event)"
      class="select is-small"
      aria-role="list"
      expanded
    >
      <template #trigger>
        <span class="color-option">
          <b-tooltip type="is-black" position="is-top" :label="colorPalettes[value].name">
            <span
              class="color-piece is-size-7"
              v-for="(color, index) in colorPalettes[value].getHexColorsForSize(nSteps)"
              :style="{ 'background-color': color }"
              :key="index"
            ></span>
          </b-tooltip>
        </span>
      </template>
      <b-dropdown-item
        class="color-option"
        v-for="(item, index) in colorPalettes"
        :value="index"
        :key="index"
        :focusable="false"
        aria-role="listitem"
      >
        <b-tooltip type="is-black" position="is-top" :label="item.name">
          <span
            class="color-piece"
            v-for="(color, index) in item.getHexColorsForSize(nSteps)"
            :style="{ 'background-color': color }"
            :key="index"
          ></span>
        </b-tooltip>
      </b-dropdown-item>
    </b-dropdown>
  </b-field>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import ColorPalettes from './colorPalettes';

@Component({ name: 'ColorPaletteSelector' })
export default class ColorPaletteSelector extends Vue {
  @Prop({ type: Number, default: 0 }) value!: number;
  @Prop({ type: Number, default: 2 }) nSteps!: number;
  @Prop({ type: Array, default: () => [] }) colorPalettes!: ColorPalettes[];
}
</script>
