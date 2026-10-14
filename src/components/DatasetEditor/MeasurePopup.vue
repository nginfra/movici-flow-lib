<template>
  <DynamicDataView
    :model-value="target.pickInfo"
    :map="map"
    :view-state="viewState"
    :border-padding="borderPadding"
    tip
  >
    <div class="data-content p-3">
      <div class="header is-flex is-align-items-center mb-1">
        <label class="label is-size-6 is-flex-grow-1 mr-1">{{ title }}</label>
        <span class="close is-clickable" title="Close" @click.stop="$emit('close')">
          <o-icon pack="far" icon="times" />
        </span>
      </div>
      <table class="attributes">
        <tr v-for="row in rows" :key="row.name" class="is-size-7">
          <td class="name">{{ row.name }}:</td>
          <td class="value has-text-weight-bold">{{ row.value }}</td>
        </tr>
      </table>
    </div>
  </DynamicDataView>
</template>

<script setup lang="ts">
import type { Map } from "mapbox-gl";
import { computed } from "vue";
import type { ViewState } from "@movici-flow-lib/types";
import type { MeasureTarget } from "@movici-flow-lib/composables/useMeasureTool";
import { formatArea, formatLength, type Measurement } from "@movici-flow-lib/utils/measure";
import { snakeToFriendly } from "@movici-flow-lib/utils/filters";
import DynamicDataView from "../mapControls/DynamicDataView.vue";

const props = defineProps<{
  target: MeasureTarget;
  measurement: Measurement;
  map: Map;
  viewState?: ViewState;
  borderPadding?: { left?: number; right?: number };
}>();
defineEmits<{ (e: "close"): void }>();

const title = computed(() => snakeToFriendly(props.target.groupName));

const rows = computed(() =>
  props.measurement.kind === "line"
    ? [
        { name: "Id", value: props.target.id },
        { name: "Length", value: formatLength(props.measurement.length) },
      ]
    : [
        { name: "Id", value: props.target.id },
        { name: "Perimeter", value: formatLength(props.measurement.perimeter) },
        { name: "Area", value: formatArea(props.measurement.area) },
      ],
);
</script>

<style scoped lang="scss">
.data-content {
  max-width: 500px;
  .header {
    min-height: 1.5rem;
    .label {
      margin: 0;
      color: $black;
    }
  }
  .attributes {
    width: 100%;
    color: $black;
    .name {
      text-align: left;
    }
    .value {
      padding-left: 0.75em;
      text-align: right;
    }
  }
  .close {
    width: 24px;
    height: 24px;
    margin-right: -4px;
    &:hover {
      background: $white-ter;
    }
  }
}
</style>
