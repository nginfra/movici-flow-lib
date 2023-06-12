<template>
  <o-checkbox
    class="pt-5px"
    :modelValue="modelValue"
    @update:modelValue="$emit('update:modelValue', $event)"
  />
</template>

<script setup lang="ts">
defineProps<{ modelValue: boolean }>();
</script>

<style lang="scss" scoped>
.pt-5px {
  padding-top: 5px;
}
</style>
