<template>
  <o-field :label="label">
    <template v-if="buttons">
      <o-button
        v-if="allowEmpty"
        title="Empty"
        size="small"
        @click.stop="$emit('update:modelValue', '')"
        :class="{ 'is-primary': isSelected('') }"
      />
      <o-button
        size="small"
        :title="upperFirst(icon)"
        v-for="icon in icons"
        :key="icon"
        :icon-left="icon"
        @click.stop="$emit('update:modelValue', icon)"
        :class="{ 'is-primary': isSelected(icon) }"
      />
    </template>
    <template v-else>
      <o-dropdown :modelValue="modelValue" @update:modelValue="$emit('update:modelValue', $event)">
        <template #trigger>
          <div class="select">
            <span class="selected-icon" v-if="modelValue">
              <o-icon class="mr-2" :icon="modelValue" :pack="pack" />
              {{ modelValue }}
            </span>
            <span class="placeholder" v-else>{{ label }}...</span>
          </div>
        </template>
        <o-dropdown-item v-if="allowEmpty" class="empty" :value="null">
          <o-icon size="is-large" />
        </o-dropdown-item>
        <o-dropdown-item v-for="(icon, idx) in icons" :key="idx" :value="icon">
          <o-icon :icon="icon" :pack="pack" :title="upperFirst(icon)" size="large" />
        </o-dropdown-item>
      </o-dropdown>
    </template>
  </o-field>
</template>

<script setup lang="ts">
import { upperFirst } from "@movici-flow-lib/utils/filters";
import type { IconMapping } from "@movici-flow-lib/visualizers/layers/ShapeIconLayer";
import { computed } from "vue";
const props = withDefaults(
  defineProps<{
    modelValue?: string;
    pack?: string;
    iconOptions?: IconMapping;
    allowEmpty?: boolean;
    label?: string;
    buttons?: boolean;
  }>(),
  {
    pack: "fas",
    iconOptions: () => ({}),
    label: "",
  },
);

const icons = computed(() => Object.keys(props.iconOptions));

function isSelected(icon: string) {
  return icon === (props.modelValue ?? "");
}
</script>

<style scoped lang="scss">
.selected-icon,
.placeholder {
  width: 180px;
  .icon {
    color: $grey-darker;
    display: inline-flex;
    position: unset;
  }
}
:deep(.select) {
  height: 2.5em;
  & > span {
    cursor: pointer;
    height: inherit;
    font-size: 1em;
    max-width: 100%;
    outline: none;
    padding-right: 2.5em;
    background-color: $white;
    border-radius: 2px;
    align-items: center;
    border: 2px solid $white-ter;
    box-shadow: none;
    display: inline-flex;
    justify-content: flex-start;
    line-height: 1.5;
    position: relative;
    padding-bottom: calc(0.5em - 1px);
    padding-left: calc(0.75em - 1px);
    padding-top: calc(0.5em - 1px);
    &:hover {
      border-color: $grey-light;
    }
    &:focus {
      border-color: $primary;
      -webkit-box-shadow: 0 0 0 0.125em rgba(26, 182, 126, 0.25);
      box-shadow: 0 0 0 0.125em rgba(26, 182, 126, 0.25);
    }
  }
}
:deep(.dropdown-trigger) {
  font-size: 0.75rem;
}
:deep(.dropdown-content) {
  &.is-active {
    display: flex !important;
  }
  max-height: 200px;
  width: 200px;
  flex-wrap: wrap;
  justify-content: flex-start;
  overflow: auto;
  .dropdown-item {
    flex: 0 1 0;
    padding: 0;
    margin: 0;
    &.empty {
      width: 48px;
      flex: 1 0 0;
    }
  }
}
</style>
