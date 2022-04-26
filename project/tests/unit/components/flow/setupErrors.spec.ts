import { CAPABILITIES } from '@movici-flow-common/api';
import {
  ProjectInvalid,
  ProjectNameNotProvided,
  ScenarioInvalid,
  ScenarioNameNotProvided,
  SummaryEntityGroupNotFound,
  SummaryNotFound,
  UserNotFound,
  ViewHasNoScenario,
  ViewInvalid,
  ViewNotInProject,
  ViewNotInScenario
} from '@movici-flow-common/errors';
import defaultStore from '@movici-flow-common/store';
import {
  initFlowStores,
  flowStore,
  flowVisualizationStore
} from '@movici-flow-common/store/store-accessor';
import {
  Backend,
  DatasetSummary,
  Project,
  ShortScenario,
  UUID,
  View
} from '@movici-flow-common/types';
import { ComposableVisualizerInfo } from '@movici-flow-common/visualizers/VisualizerInfo';

// eslint-disable-next-line
const dummy_projects = require('../data/dummy_projects.json') as Project[],
  // eslint-disable-next-line
  dummy_scenarios = require('../data/dummy_scenarios.json') as ShortScenario[],
  // eslint-disable-next-line
  dummy_views = require('../data/dummy_views.json') as View[],
  // eslint-disable-next-line
  dummy_summary = require('../data/dummy_summary.json') as DatasetSummary,
  getCapabilities = () => {
    return [CAPABILITIES.PROJECTS, CAPABILITIES.USER];
  };

// Cheatsheet
// - dummy_views[0] //
//   | - no scenario, therefore no project
// - dummy_views[1]
//   | - dummy_scenarios[0]
//       | - dummy_projects[0]
// - dummy_views[2]
//   | - scenario is invalid

describe('Setup errors of Flow Store', () => {
  beforeEach(() => {
    initFlowStores(defaultStore);
    flowStore.setApiClient({
      user: {
        get: async () => null
      },
      project: {
        list: async () => dummy_projects
      },
      scenario: {
        get: async (uuid: UUID) => dummy_scenarios.find(s => s.uuid === uuid),
        list: async () => dummy_scenarios
      },
      summary: {
        getDataset: async datasetUUID => (datasetUUID === 'valid_dataset' ? dummy_summary : null)
      },
      getCapabilities
    } as Backend);
  });

  it('UserNotFound', async () => {
    await expect(flowStore.setupUser()).rejects.toThrow(UserNotFound);
  });

  it('ProjectNameNotProvided', async () => {
    await expect(
      flowStore.setupProjects({ currentProjectName: '', needProject: true })
    ).rejects.toThrow(ProjectNameNotProvided);

    await expect(
      flowStore.setupProjects({ currentProjectName: null, needProject: true })
    ).rejects.toThrow(ProjectNameNotProvided);

    await expect(flowStore.setupProjects({ needProject: true })).rejects.toThrow(
      new ProjectNameNotProvided()
    );
  });

  it('ProjectInvalid', async () => {
    await expect(
      flowStore.setupProjects({ currentProjectName: 'invalid_project', needProject: true })
    ).rejects.toThrow(ProjectInvalid);
  });

  it('ScenarioNameNotProvided', async () => {
    await expect(
      flowStore.setupScenarios({
        currentScenarioName: '',
        needScenario: true
      })
    ).rejects.toThrow(ScenarioNameNotProvided);

    await expect(
      flowStore.setupScenarios({
        currentScenarioName: null,
        needScenario: true
      })
    ).rejects.toThrow(ScenarioNameNotProvided);

    await expect(
      flowStore.setupScenarios({
        needScenario: true
      })
    ).rejects.toThrow(ScenarioNameNotProvided);
  });

  it('ScenarioInvalid', async () => {
    await expect(
      flowStore.setupScenarios({ currentScenarioName: 'invalid_scenario', needScenario: true })
    ).rejects.toThrow(ScenarioInvalid);
  });

  it('ViewHasNoScenario', async () => {
    // dummy_views[0].scenario_uuid is undefined
    await expect(
      flowStore.setupFlowStoreByView({ view: dummy_views[0], config: {} })
    ).rejects.toThrow(ViewHasNoScenario);

    // dummy_views[2].scenario_uuid = invalid_scenario
    await expect(
      flowStore.setupFlowStoreByView({ view: dummy_views[2], config: {} })
    ).rejects.toThrow(ViewHasNoScenario);
  });

  it('ViewInvalid', async () => {
    await expect(flowVisualizationStore.getViewById('invalid_view')).rejects.toThrow(ViewInvalid);
  });

  it('ViewNotInScenario', async () => {
    // dummy_views[1].scenario_uuid !== dummy_scenarios[0].uuid
    await expect(
      flowStore.setupFlowStoreByView({
        view: dummy_views[1],
        config: { currentScenarioName: dummy_scenarios[0].name }
      })
    ).rejects.toThrow(ViewNotInScenario);
  });

  it('ViewNotInProject', async () => {
    // dummy_views[1].scenario_uuid === dummy_scenarios[1].uuid
    await expect(
      flowStore.setupFlowStoreByView({
        view: dummy_views[1],
        config: {
          currentScenarioName: dummy_scenarios[1].name,
          currentProjectName: 'invalid_project'
        }
      })
    ).rejects.toThrow(ViewNotInProject);
  });

  it('SummaryNotFound', async () => {
    await expect(
      flowStore.getDatasetSummary({ datasetUUID: 'invalid_dataset', scenarioUUID: null })
    ).rejects.toThrow(SummaryNotFound);
  });

  it('SummaryEntityGroupNotFound', async () => {
    const info = {
        datasetUUID: 'valid_dataset',
        entityGroup: 'invalid_entity',
        datasetName: 'valid_dataset'
      } as ComposableVisualizerInfo & { datasetUUID: string },
      summary = await flowStore.getDatasetSummary({
        datasetUUID: info.datasetUUID,
        scenarioUUID: null
      });

    await expect(flowStore.getEntitySummary({ info, summary })).rejects.toThrow(
      SummaryEntityGroupNotFound
    );
  });
});
