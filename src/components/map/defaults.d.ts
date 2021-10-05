import { CameraOptions, Project, VisualizationSettings } from '@/types';
declare function defaultProject(): Project;
declare const _default: {
    viewState(): CameraOptions;
    visualisationSettings(project?: Project | undefined): VisualizationSettings;
    project: typeof defaultProject;
};
export default _default;
