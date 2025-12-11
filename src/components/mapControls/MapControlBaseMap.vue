<template>
  <div class="basemap-control" :class="{ 'is-right': isRight }" title="Base Maps">
    <o-button
      class="toggler is-border-transparent"
      size="small"
      :variant="pickerOpen ? 'primary' : ''"
      @click="pickerOpen = !pickerOpen"
      icon-pack="fak"
      icon-left="fa-basemap"
    />
    <div class="basemap-selector box" v-if="pickerOpen">
      <div class="is-flex">
        <label class="label is-size-6-half is-flex-grow-1">Base Maps</label>
        <o-button
          class="close is-borderless is-transparent has-hover-bg"
          icon-pack="far"
          icon-left="times"
          size="small"
          @click="pickerOpen = false"
        />
      </div>
      <div class="is-flex is-flex-wrap-nowrap is-justify-content-space-between">
        <div
          class="item is-clickable"
          v-for="item in basemapsDefs"
          :key="item.name"
          @click="emit('update:modelValue', item.value)"
        >
          <MovImage
            v-if="item.type === 'image'"
            class="thumbnail"
            :class="{ active: item.value === modelValue }"
            :src="'/static/basemaps/' + item.name + '.png'"
          />
          <div
            v-else-if="item.type === 'solid'"
            class="thumbnail solid-background-thumbnail"
            :style="{ 'background-color': item.name }"
            :class="{ active: item.value === modelValue }"
          />
          <span class="is-size-7" :class="{ 'has-text-weight-bold': item.value === modelValue }">
            {{ upperFirst(t("flow.basemap." + item.name)) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

import { upperFirst } from "@movici-flow-lib/utils/filters";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
defineProps<{ isRight?: boolean; modelValue: string }>();
const emit = defineEmits<{
  (e: "update:modelValue", val: string): void;
}>();
const basemapsDefs = [
  { type: "image", name: "light", value: "mapbox://styles/mapbox/light-v10" },
  { type: "image", name: "dark", value: "mapbox://styles/mapbox/dark-v10" },
  { type: "image", name: "streets", value: "mapbox://styles/mapbox/streets-v11" },
  { type: "image", name: "satellite", value: "mapbox://styles/mapbox/satellite-v9" },
  { type: "solid", name: "black", value: "color://black" },
  { type: "solid", name: "white", value: "color://white" },
];
const pickerOpen = ref(false);
</script>

<style scoped lang="scss">
.basemap-control {
  width: 30px;
  height: 30px;
  transition: width 0.5s;
  &.is-right {
    .basemap-selector {
      left: -310px !important;
      top: -30px !important;
    }
  }
  .basemap-selector {
    width: max-content;
    position: relative;
    left: 40px;
    top: -30px;
    padding: 0.75rem;
    .close {
      margin: -0.25rem -0.25rem 0 0;
    }
    .item {
      span {
        color: $black;
      }
      .thumbnail {
        border: solid 2px white;
        width: 60px;
        height: 51px;
        @include border-radius;
        &.active {
          border: solid 2px $primary;
        }
      }
      .solid-background-thumbnail {
        border: solid 2px lightgray;
      }
    }
  }
  .toggler {
    padding: 0;
    width: inherit;
    &:hover {
      background-color: $white-ter;
    }
  }
}
</style>
