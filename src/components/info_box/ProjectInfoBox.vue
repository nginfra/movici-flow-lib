<template>
  <div class="current-project is-flex is-align-items-flex-end">
    <div class="info is-flex-grow-1">
      <label class="is-size-7 is-block">
        {{ $t('flow.projects.label') }}
      </label>
      <b-field v-if="edit">
        <b-select
          :value="currentProject"
          @input="$emit('setProject', $event)"
          :placeholder="$t('flow.projects.selectPlaceholder')"
          size="is-small"
          expanded
        >
          <option v-for="p in projects" :value="p" :key="p.uuid">
            {{ p.display_name }}
          </option>
        </b-select>
      </b-field>
      <span v-else-if="currentProject" class="is-size-6-half is-block">
        <router-link
          custom
          v-slot="{ navigate }"
          :to="{
            name: 'FlowProjects',
            query: { project: currentProject.name }
          }"
          class="display-name is-flex-grow-1"
        >
          <a @click="navigate" @keypress.enter="navigate" role="link">
            {{ currentProject.display_name }}
          </a>
        </router-link>
      </span>
    </div>
    <MovActionMenu v-if="actions.length" :value="actions" />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { flowStore } from '@/flow/src/store/store-accessor';
import { ActionMenuItem } from '../global/ActionMenu.vue';

@Component({
  name: 'ProjectInfoBox'
})
export default class ProjectInfoBox extends Vue {
  @Prop({ type: Boolean, default: false }) edit!: boolean;
  actions: ActionMenuItem[] = [];

  get currentProject() {
    return flowStore.project;
  }

  get projects() {
    return flowStore.projects;
  }
}
</script>

<style scoped lang="scss"></style>
