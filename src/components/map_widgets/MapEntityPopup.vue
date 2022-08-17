<template>
  <DynamicDataView
    :value="value.content.pickInfo"
    :map="map"
    :view-state="viewState"
    :borderPadding="popupBorderPadding"
    tip
    @click="$emit('click')"
  >
    <DataViewContent
      class="p-3"
      :value="value.content"
      :timestamp="timestamp"
      @togglePosition="$emit('toggle')"
      @close="$emit('close')"
      :closable="value.type === 'onClick'"
      dynamic
    />
  </DynamicDataView>
</template>

<script lang="ts">
import { CameraOptions, PopupContent } from '@movici-flow-common/types';
import { Component, Prop, Vue } from 'vue-property-decorator';
import DynamicDataView from './DynamicDataView.vue';
import DataViewContent from './DataViewContent.vue';
import { flowUIStore } from '@movici-flow-common/store/store-accessor';

@Component({
  name: 'MapEntityPopup',
  components: {
    DynamicDataView,
    DataViewContent
  }
})
export default class MapEntityPopup extends Vue {
  @Prop({ type: Object, default: null }) readonly value!: PopupContent;
  @Prop({ type: Object, default: null }) readonly map!: mapboxgl.Map;
  @Prop({ type: Object }) readonly viewState?: CameraOptions;
  @Prop({ type: Number, default: null }) readonly timestamp!: number | null;

  get popupBorderPadding() {
    return {
      left: flowUIStore.collapse ? 0 : 300
    };
  }
}
</script>

<style lang="scss" scoped>
::v-deep {
  .data-content {
    .attributes,
    .label {
      color: $black !important;
    }
  }
}
</style>
