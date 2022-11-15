<template>
  <div id="attribute-chart" style="position: relative">
    <Scatter
      ref="chart"
      :chart-data="chartData"
      :chart-options="options"
      :chart-id="id"
      :css-classes="cssClasses"
      :styles="styles"
    />
  </div>
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
  TooltipItem,
  ChartEvent
} from 'chart.js';
import annotationPlugin, { AnnotationOptions } from 'chartjs-plugin-annotation';
import { MoviciColors } from '@movici-flow-common/visualizers/maps/colorMaps';
import { ChartConfig } from '@movici-flow-common/visualizers/charts/ChartVisualizer';
import { Formatter, formatValueByDataType } from '@movici-flow-common/utils/format';
import { ChartVisualizerInfo } from '@movici-flow-common/visualizers/VisualizerInfo';

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
  @Prop({ type: Object, required: true }) readonly chartData!: ChartData;
  @Prop({ type: Object, required: true }) readonly chartOptions!: ChartConfig;
  @Prop({ type: Object, default: null }) readonly chartInfo!: ChartVisualizerInfo | null;
  @Prop({ default: '', type: String }) readonly id!: string;
  @Prop({ type: Number, default: 0 }) readonly timestamp!: number;
  @Prop({ type: String, default: '' }) readonly cssClasses!: string;
  @Prop({ type: String, default: 'DOUBLE' }) readonly dataType!: string | null;
  @Prop({ type: Array, default: null }) readonly enums!: string[] | null;
  @Prop({ type: Function, default: defaultCustomTimeFormat })
  readonly customTimeFormat!: (val: number) => string;
  windowHeight = 0;

  get styles() {
    const verticalOverhead = 175, // px
      boxFillHeight = 2 / 5,
      chartHeight = Math.max(Math.floor(this.windowHeight * boxFillHeight - verticalOverhead), 150);

    return {
      height: chartHeight + 'px',
      position: 'relative'
    };
  }

  get options(): ChartOptions {
    let tooltip: HTMLElement | null = null;

    const rv: ChartOptions = {
      ...this.chartOptions,
      responsive: true,
      interaction: {
        intersect: true,
        mode: 'nearest'
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
        },
        legend: {
          onHover: (event, item) => {
            if (tooltip) return;

            const parent = document.getElementById('attribute-chart');

            if (parent) {
              tooltip = createTooltip({
                parent,
                event,
                text: this.getLegendTooltipContent(item)
              });
            }
          },
          onLeave: () => {
            if (tooltip) {
              tooltip.remove();
              tooltip = null;
            }
          }
        }
      }
    };

    return rv;
  }

  getLegendTooltipContent(legendItem: { datasetIndex: number; text: string }) {
    const info = this.chartInfo?.items[legendItem.datasetIndex];
    if (!info) {
      return legendItem.text;
    }
    return `${info.datasetName} -> ${info.entityGroup} -> [${info.entityId}] ${info.name}`;
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

  setWindowHeight() {
    this.windowHeight = window.innerHeight;
  }

  mounted() {
    this.setWindowHeight();
    this.$nextTick(() => {
      window.addEventListener('resize', this.setWindowHeight);
    });
  }

  beforeDestroy() {
    window.removeEventListener('resize', this.setWindowHeight);
  }
}

function createTooltip({
  parent,
  event,
  text
}: {
  parent: HTMLElement;
  event: ChartEvent;
  text: string;
}) {
  const tooltip = document.createElement('span');
  Object.assign(tooltip.style, {
    position: 'absolute',
    left: event.x + 'px',
    top: event.y + 'px',
    color: 'white',
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: '5px',
    transform: 'translate(-50%, -120%)',
    padding: '2px 10px',
    fontFamily: '"Source Sans Pro", sans-serif',
    pointerEvents: 'none',
    fontSize: '.85em'
  });
  tooltip.textContent = text;
  parent.appendChild(tooltip);
  return tooltip;
}
</script>

<style scoped lang="scss"></style>
