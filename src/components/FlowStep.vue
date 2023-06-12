<template>
  <div class="is-flex flow-content" :class="collapsedClass">
    <o-loading full-page :active="store.loading" icon-size="large" />
    <aside
      :class="!store.loading ? 'is-opacity-1' : 'is-opacity-0'"
      class="column options is-gapless is-margin-less left-panel"
    >
      <div class="top-logo is-flex mb-5 mt-2 is-flex-grow-0 is-flex-shrink-1">
        <MovImage src="/static/movici-flow.svg" alt="MoViCI flow"></MovImage>
      </div>
      <slot name="leftPanel"></slot>
    </aside>
    <section :class="!store.loading ? 'is-opacity-1' : 'is-opacity-0'" class="main-view column">
      <slot name="mainView"></slot>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useUIStore } from "@movici-flow-common/stores/ui";
import { computed } from "vue";
const store = useUIStore();
const collapsedClass = computed(() => {
  return store.collapserEnabled ? (store.collapse ? "collapsed" : "expanded") : "";
});
</script>

<style scoped lang="scss">
.flow-content {
  background-color: $white;
  height: 100%;
  margin: 0;

  // map-control areas must be translated if ui is expanded or collapsed
  &.expanded {
    :deep(.map-control-left) {
      transform: translateX($left-menu-size + $menu-item-size) !important ;
    }
    :deep(.map-control-bottom) {
      transform: translateX(10vw) translateX($left-menu-size + $menu-item-size);
    }
  }
  &.collapsed {
    .left-panel {
      transform: translateX(-$left-menu-size);
      box-shadow: none;
    }
    .main-view {
      margin-left: 0;
    }
    .no-resource {
      transform: translateY(-50%) translateX(calc(-50% - #{$half-left-menu-size})) !important ;
    }
    :deep(.visualizer-editor) {
      transform: translateX(-$menu-item-size) !important;
    }
    :deep(.map-control-bottom) {
      transform: translateX(10vw) translateX($menu-item-size) !important;
      width: calc(80vw - #{$menu-item-size}) !important;
    }
    :deep(.map-control-left) {
      transform: translateX($menu-item-size) !important;
    }
  }
  .left-panel {
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    justify-content: flex-start;
    padding: 1rem;
    height: 100vh;
    width: $left-menu-size;
    position: absolute;
    z-index: 2;
    background-color: $white;
    box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
    transition: transform 0.5s, box-shadow 0.5s;
    .details,
    .count-details {
      label {
        color: $grey;
      }
    }
  }
  :deep(.main-view) {
    display: flex;
    padding: 0;
    margin-left: $left-menu-size;
    height: 100vh;
    flex-direction: column;
    transition: margin-left 0.5s;
    .no-resource {
      position: absolute;
      left: calc(50% + #{$half-left-menu-size});
      top: 50%;
      transform: translateY(-50%) translateX(-50%);
      transition: transform 0.5s;
      figure {
        width: max-content;
        margin: auto;
      }
    }
  }
  .top-logo {
    max-width: 240px;
    figure {
      height: 26px;
      max-width: 125px;
    }
  }
}
</style>
