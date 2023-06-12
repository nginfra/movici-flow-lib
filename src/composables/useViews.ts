import { useFlowStore } from "@movici-flow-common/stores/flow";
import { useParsedViewStore } from "@movici-flow-common/stores/parsedView";
import type { RefLike, Scenario, UUID, ViewPayload, ViewState } from "@movici-flow-common/types";
import {
  ChartVisualizerInfo,
  ChartVisualizerItem,
  ComposableVisualizerInfo,
} from "@movici-flow-common/visualizers/VisualizerInfo";
import { simplifiedCamera } from "@movici-flow-common/visualizers/viewHelpers";
import isEqual from "lodash/isEqual";
import { computed, ref, unref, watch } from "vue";
import { useMoviciSettings } from "../baseComposables/useMoviciSettings";

export function useViews({
  initialViewName,
  scenario,
}: {
  initialViewName: string;
  scenario: RefLike<Scenario | null>;
}) {
  const defaultViewName = useMoviciSettings().settings.defaultViewName;
  const store = useFlowStore();
  const viewName = ref(initialViewName);
  const parsedView = useParsedViewStore();

  function reset() {
    viewName.value = defaultViewName;
    parsedView.reset();
  }
  async function createView() {
    const uuid = await doCreate();
    if (!uuid) return false;
    await store.loadViews();
    await loadView(uuid);
    return true;
  }

  async function doCreate(): Promise<UUID | null> {
    const scenarioUUID = store.scenario?.uuid;
    if (!scenarioUUID) return null;
    const result = await store.backend?.view.create(scenarioUUID, serializedView.value);
    return result?.view_uuid ?? null;
  }

  async function updateView() {
    const uuid = store.view?.uuid;
    if (!uuid) return false;
    const result = !!(await store.backend?.view.update(uuid, serializedView.value));
    if (result) Object.assign(store.view!, serializedView.value);
    return result;
  }
  async function deleteView() {
    if (!store.view) return;
    const result = await store.backend?.view.delete(store.view.uuid);
    if (!result) return;
    reset();
    await store.updateLocation({
      viewUUID: undefined,
    });
  }

  async function loadView(uuid: UUID) {
    await store.updateLocation({ viewUUID: uuid });
  }

  function dumpView(): ViewPayload {
    return {
      name: viewName.value,
      config: {
        version: 1,
        timestamp: parsedView.timestamp,
        visualizers: parsedView.visualizerInfos.map((info) => info.toVisualizerConfig()),
        charts: parsedView.chartInfos.length
          ? parsedView.chartInfos.map((info) => info.toChartConfig())
          : undefined,
        camera: parsedView.viewState ? simplifiedCamera(parsedView.viewState) : undefined,
      },
    };
  }
  function parseView() {
    if (!store.view || !unref(scenario)) {
      reset();
      return;
    }
    const config = store.view.config;

    const datasets =
      unref(scenario)?.datasets.reduce((obj, d) => {
        obj[d.name] = d.uuid;
        return obj;
      }, {} as Record<string, UUID>) ?? {};

    parsedView.visualizerInfos = config.visualizers.map((config) => {
      return ComposableVisualizerInfo.fromVisualizerConfig({
        config,
        datasets,
        scenario: store.scenario,
      });
    });

    parsedView.chartInfos = (config.charts ?? []).map((conf) => {
      return new ChartVisualizerInfo({
        title: conf.title,
        attribute: conf.attribute,
        scenarioUUID: store.scenario?.uuid,
        settings: conf.settings,
        items: conf.items.map((item) => {
          return new ChartVisualizerItem(item);
        }),
      });
    });
    const viewState: ViewState | undefined = config.camera ?? undefined;
    parsedView.initialViewState = config.camera ?? useMoviciSettings().settings.defaultViewState;
    if (viewState) {
      viewState.transitionDuration = 300;
      parsedView.viewState = viewState;
    }
    parsedView.timestamp = config.timestamp ?? 0;
    viewName.value = store.view.name;
  }
  watch(() => [store.view, unref(scenario)], parseView, { immediate: true });
  const serializedView = computed(dumpView);
  const hasPendingChanges = computed(() => {
    if (!store.view) {
      return !!(parsedView.visualizerInfos.length || parsedView.chartInfos.length);
    }
    return !isEqual(
      {
        name: store.view?.name,
        visualizers: store.view?.config?.visualizers,
        charts: store.view?.config?.charts,
      },
      {
        name: serializedView.value.name,
        visualizers: serializedView.value.config?.visualizers,
        charts: serializedView.value.config?.charts,
      }
    );
  });

  return {
    viewName,
    parsedView,
    hasPendingChanges,
    loadView,
    updateView,
    createView,
    deleteView,
  };
}
