<template>
  <div>
    <div class="columns mb-0 layer-kind">
      <div class="column is-two-thirds-desktop is-full-tablet show is-flex">
        <o-field class="show-popup">
          <o-checkbox v-model="local.show" size="small">
            {{ t("flow.visualization.popup.showPopup") }}
          </o-checkbox>
        </o-field>
        <template v-if="local.show">
          <o-field class="when ml-6">
            <o-radio class="mr-4" size="small" v-model="local.onHover" :native-value="false">
              {{ t("flow.visualization.popup.onClickOnly") }}
            </o-radio>
            <o-radio size="small" v-model="local.onHover" :native-value="true">
              {{ t("flow.visualization.popup.onClickAndHover") }}
            </o-radio>
          </o-field>
        </template>
      </div>
    </div>
    <div class="columns mb-0" v-if="local.show">
      <div class="column is-two-thirds is-full-tablet popup-title">
        <o-field :label="t('flow.visualization.popup.title')">
          <o-input
            v-model="local.title"
            :placeholder="t('flow.visualization.popup.titlePlaceholder')"
            size="small"
            :disabled="local.dynamicTitle"
          ></o-input>
        </o-field>
      </div>
    </div>
    <div class="columns mb-0 items" v-if="local.show">
      <div class="column is-full">
        <label class="label">{{ t("misc.properties") }}</label>
        <o-dropdown
          class="mr-4 mb-2"
          :modelValue="local.items"
          @update:modelValue="addItem($event)"
          :close-on-click="false"
          aria-role="list"
          scrollable
          max-height="200"
        >
          <template #trigger>
            <o-button
              class="is-size-7 is-transparent has-hover-bg is-borderless has-text-primary has-text-weight-bold"
              icon-left="plus-circle"
              icon-pack="far"
              size="small"
            >
              {{ t("flow.visualization.popup.addItem") }}
            </o-button>
          </template>
          <o-dropdown-item
            v-for="(attr, index) in unusedAttributes"
            :value="attr"
            :key="index"
            :title="attr.description"
            :focusable="false"
            aria-role="listitem"
            class="is-size-7"
          >
            {{ attributeString(attr) }}
          </o-dropdown-item>
        </o-dropdown>
        <AttributeSuggestions :modelValue="suggestions" :items="local.items" @addItem="addItem" />
        <p v-if="errors['items']" class="error is-size-7 has-text-danger mt-2">
          {{ errors["items"] }}
        </p>
        <Draggable
          :modelValue="local.items"
          v-bind="draggableOptions"
          v-on="draggableEvents"
          :item-key="draggableItemKey"
          class="draggable"
          :class="{ dashed: dragging, 'mt-0': !local.items.length, 'mt-2': local.items.length }"
          @change="draggableChange"
        >
          <template #item="{ index, element }">
            <div class="popup-item is-flex">
              <span class="grip mr-2">
                <span class="icon is-small fa-stack">
                  <i class="far fa-ellipsis-v"></i>
                  <i class="far fa-ellipsis-v"></i>
                </span>
              </span>
              <label class="label is-flex-grow-1 pl-1 pr-3">
                <span class="attribute text-ellipsis" :title="element.attribute.description">
                  {{ attributeString(element.attribute) }}
                </span>
              </label>
              <o-input
                :placeholder="attributeString(element.attribute)"
                v-model="element.name"
                :value="element.name"
                :disabled="index === 0 && local.dynamicTitle"
                size="small"
              ></o-input>
              <o-checkbox v-if="index === 0" class="ml-2" size="small" v-model="local.dynamicTitle">
                {{ t("flow.visualization.popup.setAsDynamicTitle") }}
              </o-checkbox>
              <o-button
                class="is-transparent is-borderless ml-2 has-text-danger has-hover-bg"
                icon-left="minus-circle"
                icon-pack="far"
                size="small"
                @click="removeItem(index)"
              >
              </o-button>
            </div>
          </template>
        </Draggable>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDraggable } from "@movici-flow-lib/composables/useDraggable";
import { useValidator } from "@movici-flow-lib/composables/useValidator";
import type { AttributeSummary, PopupClause, PopupItem } from "@movici-flow-lib/types";
import { attributeString } from "@movici-flow-lib/utils";
import { computed, inject, onUnmounted, reactive, toRaw, toRef, watch } from "vue";
import Draggable from "vuedraggable";
import AttributeSuggestions from "./AttributeSuggestions.vue";
import { attributesInjection, settingsInjection, validatorInjection } from "./injectionKeys";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps<{
  modelValue?: PopupClause;
}>();
const emit = defineEmits<{
  (e: "update:modelValue", val: PopupClause): void;
}>();
const local = reactive<PopupClause>({
  title: "",
  items: [],
  show: false,
  onHover: false,
  dynamicTitle: false,
});
watch(local, () => emit("update:modelValue", toRaw(local)), { deep: true });
watch(
  () => props.modelValue,
  (val) => {
    Object.assign(local, val);
  },
  { immediate: true },
);

const attributes = inject(attributesInjection)!;
const settings = inject(settingsInjection)!;

const validator = inject(validatorInjection)!.child("popup");
validator.configure({
  validators: {
    items: () => {
      if (local.show && !local.items.length && !local.title) {
        return "Select at least 1 property or title";
      }
    },
  },
});
const { errors, validated, destroyValidator } = useValidator(validator);
validated("items", local);
onUnmounted(destroyValidator);

const usedAttributes = computed(() => new Set(local.items.map((i) => i.attribute.name)));
const unusedAttributes = computed(
  () => attributes.value?.filter((a) => !usedAttributes.value.has(a.name)) ?? [],
);
const suggestions = computed(() => {
  return Array.from(
    new Set(
      [
        // any new byValue clauses must be added here!
        settings.value?.color?.byValue?.attribute,
        settings.value?.size?.byValue?.attribute,
        settings.value?.icon?.byValue?.attribute,
        settings.value?.shape?.byValue?.attribute,
        settings.value?.visibility?.byValue.attribute,
      ].filter((attr) => attr) as AttributeSummary[],
    ),
  );
});

const { draggableEvents, draggableOptions, dragging, draggableChange } = useDraggable(
  toRef(local, "items"),
  "popup",
);

function draggableItemKey(item: PopupItem) {
  return item.attribute.name;
}
function addItem(attr: AttributeSummary) {
  local.items = [...local.items, { name: "", attribute: toRaw(attr) }];
}

function removeItem(idx: number) {
  local.items = local.items.filter((_, i) => i !== idx);
}
</script>

<style scoped lang="scss">
.popup-item {
  background-color: $white-ter;
  border-radius: 0.25rem !important;
  padding: 0.25rem;
  margin-bottom: 0.25rem;

  .label {
    max-width: 200px;
    .attribute {
      color: $grey-dark;
      font-weight: 300;
      font-size: 0.75rem;
    }
  }
  .control {
    flex: 1;
  }
}
</style>
