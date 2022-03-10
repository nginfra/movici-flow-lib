import {
  CameraOptions,
  Project,
  VisualizationMode,
  VisualizationSettings
} from '@movici-flow-common/types';

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
      latitude: 52.177645330654855,
      longitude: 5.2035123109817505,
      zoom: 6.75,
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
