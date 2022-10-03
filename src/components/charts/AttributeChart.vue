<template>
  <Scatter
    ref="chart"
    :chart-data="chartData"
    :chart-options="options"
    :chart-id="id"
    :css-classes="cssClasses"
    :styles="styles"
    :width="width"
    :height="height"
  />
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { Scatter } from 'vue-chartjs/legacy';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  LinearScale,
  CategoryScale,
  PointElement,
  ChartData,
  ChartOptions,
  TooltipItem
} from 'chart.js';
import annotationPlugin, { AnnotationOptions } from 'chartjs-plugin-annotation';
import { MoviciColors } from '@movici-flow-common/visualizers/maps/colorMaps';
import { ChartConfig } from '@movici-flow-common/visualizers/charts/ChartVisualizer';
import { Formatter, formatValueByDataType } from '@movici-flow-common/utils/format';

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  LinearScale,
  CategoryScale,
  PointElement,
  annotationPlugin
);

function defaultCustomTimeFormat(val: number) {
  return 'default: ' + new Date(val * 1000).toLocaleString('NL-nl');
}

@Component({
  name: 'AttributeChart',
  components: {
    Scatter
  }
})
export default class AttributeChart extends Vue {
  @Prop({ type: Object, required: true }) protected chartData!: ChartData;
  @Prop({ type: Object, required: true }) protected chartOptions!: ChartConfig;
  @Prop({ default: '', type: String }) id!: string;
  @Prop({ type: Number, default: 0 }) timestamp!: number;
  @Prop({ type: String, default: '' }) cssClasses!: string;
  @Prop({ type: String, default: 'DOUBLE' }) dataType!: string | null;
  @Prop({ type: Array, default: null }) enums!: string[] | null;
  @Prop({ type: Function, default: defaultCustomTimeFormat })
  readonly customTimeFormat!: (val: number) => string;

  width = 800;
  height = 400;
  styles = {};

  get options(): ChartOptions {
    const rv: ChartOptions = {
      ...this.chartOptions,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        annotation: {
          annotations: [this.getLineAnotation(this.timestamp)]
        },
        tooltip: {
          callbacks: {
            label: (context: TooltipItem<'line'>) => {
              const labels: string[] = [];

              if (context.parsed.x !== null) {
                labels.push(this.customTimeFormat(context.parsed.x));
              }
              // add enum, units and so on
              labels.push('Value: ' + this.formatValue(context.parsed.y));

              return labels;
            }
          }
        }
      }
    };

    return rv;
  }
  formatValue(value: unknown) {
    const formatters: Record<string, Formatter> = {
      NULL: () => 'N/A',
      BOOLEAN: (val: unknown) => String(val ? this.$t('misc.yes') : this.$t('misc.no'))
    };
    const enums = this.enums;
    if (enums) {
      formatters.ENUM = (val: unknown) => enums[Number(val)] ?? `N/A (${val})`;
    }
    const datatype = typeof value === 'boolean' ? 'BOOLEAN' : 'DOUBLE';
    return formatValueByDataType(value, datatype, formatters);
  }

  getLineAnotation(timestamp: number): AnnotationOptions {
    return {
      type: 'line',
      xMin: timestamp,
      xMax: timestamp,
      borderColor: MoviciColors.DARK_GREY,
      borderWidth: 2,
      value: 100
    };
  }
}
</script>

<style scoped lang="scss"></style>
