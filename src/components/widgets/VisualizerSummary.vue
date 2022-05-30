<template>
  <div
    v-if="value"
    class="is-flex is-flex-direction-column summary active"
    :class="{ show: show, 'mb-1': show }"
  >
    <span class="name is-size-7 has-text-weight-bold is-flex mb-2" :title="value.name">
      <div class="is-flex-grow-1">{{ value.name }}</div>
    </span>
    <span
      class="type is-size-7 is-italic text-ellipsis"
      :title="`Display as: ${value.settings.type}`"
    >
      <b-icon class="is-tiny mr-2" type="is-small" :icon="typeIcon[0]" :pack="typeIcon[1]" />{{
        value.settings.type
      }}
    </span>
    <span
      class="dataset is-size-7 is-italic text-ellipsis"
      :title="`Dataset name: ${value.datasetName}`"
    >
      <b-icon class="is-tiny mr-2" type="is-small" icon="fa-dataset" pack="fak" />{{
        value.datasetName
      }}
    </span>
    <span
      class="entityGroup is-size-7 is-italic text-ellipsis"
      :title="`Entity group: ${value.entityGroup}`"
    >
      <b-icon class="is-tiny mr-2" type="is-small" icon="object-group" pack="far" />{{
        value.entityGroup
      }}
    </span>
    <span
      class="attribute is-size-7 is-italic text-ellipsis"
      v-if="colorByValue"
      :title="`Based on: ${colorByValue.attribute.name}`"
    >
      <b-icon class="is-tiny mr-2" type="is-small" icon="file" pack="far" />{{
        colorByValue.attribute.name
      }}
    </span>
    <span
      class="color byValue buckets is-flex is-align-items-center"
      v-if="colorByValue && colorByValue.type === 'buckets'"
      title="Colors"
    >
      <b-icon class="is-tiny mr-2" type="is-small" icon="fill" pack="far" />
      <span
        v-for="(color, index) in colorByValue.colors"
        :style="{ 'background-color': convertColor(color[1]) }"
        :key="index"
      />
    </span>
    <span
      class="color byValue gradient is-flex is-align-items-center"
      v-if="colorByValue && colorByValue.type === 'gradient'"
      title="Color gradient"
    >
      <b-icon class="is-tiny mr-2" type="is-small" icon="fill" pack="far" />
      <span
        :style="{
          background: linearGradient,
          width: colorByValue.colors.length * 12 + 'px'
        }"
      />
    </span>
    <span class="color static is-flex is-align-items-center" v-if="colorStatic" title="Color">
      <b-icon class="is-tiny mr-2" type="is-small" icon="fill" pack="far" />
      <span :style="{ 'background-color': convertColor(colorStatic.color) }" />
    </span>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { ComposableVisualizerInfo } from '@movici-flow-common/visualizers/VisualizerInfo';
import { colorTripleToHex } from '@movici-flow-common/visualizers/maps/colorMaps';
import { FlowVisualizerType, RGBAColor } from '@movici-flow-common/types';

@Component({ name: 'VisualizerSummary' })
export default class VisualizerSummary extends Vue {
  @Prop({ type: Object, required: true }) readonly value!: ComposableVisualizerInfo;
  @Prop({ type: Number, default: 0 }) readonly progress!: number;
  @Prop({ type: Boolean, default: false }) readonly show!: boolean;

  get colorByValue() {
    return this.value?.settings?.color?.byValue;
  }

  get colorStatic() {
    return this.value?.settings?.color?.static;
  }

  get typeIcon() {
    switch (this.value.settings?.type) {
      case FlowVisualizerType.POINTS:
        return ['fa-vis-info-' + FlowVisualizerType.POINTS, 'fak'];
      case FlowVisualizerType.LINES:
        return ['fa-vis-info-' + FlowVisualizerType.LINES, 'fak'];
      case FlowVisualizerType.POLYGONS:
        return ['fa-vis-info-' + FlowVisualizerType.POLYGONS, 'fak'];
      case FlowVisualizerType.ARCS:
        return ['fa-vis-info-' + FlowVisualizerType.ARCS, 'fak'];
      case FlowVisualizerType.ICONS:
        return ['map-marker-alt', 'far'];
      default:
        return [];
    }
  }

  get linearGradient() {
    const gradientString = this.value?.settings?.color?.byValue?.colors
      .map(color => colorTripleToHex(color[1]))
      .join();
    return 'linear-gradient(90deg,' + gradientString + ')';
  }

  convertColor(color: RGBAColor) {
    return colorTripleToHex(color);
  }
}
</script>

<style scoped lang="scss">
.summary {
  min-width: 10rem;
  background: $white;
  box-shadow: rgba(0, 0, 0, 0.1) 0px 4px 12px;
  transition: opacity 0.3s linear, height 0.3s linear, padding 0.3s linear;
  opacity: 0;
  height: 0;
  overflow: hidden;
  padding: 0 0 0 0.5em;

  &.show {
    opacity: 1;
    height: auto;
    padding: 0.5em;
  }

  & > span {
    margin-bottom: 0.125rem;
    &:last-child {
      margin-bottom: 0;
    }

    .icon {
      color: $grey;
      font-weight: 100;
      font-size: 0.75rem;
    }

    &.name {
      div {
        padding-bottom: 2px;
        border-bottom: 1px solid $grey-lighter;
      }
    }

    &.type,
    &.dataset,
    &.entityGroup,
    &.attribute,
    &.color {
      height: 18px;
      max-width: 250px;
      margin-bottom: 2px;
    }
  }
  .static,
  .byValue.buckets {
    span:not(.icon) {
      height: 12px;
      width: 12px;
    }
  }
  .byValue.gradient {
    span:not(.icon) {
      height: 12px;
      min-width: 48px;
    }
  }
}
</style>
