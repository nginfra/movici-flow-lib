import { useFlowStore } from "@movici-flow-lib/stores/flow";
import { createPinia } from "pinia";
import { beforeEach, describe, expect, it, type Mock } from "vitest";
import { markRaw } from "vue";
import { useFakeBackend } from "../backend";
import type {
  FlowLocation,
  FlowStep,
  Project,
  ShortDataset,
  ShortScenario,
  View,
} from "@movici-flow-lib/types";
import { FlowRedirect } from "@movici-flow-lib/errors";
describe("useFlowStore.initialize", () => {
  let store: ReturnType<typeof useFlowStore>;
  beforeEach(() => {
    store = useFlowStore(createPinia());
    store.backend = markRaw(useFakeBackend());
  });
  it("loads user", async () => {
    const sentinel = Symbol("user");
    (store.backend?.user.get as Mock).mockResolvedValue(sentinel);
    await store.initialize();
    expect(store.currentUser).toBe(sentinel);
  });

  it("doesn't load user if not supported", async () => {
    store.backend = markRaw(useFakeBackend(["projects", "geocode"]));
    await store.initialize();
    expect(store.backend.user.get).not.toHaveBeenCalled();
  });

  it("loads projects", async () => {
    const sentinel = Symbol("projects");
    (store.backend?.project.list as Mock).mockResolvedValue(sentinel);
    await store.initialize();
    expect(store.projects).toBe(sentinel);
  });

  it("doesn't load projects if not supported", async () => {
    store.backend = markRaw(useFakeBackend(["user", "geocode"]));
    await store.initialize();
    expect(store.backend.project.list).not.toHaveBeenCalled();
  });
});

describe("useFlowStore.setLocation", () => {
  let store: ReturnType<typeof useFlowStore>;
  beforeEach(async () => {
    store = useFlowStore(createPinia());
    store.backend = markRaw(useFakeBackend());
    store.projects = [{ name: "some_project", uuid: "some-uuid" }] as Project[];
    store.initialized = true;
  });

  it("sets currentStep", async () => {
    expect(store.currentLocation).toBeUndefined();
    await store.setLocation({
      step: "project",
    });
    expect(store.currentLocation).toEqual({ step: "project" });
  });

  it("doesn't load projects when initialized", async () => {
    await store.setLocation({
      step: "project",
    });
    expect(store.backend?.project.list).not.toHaveBeenCalled();
  });

  it("doesn't load projects when already in project", async () => {
    store.currentLocation = { step: "project" };
    await store.setLocation({
      step: "project",
    });
    expect(store.backend?.project.list).not.toHaveBeenCalled();
  });

  it("reloads projects when coming from different step", async () => {
    store.currentLocation = { step: "dataset" };
    await store.setLocation({
      step: "project",
    });
    expect(store.backend?.project.list).toHaveBeenCalledOnce();
  });

  it("loads datasets when entering dataset step", async () => {
    await store.setLocation({
      step: "dataset",
      projectName: "some_project",
    });
    expect(store.backend?.dataset.list).toHaveBeenCalledWith("some-uuid");
  });

  it("loads scenarios when entering scenario step", async () => {
    await store.setLocation({
      step: "scenario",
      projectName: "some_project",
    });
    expect(store.backend?.scenario.list).toHaveBeenCalledWith("some-uuid");
  });

  it("doesn't load scenarios when switching scenarios", async () => {
    store.currentLocation = { step: "scenario" };
    store.scenarios = [
      {
        name: "some_scenario",
      } as ShortScenario,
    ];

    await store.setLocation({
      step: "scenario",
      projectName: "some_project",
      scenarioName: "some_scenario",
    });
    expect(store.backend?.scenario.list).not.toHaveBeenCalled();
  });

  it.each<FlowStep>(["project", "scenario", "dataset", "visualization"])(
    "activates project when entering %s step",
    async (step) => {
      await store.setLocation({
        step,
        projectName: "some_project",
      });
      expect(store.project?.name).toStrictEqual("some_project");
    },
  );

  it.each<FlowStep>(["scenario", "visualization"])(
    "activates scenario when entering %s step",
    async (step) => {
      const scenario = { name: "some_scenario", uuid: "scenario_uuid" };

      (store.backend?.scenario.list as Mock).mockResolvedValue([scenario]);
      await store.setLocation({
        step,
        projectName: "some_project",
        scenarioName: "some_scenario",
      });
      expect(store.scenario).toStrictEqual(scenario);
    },
  );
  it("activates view when entering visualization step", async () => {
    const scenario = { name: "some_scenario", uuid: "scenario_uuid" };
    const view = { uuid: "view_uuid" };
    (store.backend?.scenario.list as Mock).mockResolvedValue([scenario]);
    (store.backend?.view.list as Mock).mockResolvedValue([view]);
    await store.setLocation({
      step: "visualization",
      projectName: "some_project",
      scenarioName: "some_scenario",
      viewUUID: "view_uuid",
    });
    expect(store.view).toStrictEqual(view);
  });
  it("resets resources when switching project", async () => {
    store.currentLocation = { step: "project" };
    store.datasets = [{} as ShortDataset];
    store.scenarios = [{} as ShortScenario];
    store.scenario = {} as ShortScenario;
    store.views = [{} as View];
    store.view = {} as View;
    await store.setLocation({
      step: "project",
      projectName: "some_project",
    });
    expect(store.datasets).toHaveLength(0);
    expect(store.scenarios).toHaveLength(0);
    expect(store.scenario).toBeUndefined();
    expect(store.views).toHaveLength(0);
    expect(store.view).toBeUndefined();
  });

  it("resets views when switching scenario", async () => {
    store.currentLocation = { step: "scenario" };
    store.scenarios = [
      {
        name: "some_scenario",
      } as ShortScenario,
    ];

    store.views = [{} as View];
    store.view = {} as View;
    await store.setLocation({
      step: "scenario",
      projectName: "some_project",
      scenarioName: "some_scenario",
    });
    expect(store.views).toHaveLength(0);
    expect(store.view).toBeUndefined();
  });

  async function assertLocationRedirect(
    location: FlowLocation,
    redirect: FlowLocation,
    store: ReturnType<typeof useFlowStore>,
  ) {
    let throws = false;
    try {
      await store.setLocation(location);
    } catch (e) {
      throws = true;
      expect(e).toBeInstanceOf(FlowRedirect);
      expect((e as FlowRedirect).location).toStrictEqual(redirect);
    }
    expect(throws).toBeTruthy();
  }

  it.each<FlowStep>(["project", "scenario", "dataset", "visualization"])(
    "redirects on invalid project name in %s step",
    async (step) => {
      await assertLocationRedirect({ step, projectName: "invalid" }, { step: "project" }, store);
    },
  );
  it.each<FlowStep>(["scenario", "visualization"])(
    "redirects on invalid scenario name in %s step",

    async (step) => {
      await assertLocationRedirect(
        {
          step,
          projectName: "some_project",
          scenarioName: "invalid",
        },
        { step: "scenario", projectName: "some_project" },
        store,
      );
    },
  );
  it("redirects on invalid view uuid", async () => {
    (store.backend?.scenario.list as Mock).mockResolvedValue([
      {
        name: "some_scenario",
        uuid: "scenario_uuid",
      },
    ]);

    await assertLocationRedirect(
      {
        step: "visualization",
        projectName: "some_project",
        scenarioName: "some_scenario",
        viewUUID: "invalid",
      },
      { step: "visualization", projectName: "some_project", scenarioName: "some_scenario" },
      store,
    );
  });
  it("redirects when view is only given as uuid", async () => {
    const scenario = { name: "some_scenario", uuid: "scenario_uuid", project_name: "some_project" };
    const view = { uuid: "view_uuid", scenario_uuid: "scenario_uuid" };
    (store.backend?.scenario.get as Mock).mockResolvedValue(scenario);
    (store.backend?.view.get as Mock).mockResolvedValue(view);

    await assertLocationRedirect(
      {
        step: "visualization",
        viewUUID: "view_uuid",
      },
      {
        step: "visualization",
        projectName: "some_project",
        scenarioName: "some_scenario",
        viewUUID: "view_uuid",
      },
      store,
    );
  });
});
