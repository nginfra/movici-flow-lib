<template>
  <div>
    <span v-if="errors['shapeOrIcon']" class="error is-block is-size-7 has-text-danger mb-2">
      {{ errors["shapeOrIcon"] }}
    </span>
    <label class="label is-size-6">{{ t("flow.visualization.iconConfig.shape") }}</label>
    <IconConfigurator
      class="mt-2"
      :modelValue="props.modelValue.shape"
      @update:modelValue="updateClause({ shape: $event })"
      iconGroup="shapes"
    />
    <hr />
    <label class="label is-size-6">{{ t("flow.visualization.iconConfig.icon") }}</label>
    <IconConfigurator
      class="mt-2"
      :modelValue="props.modelValue.icon"
      @update:modelValue="updateClause({ icon: $event })"
      iconGroup="icons"
    />
  </div>
</template>

<script setup lang="ts">
import { useValidator } from "@movici-flow-lib/composables/useValidator";
import type { IconClause } from "@movici-flow-lib/types";
import { inject, provide } from "vue";
import IconConfigurator from "./IconConfigurator.vue";
import { validatorInjection } from "./injectionKeys";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

interface ShapeIconClause {
  shape?: IconClause;
  icon?: IconClause;
}

const props = defineProps<{
  modelValue: ShapeIconClause;
}>();
const emit = defineEmits<{
  (e: "update:modelValue", val: ShapeIconClause): void;
}>();

const validator = inject(validatorInjection)!.child("icon-shape");
provide(validatorInjection, validator);
validator.configure({
  validators: {
    shapeOrIcon: () => {
      const hasShape = !!(props.modelValue.shape?.byValue || props.modelValue.shape?.static);
      const hasIcon = !!(props.modelValue.icon?.byValue || props.modelValue.icon?.static);
      if (!hasShape && !hasIcon) {
        return "You need to pick at least one icon, shape or a combination of both.";
      }
    },
  },
});
const { errors, validated } = useValidator(validator);
validated("shapeOrIcon", props);

function updateClause(clause: Partial<ShapeIconClause>) {
  emit("update:modelValue", { ...props.modelValue, ...clause });
}
</script>

<style scoped lang="scss">
hr {
  margin: 1rem 0;
}
</style>
