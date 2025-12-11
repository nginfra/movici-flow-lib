import type {
  AttributeSummary,
  DatasetSummary,
  FlowVisualizerOptions,
  FlowVisualizerType,
  ScenarioDataset,
} from "@movici-flow-lib/types";
import type { IFormValidator } from "@movici-flow-lib/utils/FormValidator";
import type { InjectionKey, Ref } from "vue";

export const attributesInjection = Symbol("attributes") as InjectionKey<
  Ref<AttributeSummary[] | undefined>
>;
export const datasetsInjection = Symbol("datasets") as InjectionKey<Ref<ScenarioDataset[]>>;
export const geometryInjection = Symbol("geometry") as InjectionKey<Ref<FlowVisualizerType>>;
export const settingsInjection = Symbol("settings") as InjectionKey<
  Ref<FlowVisualizerOptions | null>
>;
export const summaryInjection = Symbol("summary") as InjectionKey<Ref<DatasetSummary>>;
export const validatorInjection = Symbol("validator") as InjectionKey<IFormValidator>;
