<template>
  <div class="current-scenario is-flex is-align-items-flex-end">
    <div class="info is-flex-grow-1">
      <label class="is-size-7">
        {{ $t('resources.scenario') }}
        <span v-if="edit" class="count">({{ scenarios.length }})</span>
      </label>
      <b-field class="is-flex-grow-0 is-flex-shrink-1" v-if="edit">
        <b-select
          :value="currentScenarioUUID"
          @input="$emit('setScenarioUUID', $event)"
          :placeholder="$t('flow.scenarios.selectPlaceholder')"
          size="is-small"
          expanded
        >
          <option v-for="s in scenarios" :value="s.uuid" :key="s.uuid">
            {{ s.display_name }}
          </option>
        </b-select>
      </b-field>
      <span class="is-block" v-else-if="currentScenario">
        <span class="is-size-6-half is-flex is-align-items-center">
          <router-link custom :to="to" class="display-name is-flex-grow-1" v-slot="{ navigate }">
            <a @click="navigate" @keypress.enter="navigate" role="link">
              {{ currentScenario.display_name }}
            </a>
          </router-link>
          <span class="tag" :class="statusClass(currentScenario.status)">
            {{ currentScenario.status }}
          </span>
        </span>
      </span>
    </div>
    <MovActionMenu v-if="actions.length" :value="actions" />
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import { flowStore } from '@/flow/store/store-accessor';
import { ActionMenuItem } from '@/flow/types';
import { getClassFromStatus } from '@/flow/utils';

@Component({
  name: 'ScenarioInfoBox'
})
export default class ScenarioInfoBox extends Vue {
  @Prop({ type: Boolean, default: false }) edit!: boolean;
  actions: ActionMenuItem[] = [];

  get currentScenarioUUID() {
    return this.currentScenario ? this.currentScenario.uuid : null;
  }

  get currentScenario() {
    return flowStore.scenario;
  }

  get scenarios() {
    return flowStore.scenarios;
  }

  get to() {
    return {
      name: 'FlowScenario',
      query: { scenario: this.currentScenario?.name, project: this.currentScenario?.project_name }
    };
  }

  statusClass(type: string) {
    return getClassFromStatus(type);
  }
}
</script>

<style scoped lang="scss"></style>
