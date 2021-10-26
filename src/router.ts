import { Route, RouteConfig } from 'vue-router';
import FlowMain from '@/flow/components/FlowMain.vue';
import FlowProjects from '@/flow/components/FlowProjects.vue';
import FlowDatasets from '@/flow/components/FlowDatasets.vue';
import FlowScenario from '@/flow/components/FlowScenario.vue';
import FlowVisualization from '@/flow/components/FlowVisualization.vue';
import FlowExport from '@/flow/components/FlowExport.vue';

function getFlowRoutes(baseURL: string): RouteConfig[] {
  return [
    {
      path: baseURL,
      name: 'FlowMain',
      redirect: { name: 'FlowProjects' },
      component: FlowMain,
      children: [
        {
          path: 'workspace',
          name: 'FlowProjects',
          component: FlowProjects,
          props: (route: Route) => {
            const { project } = route.query;
            return { currentProjectName: project };
          }
        },
        {
          path: 'datasets',
          name: 'FlowDatasets',
          component: FlowDatasets,
          props: (route: Route) => {
            const { project } = route.query;
            return { currentProjectName: project };
          }
        },
        {
          path: 'scenario',
          name: 'FlowScenario',
          component: FlowScenario,
          props: (route: Route) => {
            const { project, scenario } = route.query;
            return { currentProjectName: project, currentScenarioName: scenario };
          }
        },
        {
          path: 'visualization',
          name: 'FlowVisualization',
          component: FlowVisualization,
          props: (route: Route) => {
            const { project, scenario, view } = route.query;
            return {
              currentProjectName: project,
              currentScenarioName: scenario,
              currentViewUUID: view
            };
          }
        },
        {
          path: 'export',
          name: 'FlowExport',
          component: FlowExport,
          props: (route: Route) => {
            const { project, scenario, view } = route.query;
            return {
              currentProjectName: project,
              currentScenarioName: scenario,
              currentViewUUID: view
            };
          }
        }
      ]
    }
  ];
}

export { getFlowRoutes };
