<template>
  <div class="export-layer-picker">
    <VisualizerElement :headerButtons="[]">
      <template #header>
        <label class="label is-flex-grow-1 pl-1 pr-3" @click="$emit('selectLayer', {})">
          <span class="is-block is-size-6-half text-ellipsis">Custom</span>
        </label>
      </template>
    </VisualizerElement>
    <VisualizerElement
      v-for="layer in layers"
      :key="layer.id"
      :value="layer"
      :headerButtons="['errors']"
      tooltipActive
    >
      <template #header="{ toggleSummary, isOpen }">
        <label class="label is-flex-grow-1 pl-1 pr-3" @click="$emit('selectLayer', layer)">
          <span class="is-block is-size-6-half text-ellipsis">{{ layer.name }}</span>
        </label>
        <span class="export mr-1" @click="toggleSummary">
          <o-icon size="is-small" pack="fas" :icon="isOpen ? 'angle-up' : 'angle-down'" />
        </span>
      </template>
    </VisualizerElement>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { ComposableVisualizerInfo } from '@movici-flow-common/visualizers/VisualizerInfo';
import VisualizerElement from '../widgets/VisualizerElement.vue';

@Component({
  name: 'ExportLayerPicker',
  components: { VisualizerElement }
})
export default class ExportLayerPicker extends Vue {
  @Prop({ type: Array, default: () => [] })
  readonly layers!: ComposableVisualizerInfo[];
}
</script>

<style scoped lang="scss">
.label,
.export {
  cursor: pointer;
}
</style>
