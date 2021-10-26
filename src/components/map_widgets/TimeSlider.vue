<template>
  <div class="box timeslider" v-if="timelineInfo">
    <b-field>
      <b-slider
        :value="value"
        tooltip-type="is-black"
        @input="$emit('input', $event)"
        :min="timelineInfo.start_time"
        :max="timelineInfo.start_time + timelineInfo.duration"
        :custom-formatter="toFormattedDateTime"
        :tooltip="tooltip"
        rounded
      ></b-slider>
    </b-field>
    <div class="time-ticks" v-if="timelineInfo">
      <strong>{{ toFormattedDateTime(timelineInfo.start_time) }}</strong>
      <p>{{ toFormattedDateTime(value) }}</p>
      <strong>{{ toFormattedDateTime(timelineInfo.start_time + timelineInfo.duration) }}</strong>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { SimulationMode, TimeOrientedSimulationInfo } from '@/flow/types';

function defaultTimelineInfo(): TimeOrientedSimulationInfo {
  return {
    mode: SimulationMode.TIME_ORIENTED,
    start_time: 0,
    reference_time: 0,
    time_scale: 1,
    duration: 86400
  };
}
@Component({
  name: 'TimeSlider'
})
export default class TimeSlider extends Vue {
  @Prop({ type: Number, default: 0 }) readonly value!: number;
  @Prop({ type: Boolean, default: true }) readonly tooltip!: boolean;
  @Prop({ type: Object, default: () => defaultTimelineInfo() })
  readonly timelineInfo!: TimeOrientedSimulationInfo;
  @Prop([Function]) readonly customTimeFormat?: (val: number) => string;

  get customFormatter(): (val: number) => string {
    return (
      this.customTimeFormat ||
      ((val: number) => {
        return new Date(val * 1000).toLocaleString('NL-nl');
      })
    );
  }

  toFormattedDateTime(relativeTime: number) {
    return this.customFormatter(
      relativeTime * this.timelineInfo.time_scale + this.timelineInfo.reference_time
    );
  }
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
  width: 75%;
  margin: 0 20px;
}
</style>
