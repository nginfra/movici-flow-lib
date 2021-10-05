import { FlowMain } from '@/components/js/flowmain.js';
import { FlowProjects } from '@/components/js/flowprojects.js';
import { FlowDatasets } from '@/components/js/flowdatasets.js';
import { FlowScenario } from '@/components/js/flowscenario.js';
import { FlowVisualization } from '@/components/js/flowvisualization.js';
import { FlowExport } from '@/components/js/flowexport.js';
function getFlowRoutes(baseURL) {
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
                    props: (route) => {
                        const { project } = route.query;
                        return { currentProjectName: project };
                    }
                },
                {
                    path: 'datasets',
                    name: 'FlowDatasets',
                    component: FlowDatasets,
                    props: (route) => {
                        const { project } = route.query;
                        return { currentProjectName: project };
                    }
                },
                {
                    path: 'scenario',
                    name: 'FlowScenario',
                    component: FlowScenario,
                    props: (route) => {
                        const { project, scenario } = route.query;
                        return { currentProjectName: project, currentScenarioName: scenario };
                    }
                },
                {
                    path: 'visualization',
                    name: 'FlowVisualization',
                    component: FlowVisualization,
                    props: (route) => {
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
                    props: (route) => {
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
