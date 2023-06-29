<template>
  <div class="current-project is-flex is-align-items-flex-end">
    <div class="info is-flex-grow-1">
      <label class="is-size-7 is-block">
        {{ $t("flow.projects.label") }}
      </label>
      <o-field v-if="edit">
        <o-select
          :modelValue="store.project"
          @update:modelValue="setProject($event)"
          :placeholder="$t('flow.projects.selectPlaceholder')"
          size="small"
          expanded
        >
          <option v-for="p in store.projects" :value="p" :key="p.uuid">
            {{ p.display_name }}
          </option>
        </o-select>
      </o-field>
      <span v-else-if="store.project" class="is-size-6-half is-block">
        <div class="display-name is-flex-grow-1">
          <a @click="store.updateLocation({ step: 'project' })" role="link">
            {{ store.project.display_name }}
          </a>
        </div>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFlowStore } from "@movici-flow-lib/stores/flow";
import type { Project } from "@movici-flow-lib/types";

const store = useFlowStore();
defineProps<{ edit?: boolean }>();

async function setProject(project: Project) {
  await store.updateLocation({
    projectName: project.name,
    scenarioName: undefined,
    viewUUID: undefined,
  });
}
</script>

<style scoped lang="scss"></style>
