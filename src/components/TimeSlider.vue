<template>
  <div class="timeslider" v-if="timelineInfo">
    <o-field>
      <o-slider
        :modelValue="modelValue"
        @update:modelValue="$emit('update:modelValue', $event)"
        tooltip-variant="black"
        :min="timelineInfo.start_time"
        :max="timelineInfo.start_time + timelineInfo.duration"
        :custom-formatter="toFormattedDateTime"
        :tooltip="tooltip"
        :variant="variant"
        rounded
      />
    </o-field>
    <div class="time-ticks" v-if="timelineInfo">
      <strong>{{ toFormattedDateTime(timelineInfo.start_time) }}</strong>
      <p>{{ toFormattedDateTime(modelValue) }}</p>
      <strong>{{ toFormattedDateTime(timelineInfo.start_time + timelineInfo.duration) }}</strong>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TimeOrientedSimulationInfo } from "@movici-flow-common/types";

const props = withDefaults(
  defineProps<{
    modelValue: number;
    timelineInfo: TimeOrientedSimulationInfo;
    variant?: string;
    tooltip?: boolean;
    customTimeFormat?: (val: number) => string;
  }>(),
  {
    variant: "primary",
    tooltip: true,
    customTimeFormat: (val: number) => new Date(val * 1000).toLocaleString("NL-nl"),
  }
);

function toFormattedDateTime(relativeTime: number) {
  return props.customTimeFormat(
    relativeTime * props.timelineInfo.time_scale + props.timelineInfo.reference_time
  );
}
</script>

<style lang="scss" scoped>
.time-ticks {
  display: flex;
  justify-content: space-between;
  p {
    text-align: center;
  }
  p + strong {
    text-align: right;
  }
}
.timeslider {
  width: 100%;
}
</style>
