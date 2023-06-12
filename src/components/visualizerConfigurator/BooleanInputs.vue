<template>
  <div>
    <div v-for="(val, index) in modelValue" class="field is-align-items-center" :key="index">
      <o-input
        :modelValue="String(Boolean(val))"
        native-class="has-text-centered"
        size="small"
        disabled
      />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: number[];
}>();
</script>
