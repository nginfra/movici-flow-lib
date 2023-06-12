<template>
  <div id="attribute-chart" style="position: relative">
    <Scatter
      ref="scatter"
      :data="chartData"
      :options="options"
      :id="id"
      :css-classes="cssClasses"
      :style="styles"
    />
  </div>
</template>

<script setup lang="ts">
import { Scatter } from "vue-chartjs";
import { formatValueByDataType, type Formatter } from "@movici-flow-common/utils/format";
import type { ChartVisualizerInfo } from "@movici-flow-common/visualizers/VisualizerInfo";
import { MoviciColors } from "@movici-flow-common/visualizers/maps/colorMaps";
import type { ChartData, ChartEvent, ChartOptions, TooltipItem, ChartType } from "chart.js";
import {
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  CategoryScale,
} from "chart.js";
import type { AnnotationOptions } from "chartjs-plugin-annotation";
import annotationPlugin from "chartjs-plugin-annotation";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, type CSSProperties } from "vue";
import { useI18n } from "vue-i18n";

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
const { t } = useI18n();

const props = withDefaults(
  defineProps<{
    chartData: ChartData<"scatter">;
    chartOptions: ChartOptions;
    chartInfo: ChartVisualizerInfo;
    timestamp: number;
    cssClasses?: string;
    dataType?: string;
    enums?: string[];
    customTimeFormat?(val: number): string;
  }>(),
  {
    cssClasses: "",
    customTimeFormat: (val: number) => new Date(val * 1000).toLocaleString("NL-nl"),
  }
);
const id = computed(() => props.chartInfo.id);

const scatter = ref<{ chart: ChartJS } | null>(null);

defineExpose({
  getChart: () => scatter.value?.chart,
});

const windowHeight = ref(0);
function updateWindowHeight() {
  windowHeight.value = window.innerHeight;
}
onMounted(() => {
  updateWindowHeight();
  nextTick(() => {
    window.addEventListener("resize", updateWindowHeight);
  });
});
onBeforeUnmount(() => window.removeEventListener("resize", updateWindowHeight));

const styles = computed<CSSProperties>(() => {
  const verticalOverhead = 175, // px
    boxFillHeight = 2 / 5,
    chartHeight = Math.max(Math.floor(windowHeight.value * boxFillHeight - verticalOverhead), 150);

  return {
    height: chartHeight + "px",
    position: "relative",
  };
});

const options = computed(() => {
  let tooltip: HTMLElement | null = null;

  return {
    ...props.chartOptions,
    responsive: true,
    interaction: {
      intersect: true,
      mode: "nearest",
    },
    plugins: {
      annotation: {
        annotations: [getLineAnotation(props.timestamp)],
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<ChartType>) => {
            const labels: string[] = [];

            if (context.parsed.x !== null) {
              labels.push(props.customTimeFormat(context.parsed.x));
            }
            // add enum, units and so on
            labels.push("Value: " + formatValue(context.parsed.y));

            return labels;
          },
        },
      },
      legend: {
        onHover: (event: ChartEvent, item: { datasetIndex: number; text: string }) => {
          if (tooltip) return;

          const parent = document.getElementById("attribute-chart");

          if (parent) {
            tooltip = createTooltip({
              parent,
              event,
              text: getLegendTooltipContent(item),
            });
          }
        },
        onLeave: () => {
          if (tooltip) {
            tooltip.remove();
            tooltip = null;
          }
        },
      },
    },
  } as ChartOptions<"scatter">;
});

function getLegendTooltipContent(legendItem: { datasetIndex: number; text: string }) {
  const info = props.chartInfo?.items[legendItem.datasetIndex];
  if (!info) {
    return legendItem.text;
  }
  return `${info.datasetName} -> ${info.entityGroup} -> [${info.entityId}] ${info.name}`;
}

function formatValue(value: unknown) {
  const formatters: Record<string, Formatter> = {
    NULL: () => "N/A",
    BOOLEAN: (val: unknown) => String(val ? t("misc.yes") : t("misc.no")),
  };
  const enums = props.enums;
  if (enums) {
    formatters.ENUM = (val: unknown) => enums[Number(val)] ?? `N/A (${val})`;
  }
  const datatype = typeof value === "boolean" ? "BOOLEAN" : "DOUBLE";
  return formatValueByDataType(value, datatype, formatters);
}

function getLineAnotation(timestamp: number): AnnotationOptions {
  return {
    type: "line",
    xMin: timestamp,
    xMax: timestamp,
    borderColor: MoviciColors.DARK_GREY,
    borderWidth: 2,
    value: 100,
  };
}

function createTooltip({
  parent,
  event,
  text,
}: {
  parent: HTMLElement;
  event: ChartEvent;
  text: string;
}) {
  const tooltip = document.createElement("span");
  Object.assign(tooltip.style, {
    position: "absolute",
    left: event.x + "px",
    top: event.y + "px",
    color: "white",
    backgroundColor: "rgba(0,0,0,0.8)",
    borderRadius: "5px",
    transform: "translate(-50%, -120%)",
    padding: "2px 10px",
    fontFamily: '"Source Sans Pro", sans-serif',
    pointerEvents: "none",
    fontSize: ".85em",
  });
  tooltip.textContent = text;
  parent.appendChild(tooltip);
  return tooltip;
}
</script>

<style scoped lang="scss"></style>
