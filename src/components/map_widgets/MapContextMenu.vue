<template>
  <DynamicDataView :value="value" :map="map" :view-state="viewState" startAnchorType="top-left">
    <div ref="focusTarget" tabindex="0" @blur="$emit('close')">
      <MovActionMenu>
        <MovActionMenuItem
          class="is-block"
          v-for="(item, i) in actions"
          :value="item"
          :key="i"
          @emitAndClose="emitAndClose($event.event, $event.value)"
        />
      </MovActionMenu>
    </div>
  </DynamicDataView>
</template>

<script lang="ts">
import { PickInfo } from '@deck.gl/core/lib/deck';
import { ActionMenuItem, CameraOptions } from '@movici-flow-common/types';
import { Component, Prop, Ref, Vue } from 'vue-property-decorator';
import DynamicDataView from './DynamicDataView.vue';

@Component({
  name: 'MapContextMenu',
  components: {
    DynamicDataView
  }
})
export default class MapContextMenu extends Vue {
  @Prop({ type: Object, default: null }) readonly value!: PickInfo<unknown>;
  @Prop({ type: Object, default: null }) readonly map!: mapboxgl.Map;
  @Prop({ type: Object }) readonly viewState?: CameraOptions;
  @Prop({ type: Array, default: () => [] }) readonly actions!: ActionMenuItem[];
  @Ref('focusTarget') readonly focusTarget!: HTMLElement;

  emitAndClose(event: string, value: unknown) {
    this.$emit(event, value);
    this.$emit('close');
  }

  mounted() {
    // the div target is focused and whenever it blurs, it is closed
    this.focusTarget.focus();
  }
}
</script>

<style lang="scss" scoped></style>
