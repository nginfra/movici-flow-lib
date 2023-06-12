import { useFlowSidebar } from "@movici-flow-common/composables/useFlowSidebar";
import type { FlowLocation, FlowSection, FlowStep, RefLike } from "@movici-flow-common/types";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref, unref } from "vue";

function findSection(sections: RefLike<FlowSection[]>, toFind: FlowStep) {
  for (const section of unref(sections)) {
    if (section.step === toFind) {
      return section;
    }
  }
}

describe("useFlowSidebar", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  it("has a project section when there is a project capability", () => {
    const { sections } = useFlowSidebar({
      location: { step: "project" },
      hasProjectCapability: true,
    });
    expect(findSection(sections, "project")).not.toBeUndefined();
  });

  it("doesn't have a project section when there is no project capability", () => {
    const { sections } = useFlowSidebar({
      location: { step: "project" },
      hasProjectCapability: false,
    });
    expect(findSection(sections, "project")).toBeUndefined();
  });

  it.each(["project", "dataset", "scenario", "visualization", "export"] as FlowStep[])(
    "activates the %s action",

    (action) => {
      const ActionHandler: Parameters<typeof useFlowSidebar>[0]["actions"] = {
        project: vi.fn(),
        dataset: vi.fn(),
        scenario: vi.fn(),
        visualization: vi.fn(),
        export: vi.fn(),
      };

      const { sections } = useFlowSidebar({
        location: { step: "project" },
        hasProjectCapability: true,
        actions: ActionHandler,
      });
      findSection(sections, action)?.activate?.();
      expect(ActionHandler[action]).toHaveBeenCalledOnce();
    }
  );

  it("has project section enabled", () => {
    const { sections } = useFlowSidebar({
      location: { step: "project" },
      hasProjectCapability: true,
    });
    expect(findSection(sections, "project")?.enabled).toBeTruthy();
  });

  it.each([
    [
      "disabled when no project is selected",
      { location: { step: "project" }, hasProjectCapability: true },
      false,
    ],
    [
      "enabled when there are no project cababilities",
      { location: { step: "dataset" }, hasProjectCapability: false },
      true,
    ],
    [
      "enabled when a project is selected",
      { location: { step: "project", projectName: "some_project" }, hasProjectCapability: false },
      true,
    ],
  ] as [string, Parameters<typeof useFlowSidebar>[0], boolean][])(
    "has dataset and scenario section %s",
    (_, args, expected) => {
      const { sections } = useFlowSidebar({
        ...args,
      });
      expect(findSection(sections, "dataset")?.enabled).toBe(expected);
      expect(findSection(sections, "scenario")?.enabled).toBe(expected);
    }
  );
  it("enables dataset and scenario section when a project is selected", async () => {
    const location = ref<FlowLocation>({ step: "project" });
    const { sections } = useFlowSidebar({ location, hasProjectCapability: true });
    expect(findSection(sections, "dataset")?.enabled).toBe(false);
    expect(findSection(sections, "scenario")?.enabled).toBe(false);

    location.value = { step: "project", projectName: "some_project" };
    expect(findSection(sections, "dataset")?.enabled).toBe(true);
    expect(findSection(sections, "scenario")?.enabled).toBe(true);
  });
  it("enables visualization section when a scenario is selected", async () => {
    const location = ref<FlowLocation>({ step: "scenario", projectName: "someProject" });
    const { sections } = useFlowSidebar({ location, hasProjectCapability: true });
    expect(findSection(sections, "visualization")?.enabled).toBe(false);

    location.value = {
      step: "scenario",
      projectName: "some_project",
      scenarioName: "some_scenario",
    };
    expect(findSection(sections, "visualization")?.enabled).toBe(true);
  });
  it("enables export section when a view is selected", async () => {
    const location = ref<FlowLocation>({
      step: "visualization",
      projectName: "some_project",
      scenarioName: "some_scenario",
    });
    const { sections } = useFlowSidebar({ location, hasProjectCapability: true });
    expect(findSection(sections, "export")?.enabled).toBe(false);

    location.value = {
      step: "visualization",
      projectName: "some_project",
      scenarioName: "some_scenario",
      viewUUID: "view-uuid",
    };
    expect(findSection(sections, "export")?.enabled).toBe(true);
  });
});
