<template>
  <div class="current-project is-flex is-align-items-flex-end">
    <div class="info is-flex-grow-1">
      <label class="is-size-7 is-block">
        {{ $t('flow.projects.label') }}
      </label>
      <o-field v-if="edit">
        <o-select
          :value="currentProject"
          @input="$emit('setProject', $event)"
          :placeholder="$t('flow.projects.selectPlaceholder')"
          size="small"
          expanded
        >
          <option v-for="p in projects" :value="p" :key="p.uuid">
            {{ p.display_name }}
          </option>
        </o-select>
      </o-field>
      <span v-else-if="currentProject" class="is-size-6-half is-block">
        <router-link
          custom
          v-slot="{ navigate }"
          :to="{
            name: 'FlowProject',
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
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { flowStore } from '@movici-flow-common/store/store-accessor';

@Component({ name: 'ProjectInfoBox' })
export default class ProjectInfoBox extends Vue {
  @Prop({ type: Boolean, default: false }) readonly edit!: boolean;

  get currentProject() {
    return flowStore.project;
  }

  get projects() {
    return flowStore.projects;
  }
}
</script>

<style scoped lang="scss"></style>
