<template>
  <div class="suggestions is-flex is-align-items-center" v-if="filteredSuggestions.length">
    <span class="is-size-7 has-text-weight-bold has-text-grey mr-1">
      {{ $t('flow.visualization.popup.suggestions') }}:
    </span>
    <b-tag
      v-for="(suggestion, idx) in filteredSuggestions"
      class="is-clickable"
      :class="{ 'mr-2': idx !== filteredSuggestions.length - 1 }"
      :key="idx"
      @click="$emit('addItem', suggestion)"
      :title="suggestion.description"
    >
      {{ suggestion.name }}
      <b-icon class="ml-1" size="is-small" icon="plus-circle" pack="fal" />
    </b-tag>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { PropertySummary, PopupItem } from '@movici-flow-common/types';
import { sortByKeys } from '@movici-flow-common/utils';

@Component({
  name: 'AttributeSuggestions'
})
export default class AttributeSuggestions extends Vue {
  @Prop({ type: Array, default: () => [] }) value!: PropertySummary[];
  @Prop({ type: Array, default: () => [] }) items!: PopupItem[];
  @Prop({ type: Array, default: () => [] }) entityProps!: PropertySummary[];
  @Prop({ type: Array, default: () => ['id', 'display_name', 'name', 'reference'] })
  defaultSuggestionNames!: string[];

  get defaultSuggestionNamesSet() {
    return new Set(this.defaultSuggestionNames);
  }

  get itemSet() {
    return new Set(this.items.map(i => i.attribute.name));
  }

  get defaultSuggestions() {
    return this.entityProps.filter(attr => {
      return this.defaultSuggestionNamesSet.has(attr.name);
    });
  }

  get filteredSuggestions() {
    return this.value
      .concat(this.defaultSuggestions)
      .filter(attr => {
        return !this.itemSet.has(attr.name);
      })
      .sort(sortByKeys(['+name']));
  }
}
</script>

<style scoped lang="scss"></style>
