<template>
  <o-field :class="fieldClasses">
    <o-input
      class="numberinput"
      type="number"
      ref="input"
      v-model="computedValue"
      v-bind="$attrs"
      :max="max"
      :min="min"
      step="any"
      :size="size"
      :disabled="disabled"
      :expanded="expanded"
      :placeholder="placeholder"
      @focus="$emit('focus', $event)"
      @blur="$emit('blur', $event)"
    />
  </o-field>
</template>

<script>
export default {
  name: 'MovNumberinput',
  inheritAttrs: false,
  props: {
    value: Number,
    min: {
      type: [Number, String]
    },
    max: [Number, String],
    disabled: Boolean,
    variant: {
      type: String,
      default: 'primary'
    },
    expanded: Boolean,
    size: String,
    placeholder: [Number, String]
  },
  computed: {
    computedValue: {
      get() {
        return this.value;
      },
      set(value) {
        // Parses the number, so that "0" => 0, and "invalid" => null
        let newValue = Number(value) === 0 ? 0 : Number(value) || null;
        if (value === '' || value === undefined || value === null) {
          if (this.minNumber !== undefined) {
            newValue = this.minNumber;
          } else {
            newValue = null;
          }
        }
        if (newValue === null) {
          this.$emit('input', newValue);
        } else if (!isNaN(newValue) && newValue !== '-0') {
          this.$emit('input', Number(newValue));
        }
        this.$nextTick(() => {
          if (this.$refs.input) {
            this.$refs.input.checkHtml5Validity();
          }
        });
      }
    },

    fieldClasses() {
      return [{ 'is-expanded': this.expanded }];
    },

    minNumber() {
      return typeof this.min === 'string' ? parseFloat(this.min) : this.min;
    },
    maxNumber() {
      return typeof this.max === 'string' ? parseFloat(this.max) : this.max;
    }
  }
};
</script>
<style lang="scss" scoped>
::v-deep {
  .numberinput .input {
    text-align: center;
  }
}
</style>
