<template>
  <div class="current-scenario is-flex is-align-items-flex-end">
    <div class="info is-flex-grow-1">
      <label class="is-size-7">
        {{ t("resources.scenario") }}
        <span v-if="editable" class="count">({{ store.scenarios.length }})</span>
      </label>
      <o-field class="is-flex-grow-0 is-flex-shrink-1" v-if="editable">
        <o-select
          :modelValue="store.scenario?.name"
          @update:modelValue="setScenario($event)"
          :placeholder="t('flow.scenarios.selectPlaceholder')"
          size="small"
          expanded
        >
          <option v-for="s in store.scenarios" :value="s.name" :key="s.uuid">
            {{ s.display_name }}
          </option>
        </o-select>
      </o-field>
      <span class="is-block" v-else-if="store.scenario">
        <span class="is-size-6-half is-flex is-align-items-center">
          <div class="display-name is-flex-grow-1">
            <a @click="store.updateLocation({ step: 'scenario' })" role="link">
              {{ store.scenario.display_name }}
            </a>
          </div>
          <span class="tag" :class="getClassFromStatus(store.scenario.status ?? '')">
            {{ store.scenario.status }}
          </span>
        </span>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFlowStore } from "@movici-flow-lib/stores/flow";
import { getClassFromStatus } from "@movici-flow-lib/utils";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const store = useFlowStore();
defineProps<{ editable?: boolean }>();

async function setScenario(scenarioName: string) {
  await store.updateLocation({ scenarioName, viewUUID: undefined });
}
</script>

<style scoped lang="scss"></style>
