Taken and adapted from buefy
https://github.com/buefy/buefy/blob/a92edafb1b5eaf3e01f73b18aebdd995535e68be/src/components/tag/Tag.vue

<template>
  <div v-if="attached && closable" class="tags has-addons">
    <span class="tag" :class="[type, size, { 'is-rounded': rounded }]">
      <o-icon v-if="icon" :icon="icon" :size="size" :variant="iconVariant" :pack="iconPack" />
      <span :class="{ 'has-ellipsis': ellipsis }" @click="click">
        <slot />
      </span>
    </span>
    <a
      class="tag"
      role="button"
      :aria-label="ariaCloseLabel"
      :tabindex="tabstop ? 0 : false"
      :disabled="disabled"
      :class="[
        size,
        closeType,
        { 'is-rounded': rounded },
        closeIcon ? 'has-delete-icon' : 'is-delete',
      ]"
      @click="close"
      @keyup.delete.prevent="close"
    >
      <o-icon
        custom-class=""
        v-if="closeIcon"
        :icon="closeIcon"
        :size="size"
        :variant="closeIconVariant"
        :pack="closeIconPack"
      />
    </a>
  </div>
  <span v-else class="tag" :class="[type, size, { 'is-rounded': rounded }]">
    <o-icon v-if="icon" :icon="icon" :size="size" :variant="iconVariant" :pack="iconPack" />
    <span :class="{ 'has-ellipsis': ellipsis }">
      <slot />
    </span>

    <a
      v-if="closable"
      role="button"
      :aria-label="ariaCloseLabel"
      class="delete is-small"
      :class="closeType"
      :disabled="disabled"
      :tabindex="tabstop ? 0 : false"
      @click="close"
      @keyup.delete.prevent="close"
    />
  </span>
</template>

<script>
export default {
  name: "BTag",
  props: {
    attached: Boolean,
    closable: Boolean,
    variant: String,
    size: String,
    rounded: Boolean,
    disabled: Boolean,
    ellipsis: Boolean,
    tabstop: {
      type: Boolean,
      default: true,
    },
    ariaCloseLabel: String,
    icon: String,
    iconVariant: String,
    iconPack: String,
    closeVariant: String,
    closeIcon: String,
    closeIconPack: String,
    closeIconVariant: String,
  },
  computed: {
    closeType() {
      return this.closeVariant ? "is-" + this.closeVariant : "";
    },
    type() {
      return this.variant ? "is-" + this.variant : "";
    },
    sizeClass() {
      return this.size ? "is-" + this.size : "";
    },
  },
  methods: {
    /**
     * Emit close event when delete button is clicked
     * or delete key is pressed.
     */
    close(event) {
      if (this.disabled) return;
      this.$emit("close", event);
    },
    /**
     * Emit click event when tag is clicked.
     */
    click(event) {
      if (this.disabled) return;
      this.$emit("click", event);
    },
  },
};
</script>
