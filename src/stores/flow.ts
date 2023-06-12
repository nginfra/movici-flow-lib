import { FlowRedirect } from "@movici-flow-common/errors";
import type {
  Backend,
  BackendCapability,
  FlowLocation,
  Project,
  Scenario,
  ShortDataset,
  ShortScenario,
  User,
} from "@movici-flow-common/types";
import type { View } from "@movici-flow-common/types/flowVisualizers";
import { defineStore } from "pinia";
import { ref, type Ref } from "vue";

export const useFlowStore = defineStore("flow", () => {
  const projects = ref([]) as Ref<Project[]>;
  const project = ref<Project>();
  const scenarios = ref([]) as Ref<ShortScenario[]>;
  const scenario = ref<ShortScenario | Scenario | null>();
  const datasets = ref([]) as Ref<ShortDataset[]>;
  const views = ref([]) as Ref<View[]>;
  const view = ref<View>();
  const currentUser = ref<User | null>();
  const backend = ref<Backend>();
  const currentLocation = ref<FlowLocation>();
  const initialized = ref(false);

  function hasCapability(query: BackendCapability) {
    return backend.value?.getCapabilities().includes(query) ?? false;
  }
  async function initialize() {
    await loadUser();
    await loadProjects();
  }
  async function loadUser() {
    if (currentUser.value || !hasCapability("user")) return;
    const user = await backend.value?.user.get();
    currentUser.value = user;
  }

  async function loadProjects() {
    if (!hasCapability("projects")) return;
    projects.value = (await backend.value?.project.list()) ?? [];
  }

  async function loadScenarios() {
    if (backend.value && project.value) {
      scenarios.value = (await backend.value.scenario.list(project.value.uuid)) ?? [];
    }
  }

  async function loadDatasets() {
    if (backend.value && project.value) {
      datasets.value = await backend.value.dataset.list(project.value.uuid);
    }
  }

  async function loadViews() {
    if (backend.value && scenario.value) {
      views.value = (await backend.value.view.list(scenario.value.uuid)) ?? [];
    }
  }

  async function updateLocation(location: Partial<FlowLocation>) {
    if (currentLocation.value) {
      await setLocation({ ...currentLocation.value, ...location });
    }
  }

  async function setLocation(location: FlowLocation) {
    if (!initialized.value) {
      await initialize();
      initialized.value = true;
    }

    if (location.step !== currentLocation.value?.step) {
      await enterStep(location);
    }
    currentLocation.value = location;
    await switchResource(location);
  }

  async function enterStep(location: FlowLocation) {
    switch (location.step) {
      case "project":
        return await enterProjectStep();
      case "dataset":
        return await enterDatasetStep(location);
      case "scenario":
        return await enterScenarioStep(location);
      case "visualization":
        return await enterVisualizationStep(location);

      case "workspace":
        throw new FlowRedirect({ ...location, step: "project" });
      case "datasets":
        throw new FlowRedirect({ ...location, step: "dataset" });
      default:
        throw new FlowRedirect({ step: "project" });
    }
  }

  async function switchResource(location: FlowLocation) {
    switch (location.step) {
      case "project":
        return await activateProject(location);
      case "scenario":
        return await activateScenario(location);
      case "visualization":
        return await activateView(location);
    }
  }

  async function enterProjectStep() {
    // When entering Flow for the first time, we load projects in the `initialize` method and don't
    // want to load it again. We only want to load projects again when we come from a different
    // step. We check this by evaluating whether the currentStep has a value.
    if (currentLocation.value?.step) {
      await loadProjects();
    }
  }

  async function enterDatasetStep(location: FlowLocation) {
    await activateProject(location);
    await loadDatasets();
  }

  async function enterScenarioStep(location: FlowLocation) {
    await activateProject(location);
    await loadScenarios();
  }

  async function enterVisualizationStep(location: FlowLocation) {
    await resolveViewLocation(location);
    await activateProject(location);
    await loadScenarios();
    await activateScenario(location);
    await loadViews();
  }

  async function activateProject(location: FlowLocation) {
    if (location.projectName === project.value?.name) return;

    project.value = projects.value.find((p) => p.name == location.projectName);

    if (location.projectName && !project.value) {
      throw new FlowRedirect(
        {
          step: "project",
        },
        `No such project: ${location.projectName}`
      );
    }

    datasets.value = [];
    scenarios.value = [];
    scenario.value = undefined;
    views.value = [];
    view.value = undefined;
  }

  async function activateScenario(location: FlowLocation) {
    if (location.scenarioName === scenario.value?.name) return;
    scenario.value = scenarios.value.find((p) => p.name == location.scenarioName);

    if (location.scenarioName && !scenario.value) {
      throw new FlowRedirect({
        step: "scenario",
        projectName: location.projectName,
      });
    }

    views.value = [];
    view.value = undefined;
  }

  async function activateView(location: FlowLocation) {
    if (location.viewUUID === view.value?.uuid) return;
    view.value = views.value.find((p) => p.uuid == location.viewUUID);
    if (location.viewUUID && !view.value) {
      throw new FlowRedirect({
        step: "visualization",
        projectName: location.projectName,
        scenarioName: location.scenarioName,
      });
    }
  }

  async function resolveViewLocation(location: FlowLocation) {
    if (location.viewUUID && location.projectName && location.scenarioName) return;
    if (!location.viewUUID) return;

    const view = await backend.value?.view.get(location.viewUUID);
    if (!view) throw new FlowRedirect({ step: "project" });

    const scenario = await backend.value?.scenario.get(view.scenario_uuid);
    if (!scenario) throw new FlowRedirect({ step: "project" });

    const project = projects.value.find((p) => p.name == scenario.project_name);
    if (!project) throw new FlowRedirect({ step: "project" });

    throw new FlowRedirect({
      step: "visualization",
      projectName: project.name,
      scenarioName: scenario.name,
      viewUUID: location.viewUUID,
    });
  }

  return {
    backend,
    project,
    projects,
    scenario,
    scenarios,
    datasets,
    loadDatasets,
    views,
    view,
    loadViews,
    currentUser,
    currentLocation,
    hasCapability,
    updateLocation,
    setLocation,
    initialize,
    initialized,
  };
});
