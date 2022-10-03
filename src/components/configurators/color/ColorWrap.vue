<template>
  <span class="color-wrap">
    <span
      class="clicker"
      :class="{ active }"
      :style="{ 'background-color': value }"
      @click="$emit('click')"
    ></span>
    <span class="caret" v-if="caret"></span>
  </span>
</template>

<script lang="ts">
import { MoviciColors } from '@movici-flow-common/visualizers/maps/colorMaps';
import { Component, Vue, Prop } from 'vue-property-decorator';

@Component({ name: 'ColorWrap' })
export default class ColorWrap extends Vue {
  @Prop({ type: String, default: MoviciColors.GREEN }) value!: string;
  @Prop({ type: Boolean, default: false }) active!: boolean;
  @Prop({ type: Boolean, default: false }) caret!: boolean;
}
</script>

<style lang="scss" scoped>
.color-wrap {
  &:hover {
    .caret {
      border-color: $grey-light $grey-light transparent transparent;
    }
    .clicker {
      border-color: $grey-light;
    }
  }
  .clicker {
    @include border-radius;
    cursor: pointer;
    border: 2px solid $white-ter;
    min-width: 30px;
    height: 30px;
    line-height: unset;
    &.active {
      border-color: $primary;
    }
  }
  .caret {
    position: absolute;
    width: 0;
    height: 0;
    top: 9px;
    right: -8px;
    border: 4px solid $black;
    border-color: $white-ter $white-ter transparent transparent;
    transform-origin: 0 0;
    transform: rotate(45deg);
  }
}
</style>
