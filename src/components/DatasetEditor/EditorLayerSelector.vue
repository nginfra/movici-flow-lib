<template>
  <WidgetContainer collapsable>
    <template #collapse-title="{ collapsed }">
      <div class="is-flex is-flex-direction-row-reverse is-align-items-center is-clickable">
        <o-icon
          title="Layers"
          class="collapsed-icon"
          pack="far"
          :icon="collapsed ? 'stream' : 'minus-square'"
        />
        <label class="label is-flex-grow-1 mb-0" v-show="!collapsed">Entity Groups</label>
      </div>
    </template>
    <template #collapse-content>
      <ul class="entities-list is-size-7 mt-2">
        <li
          v-for="name in store.entityGroupNames"
          :key="name"
          :title="name"
          class="pl-0 is-flex is-align-items-center"
        >
          <o-checkbox
            :model-value="store.isGroupVisible(name)"
            @update:model-value="(v: boolean) => store.setGroupVisible(name, v)"
            size="small"
          >
            {{ snakeToFriendly(name) }} ({{ store.entityCount(name) }})
          </o-checkbox>
          <button
            v-if="store.snappingEnabled"
            type="button"
            class="snap-toggle ml-auto"
            :class="{ 'is-snappable': store.isGroupSnappable(name) }"
            :disabled="!store.isGroupVisible(name)"
            :title="snapToggleTitle(name)"
            @click="store.setGroupSnappable(name, !store.isGroupSnappable(name))"
          >
            <o-icon pack="fas" icon="magnet" size="small" />
          </button>
        </li>
        <li v-if="!store.entityGroupNames.length" class="has-text-grey">No entity group</li>
      </ul>
    </template>
  </WidgetContainer>
</template>
<script setup lang="ts">
import WidgetContainer from "@movici-flow-lib/components/mapControls/WidgetContainer.vue";
import { useEditorStore } from "@movici-flow-lib/stores/editor";
import { snakeToFriendly } from "@movici-flow-lib/utils/filters";

const store = useEditorStore();

function snapToggleTitle(name: string) {
  if (!store.isGroupVisible(name)) return "Hidden groups are not snapped";
  return store.isGroupSnappable(name) ? "Snapping to this group" : "Not snapping to this group";
}
</script>

<style scoped lang="scss">
.snap-toggle {
  border: none;
  background: none;
  padding: 0 0.25rem;
  cursor: pointer;
  color: $grey-light;

  &.is-snappable {
    color: $primary;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
}
</style>
