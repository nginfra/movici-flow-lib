<template>
  <section class="flow columns is-gapless is-margin-less">
    <o-menu class="column flow-menu" :activable="false">
      <o-menu-list aria-role="menu">
        <o-menu-item class="home" tag="router-link" :to="settings.homeRoute">
          <template #label>
            <MovImage
              src="/static/movici-logo.svg"
              :title="$t('flow.leftMenu.returnToDashboard')"
            ></MovImage>
          </template>
        </o-menu-item>
        <o-menu-item
          v-for="section in sections"
          aria-role="menuitem"
          :key="section.step"
          :label="$t(section.label)"
          :icon-pack="section.iconPack"
          :icon="section.icon"
          :disabled="!section.enabled"
          :active="isActive(section.step)"
          @click.stop="section.activate"
          tag="a"
        />
        <div class="bottom">
          <span v-if="userInitials" class="is-small icon user-initials">
            {{ userInitials }}
          </span>
          <span class="pt-1">{{ flowVersion }}</span>
        </div>
      </o-menu-list>
    </o-menu>
    <o-tooltip
      class="collapse-button"
      variant="black"
      position="right"
      :label="
        (uiStore.collapse ? $t('flow.leftMenu.expand') : $t('flow.leftMenu.collapse')) + ' menu'
      "
    >
      <o-button
        size="small"
        v-if="uiStore.collapserEnabled"
        :icon-left="uiStore.collapse ? 'angle-right' : 'angle-left'"
        @click.stop="uiStore.collapse = !uiStore.collapse"
      ></o-button>
    </o-tooltip>
    <main class="column">
      <component ref="menu" :is="StepComponent" v-model:hasPendingChanges="hasPendingChanges" />
    </main>
  </section>
</template>

<script setup lang="ts">
import { useFlowSidebar } from "@movici-flow-common/composables/useFlowSidebar";
import { FlowRedirect } from "@movici-flow-common/errors";
import { useFlowStore } from "@movici-flow-common/stores/flow";
import { useUIStore } from "@movici-flow-common/stores/ui";
import flowVersion from "@movici-flow-common/version";
import { computed, ref, toRef, watch } from "vue";
import { useMoviciSettings } from "../baseComposables/useMoviciSettings";
import type { FlowLocation, FlowStep } from "../types";
import FlowDatasetView from "./FlowDatasetView.vue";
import FlowProjectView from "./FlowProjectView.vue";
import FlowScenarioView from "./FlowScenarioView.vue";
import FlowVisualizationView from "./FlowVisualizationView.vue";
import { useDialog } from "@movici-flow-common/baseComposables/useDialog";
import { useI18n } from "vue-i18n";
import { useProgrammatic } from "@oruga-ui/oruga-next";
import FlowExport from "@movici-flow-common/components/FlowExport.vue";
const { settings } = useMoviciSettings();
const { openDialog } = useDialog();
const store = useFlowStore();
const uiStore = useUIStore();
const { t } = useI18n();
const props = defineProps<{
  location?: FlowLocation;
}>();

const emit = defineEmits<{
  (e: "update:location", loc: FlowLocation): void;
}>();

const hasProjectCapablity = computed(() => store.hasCapability("projects"));

const hasPendingChanges = ref(false);
function goToStep(step: FlowStep) {
  function go() {
    emit("update:location", {
      ...props.location,
      step,
    });
  }
  if (hasPendingChanges.value) {
    openDialog({
      message: t("flow.visualization.dialogs.unsavedView"),
      cancelText: t("actions.cancel"),
      confirmButtonText: t("actions.leave"),
      variant: "danger",
      canCancel: true,
      onConfirm: () => {
        hasPendingChanges.value = false;
        go();
      },
    });
  } else {
    go();
  }
}

const { oruga } = useProgrammatic();
const { sections } = useFlowSidebar({
  location: toRef(props, "location"),
  hasProjectCapability: hasProjectCapablity,
  actions: {
    project: () => goToStep("project"),
    dataset: () => goToStep("dataset"),
    scenario: () => goToStep("scenario"),
    visualization: () => goToStep("visualization"),
    export: () => {
      oruga.modal.open({
        component: FlowExport,
        width: "max-content",
        canCancel: ["x", "escape"],
      });
    },
  },
});

const userInitials = computed(() =>
  store.currentUser
    ? store.currentUser.firstname.slice(0, 1) + store.currentUser.lastname.slice(0, 1)
    : null
);

function isActive(step: FlowStep) {
  return props.location?.step == step;
}

const StepComponent = computed(() => {
  switch (props.location?.step) {
    case "project":
      return FlowProjectView;
    case "dataset":
      return FlowDatasetView;
    case "scenario":
      return FlowScenarioView;
    case "visualization":
      return FlowVisualizationView;
    default:
      return FlowProjectView;
  }
});

watch(
  () => props.location,
  async (location) => {
    if (!location) {
      emit("update:location", { step: store.hasCapability("projects") ? "project" : "dataset" });
      return;
    }
    try {
      await store.setLocation(location);
      await uiStore.setLocation(location);
    } catch (e) {
      if (e instanceof FlowRedirect) {
        emit("update:location", e.location);
      }
    }
  },
  { immediate: true }
);

watch(
  () => store.currentLocation,
  (location) => {
    if (location) {
      emit("update:location", location);
    }
  },
  { immediate: true }
);
</script>

<style scoped lang="scss">
.flow {
  height: 100vh;
  margin: 0 !important;
  color: $black;
  .collapse-button {
    position: absolute;
    left: 22.5px;
    bottom: 85px;
    z-index: 10;
  }
  // left-hand-side menu
  :deep(.flow-menu) {
    max-width: $menu-item-size;
    z-index: 3;
    .menu-list {
      height: 100vh;
      background-color: $white-ter;
      li {
        height: $menu-item-height;
        width: $menu-item-size;
        border-radius: 0;
        &.home {
          a {
            background-color: $white-ter !important;
          }
        }

        a {
          height: $menu-item-height;
          padding: 0.625rem;
          border-radius: 0;
          background-color: $white-ter;
          text-align: center;
          transition: background-color 0.2s;
          .image {
            margin: 12px auto;
            width: 36px;
            height: 36px;
          }
          span {
            &:not(.icon) {
              line-height: 1.5rem;
              font-size: 0.625rem;
              color: $black-bis !important;
              display: flex;
              flex-direction: column;
              align-items: center !important;
              justify-content: center !important;
            }
            &.icon {
              width: 40px;
              height: 40px;
              border-radius: 100%;
              color: $green;
              background-color: $white;
              margin: 0;
              transition: background-color 0.2s;
              svg,
              i {
                width: 1.1em !important;
                font-size: 20px;
              }
            }
          }
          &:hover {
            @include hover-grey-bgcolor;
          }
          &.is-active {
            background-color: $white;
            span.icon {
              background-color: $green;
              color: $white;
            }
          }
          &.is-disabled {
            pointer-events: none;
            opacity: 1;
            span {
              &:not(.icon) {
                color: $grey-lighter !important;
              }
              &.icon {
                background-color: $grey-lighter !important;
                color: $white !important;
              }
            }
          }
        }
      }
    }
  }
  .bottom {
    width: $menu-item-size;
    border-radius: 0;
    position: absolute;
    bottom: 0;
    height: $menu-item-height;
    padding: 0.625rem;
    border-radius: 0;
    background-color: $white-ter;
    text-align: center;
    transition: background-color 0.2s;
    .image {
      margin: 12px auto;
      width: 36px;
      height: 36px;
    }
    span {
      &:not(.icon) {
        line-height: 1.5rem;
        font-size: 0.625rem;
        color: $black-bis !important;
        display: flex;
        flex-direction: column;
        align-items: center !important;
        justify-content: center !important;
      }
      &.icon {
        width: 40px;
        height: 40px;
        border-radius: 100%;
        color: $green;
        background-color: $white;
        margin: 0;
        transition: background-color 0.2s;
        svg,
        i {
          width: 1.1em !important;
          font-size: 20px;
        }
      }
    }
  }
  :deep(main) {
    background-color: $white;
    .flow-datasets {
      #mapbox-container {
        height: initial;
      }
    }
    .flow-datasets,
    .flow-scenarios {
      .main-view {
        padding: 1rem 2rem;
      }
    }
  }
}
</style>
