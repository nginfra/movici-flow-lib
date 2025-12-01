<template>
  <MovModal
    :can-cancel="['escape', 'outside']"
    :active="active"
    @update:active="$emit('update:active', $event)"
  >
    <template #header>
      <span class="is-size-6">
        {{
          views.length
            ? t("flow.visualization.dialogs.selectView")
            : t("flow.visualization.dialogs.noViewsForScenario")
        }}
      </span>
    </template>
    <template #content>
      <o-field v-if="views.length">
        <o-select
          v-model="selectedViewUUID"
          size="small"
          expanded
          :placeholder="t('flow.visualization.dialogs.selectViewPlaceholder')"
        >
          <option v-for="view in views" :value="view.uuid" :key="view.uuid">
            {{ view.name }}
          </option>
        </o-select>
      </o-field>
    </template>
    <template #footer>
      <div class="is-flex is-flex-grow-1 is-justify-content-flex-end">
        <o-button size="small" @click="$emit('close')">
          {{ views.length ? t("actions.cancel") : t("actions.back") }}
        </o-button>
        <o-button
          size="small"
          @click.stop="emitAndClose"
          variant="primary"
          :disabled="!selectedViewUUID"
        >
          {{ t("flow.visualization.dialogs.loadView") }}
        </o-button>
      </div>
    </template>
  </MovModal>
</template>

<script setup lang="ts">
import type { UUID, View } from "@movici-flow-lib/types";
import { ref } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
defineProps<{
  active?: boolean;
  views: View[];
}>();

const emit = defineEmits<{
  (e: "update:active", val: boolean): void;
  (e: "loadView", val: UUID): void;
}>();

const selectedViewUUID = ref<UUID>();
function emitAndClose() {
  emit("loadView", selectedViewUUID.value!);
  emit("update:active", false);
}
</script>

<style scoped lang="scss">
.modal {
  :deep(.modal-card) {
    width: inherit;
    min-width: 400px;
    .modal-card-body {
      padding: 10px 20px;
    }
    .modal-card-head,
    .modal-card-foot {
      border: 0;
    }
    .modal-card-head {
      padding-bottom: 0;
    }
    .modal-card-foot {
      padding-top: 0;
    }
  }
  // may come back to dropdown eventually
  // .dropdown {
  //   &.is-active {
  //     border-color: $primary;
  //     box-shadow: 0 0 0 0.125em rgba($primary, 0.25);
  //   }

  //   .dropdown-trigger {
  //     padding: 0.25rem 4rem 0.25rem 0.5rem;
  //     @include border-radius;
  //     cursor: pointer;
  //     border: 2px solid $white-ter;
  //     line-height: unset;
  //     background-color: $white;
  //     user-select: none;
  //     &:hover {
  //       border-color: $grey-light;
  //       &::after {
  //         border-color: $grey-darker;
  //       }
  //     }
  //   }
  // }
}
</style>
