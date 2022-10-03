<template>
  <WidgetContainer class="p-0">
    <DataViewContent
      :value="value.content"
      :timestamp="timestamp"
      :class="{ [value.highlighted]: !!value.highlighted }"
      class="p-3"
      @togglePosition="$emit('toggle')"
      @close="$emit('close')"
      closable
    />
  </WidgetContainer>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import WidgetContainer from './WidgetContainer.vue';
import DataViewContent from './DataViewContent.vue';
import { PopupContent } from '@movici-flow-common/types';

@Component({
  name: 'RightSidePopup',
  components: {
    WidgetContainer,
    DataViewContent
  }
})
export default class RightSidePopup extends Vue {
  @Prop({ type: Object, default: null }) readonly value!: PopupContent;
  @Prop({ type: Number, default: null }) readonly timestamp!: number | null;
}
</script>

<style lang="scss" scoped>
::v-deep {
  .data-content {
    border-radius: 6px;
    border: 2px solid transparent;
    .attributes,
    .label {
      color: $black !important;
    }
    &.onHover {
      .attributes,
      .label {
        color: $grey-dark !important;
      }
    }
    &.onClick {
      border-color: $primary;
      box-shadow: transparentize($primary, 0.5) 0px 0px 5px 0px,
        transparentize($primary, 0.5) 0px 0px 1px 0px;
      .attributes,
      .label {
        color: $black !important;
      }
    }
  }
}
</style>
