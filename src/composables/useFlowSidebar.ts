import type { FlowLocation, FlowSection, FlowStep, RefLike } from "@movici-flow-lib/types";
import { computed, unref } from "vue";

export function useFlowSidebar({
  location,
  hasProjectCapability,
  actions,
}: {
  location: RefLike<FlowLocation | undefined>;
  hasProjectCapability?: RefLike<boolean>;
  actions?: Partial<Record<FlowStep, () => void>>;
}) {
  function updateSections(
    location: FlowLocation | undefined,
    hasProjectCapability: boolean,
  ): FlowSection[] {
    const sections: FlowSection[] = [];
    const datasetEnabled = !hasProjectCapability || !!location?.projectName;
    const scenarioEnabled = datasetEnabled;
    const visualizationEnabled = scenarioEnabled && !!location?.scenarioName;
    const exportEnabled = datasetEnabled;

    if (hasProjectCapability) {
      sections.push({
        step: "project",
        label: "flow.projects.label",
        icon: "fa-workspace",
        iconPack: "fak",
        enabled: true,
        activate: actions?.["project"],
      });
    }
    sections.push(
      {
        step: "dataset",
        label: "flow.datasets.label",
        icon: "fa-dataset",
        iconPack: "fak",
        enabled: datasetEnabled,
        activate: actions?.["dataset"],
      },
      {
        step: "scenario",
        label: "flow.scenarios.label",
        icon: "fa-scenario",
        iconPack: "fak",
        enabled: scenarioEnabled,
        activate: actions?.["scenario"],
      },
      {
        step: "visualization",
        label: "flow.visualization.label",
        icon: "map",
        iconPack: "far",
        enabled: visualizationEnabled,
        activate: actions?.["visualization"],
      },
      {
        step: "export",
        label: "flow.export.label",
        iconPack: "fal",
        icon: "file-download",
        enabled: exportEnabled,
        activate: actions?.["export"],
      },
    );
    return sections;
  }
  return {
    sections: computed(() => updateSections(unref(location), unref(hasProjectCapability) ?? false)),
  };
}
