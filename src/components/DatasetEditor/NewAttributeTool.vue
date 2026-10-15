<template>
  <EditorFormModal
    title="New attribute"
    :can-confirm="canAdd"
    :submit="onSubmit"
    @close="emit('close')"
  >
    <p class="is-size-7 has-text-grey mb-2">Adding to entity group '{{ entityGroup }}'</p>
    <o-field label="Name" label-class="is-size-7" class="mb-2">
      <o-input ref="nameInput" v-model="name" size="small" placeholder="attribute.name" expanded />
    </o-field>
    <o-field label="Type" label-class="is-size-7" class="mb-2">
      <o-select v-model="type" size="small">
        <option value="integer">integer</option>
        <option value="float">float</option>
        <option value="string">string</option>
        <option value="boolean">boolean</option>
      </o-select>
    </o-field>
  </EditorFormModal>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useEditorStore, type AttributeValueType } from "@movici-flow-lib/stores/editor";
import EditorFormModal from "./EditorFormModal.vue";

const emit = defineEmits<{ (e: "close"): void }>();
const props = defineProps<{ entityGroup: string }>();
const store = useEditorStore();

const name = ref("");
const type = ref<AttributeValueType>("integer");
const nameInput = ref<{ focus(): void } | null>(null);

const canAdd = computed(() => !!props.entityGroup && name.value.trim().length > 0);
onMounted(() => nameInput.value?.focus());

function onSubmit(): string | null {
  const attr = name.value.trim();
  return store.addAttribute(props.entityGroup, attr, type.value)
    ? null
    : `Cannot add attribute '${attr}': the name is reserved or already exists`;
}
</script>
