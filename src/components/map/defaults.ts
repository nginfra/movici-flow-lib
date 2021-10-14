import { CameraOptions, Project, VisualizationMode, VisualizationSettings } from '@/types';

function defaultProject(): Project {
  return {
    name: 'unknown_project',
    uuid: '<unknown_uuid>',
    display_name: 'Unknown Project'
  };
}

export default {
  viewState(): CameraOptions {
    return {
      latitude: 51.992381,
      longitude: 4.3649092,
      zoom: 10,
      bearing: 0,
      pitch: 0
    };
  },

  visualisationSettings(project?: Project): VisualizationSettings {
    return {
      mode: VisualizationMode.GEOMETRY,
      project: project || defaultProject(),
      scenario: null
    };
  },

  project: defaultProject
};
