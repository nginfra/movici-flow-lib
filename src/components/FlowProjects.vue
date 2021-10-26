<template>
  <FlowContainer class="flow-projects">
    <template #leftPanel>
      <ProjectInfoBox @setProject="setProject" class="mb-2" edit />
      <div class="project-info" v-if="currentProject">
        <div class="details is-size-7 mb-3" v-if="details">
          <div class="mb-1" v-for="(prop, key) in details" :key="key">
            <label>{{ $t('flow.projects.details.' + key) }}: </label>
            <span class="value">{{ prop }}</span>
          </div>
        </div>
        <div class="count-details is-size-7 mb-3" v-if="countDetails">
          <div class="mb-1">
            <label>{{ $t('flow.projects.details.dataset_count') }}: </label>
            <router-link custom v-slot="{ navigate }" :to="toDatasets" class="value">
              <a @click="navigate" @keypress.enter="navigate" role="link">
                {{ countDetails.dataset_count }}
              </a>
            </router-link>
          </div>
          <div class="mb-1">
            <label>{{ $t('flow.projects.details.scenario_count') }}: </label>
            <router-link custom v-slot="{ navigate }" :to="toScenario" class="value">
              <a @click="navigate" @keypress.enter="navigate" role="link">
                {{ countDetails.scenario_count }}
              </a>
            </router-link>
          </div>
        </div>
        <div class="description is-size-6 mt-5" v-if="currentProject.description">
          {{ currentProject.description }}
        </div>
      </div>
    </template>
    <template #mainView>
      <template v-if="!currentProject">
        <div class="no-resource">
          <b-image src="/static/no-project.png"></b-image>
          <div class="has-text-centered mt-3">
            <h1 class="is-size-4 has-text-weight-bold">{{ $t('flow.mainView.noProjectTitle') }}</h1>
            <h2 class="is-size-6">{{ $t('flow.mainView.noProjectText') }}</h2>
          </div>
        </div>
      </template>
      <template v-else>
        <MapVis :layer-infos="validLayers" :view-state.sync="viewState">
          <template #control-left="{ map, onViewstateChange, basemap, setBasemap }">
            <SearchBar
              v-if="hasGeocodeCapabilities"
              :map="map"
              :view-state="viewState"
              @update:view-state="onViewstateChange($event)"
            />
            <NavigationControl :value="viewState" @input="onViewstateChange($event)" />
            <BaseMapControl :value="basemap" @input="setBasemap" />
          </template>
        </MapVis>
      </template>
    </template>
  </FlowContainer>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { Project, CameraOptions, Nullable } from '@/flow/types';
import MapVis from '@/flow/components/map/MapVis.vue';
import FlowContainer from './FlowContainer.vue';
import pick from 'lodash/pick';
import defaults from '@/flow/components/map/defaults';
import SearchBar from '@/flow/components/map/controls/SearchBar.vue';
import NavigationControl from '@/flow/components/map/controls/NavigationControl.vue';
import BaseMapControl from '@/flow/components/map/controls/BaseMapControl.vue';
import ProjectInfoBox from './info_box/ProjectInfoBox.vue';
import { flowStore, flowUIStore } from '@/flow/store/store-accessor';

@Component({
  components: {
    FlowContainer,
    MapVis,
    ProjectInfoBox,
    SearchBar,
    NavigationControl,
    BaseMapControl
  }
})
export default class FlowProjects extends Vue {
  @Prop([String]) currentProjectName?: string;
  @Prop([String]) currentScenarioName?: string;

  viewState: Nullable<CameraOptions> = defaults.viewState();

  get projects() {
    return flowStore.projects;
  }

  get currentProject() {
    return flowStore.project;
  }

  get toDatasets() {
    return '/flow/datasets?' + this.queryString;
  }

  get toScenario() {
    return '/flow/scenario?' + this.queryString;
  }

  get details() {
    if (this.currentProject) {
      const details = pick(this.currentProject, ['created_on', 'updated_on', 'tags']);
      details.created_on = this.$options.filters?.dateString(details.created_on);
      return details;
    }
    return null;
  }

  get countDetails() {
    if (this.currentProject) {
      return pick(this.currentProject, ['dataset_count', 'scenario_count']);
    }
    return null;
  }

  // Map Vis getters
  get validLayers() {
    return [];
  }

  get queryString() {
    return flowStore.queryString;
  }

  get hasGeocodeCapabilities() {
    return flowStore.hasGeocodeCapabilities;
  }

  /**
   * Watcher for current project, receives a project object, sets in the store and updates main Flow component.
   * If necessary, updates the route with its name as the project query parameter
   */
  async setProject(project: Project) {
    await flowStore.setCurrentFlowProject(project);

    // this replaces the query string with project
    if (this.currentProjectName !== project.name) {
      await this.$router.push({
        name: 'FlowProjects',
        query: { project: project?.name }
      });
      flowStore.updateCurrentView(null);
    }
  }

  async mounted() {
    const config = { currentProjectName: this.currentProjectName };

    flowUIStore.setLoading({ value: true, msg: 'Loading workspaces...' });

    try {
      await flowStore.setupFlowStore({ config });
      flowUIStore.setLoading({ value: false });
    } catch (error) {
      console.error(error);
      flowUIStore.setLoading({ value: false });
    }
  }

  async created() {}
}
</script>

<style scoped></style>
