import type {
  AttributeSummary,
  DatasetSummary,
  FlowVisualizerType,
} from "@movici-flow-common/types";
import type { FormValidator } from "@movici-flow-common/utils/FormValidator";

export interface VisualizerConfiguratorProps<T> {
  modelValue?: T;
  geometry: FlowVisualizerType;
  validator: FormValidator;
  attributes: AttributeSummary[];
  summary: DatasetSummary;
}
