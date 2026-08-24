<template>
  <nav class="editor-toolbar is-flex is-align-items-center px-4 py-2">
    <span class="dataset-name is-size-6 has-text-weight-semibold ml-4 mr-auto">
      Editing: {{ datasetDisplayName }}
    </span>
    <span v-if="store.dirtyCount > 0" class="is-size-7 has-text-warning-dark mr-3">
      {{ store.dirtyCount }} unsaved change{{ store.dirtyCount !== 1 ? "s" : "" }}
    </span>

    <o-button
      icon-left="undo"
      icon-pack="fas"
      size="small"
      variant="dark"
      class="mr-1"
      :disabled="historyStore.undoStack.length === 0"
      @click="store.undo()"
      title="Undo"
    >
      Undo
    </o-button>

    <o-button
      icon-left="redo"
      icon-pack="fas"
      size="small"
      variant="dark"
      class="mr-3"
      :disabled="historyStore.redoStack.length === 0"
      @click="store.redo()"
      title="Redo"
    >
      Redo
    </o-button>

    <o-button
      icon-left="save"
      icon-pack="fas"
      size="small"
      variant="primary"
      :disabled="!store.isDirty || store.saving"
      @click="store.save()"
    >
      Save
    </o-button>
  </nav>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useEditorStore } from "@movici-flow-lib/stores/editor";
import { useEditorHistoryStore } from "@movici-flow-lib/stores/editorHistory";

const store = useEditorStore();
const historyStore = useEditorHistoryStore();

const datasetDisplayName = computed(() => {
  const dataset = store.dataset;
  if (!dataset) return store.datasetUUID ?? "Dataset Editor";
  return dataset.display_name || dataset.name || store.datasetUUID || "Dataset Editor";
});
</script>

<!-- TODO: use house-style or exend existing styles -->
<style scoped lang="scss">
.editor-toolbar {
  background: white;
  border-bottom: 1px solid $grey-lighter;
  height: 52px;
  flex-shrink: 0;

  .dataset-name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 400px;
  }
}
</style>
