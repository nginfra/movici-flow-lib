Adapted from Buefy:
https://github.com/buefy/buefy/blob/52b18bb0776cff5eb06ea5f1851e9abdabef5b61/src/components/progress/Progress.vue

<template>
  <div class="progress-wrapper" :class="{ 'is-squared': !rounded }">
    <progress
      ref="progress"
      class="progress"
      :class="[newType, { 'is-squared': !rounded }]"
      :max="max"
      :value="value"
    >
      {{ newValue }}
    </progress>
  </div>
</template>

<script>
export default {
  name: 'MovProgress',
  props: {
    variant: {
      type: String,
      default: 'darkgrey'
    },
    size: String,
    rounded: {
      type: Boolean,
      default: true
    },
    value: {
      type: Number,
      default: undefined
    },
    max: {
      type: Number,
      default: 100
    },

    format: {
      type: String,
      default: 'raw',
      validator: value => {
        return ['raw', 'percent'].indexOf(value) >= 0;
      }
    },
    precision: {
      type: Number,
      default: 2
    },
    keepTrailingZeroes: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    isIndeterminate() {
      return this.value === undefined || this.value === null;
    },
    newType() {
      return [
        this.size,
        'is-' + this.variant,
        {
          'is-more-than-half': this.value && this.value > this.max / 2
        }
      ];
    },
    newValue() {
      return this.calculateValue(this.value);
    }
  },
  watch: {
    /**
     * When value is changed back to undefined, value of native progress get reset to 0.
     * Need to add and remove the value attribute to have the indeterminate or not.
     */
    isIndeterminate(indeterminate) {
      this.$nextTick(() => {
        if (this.$refs.progress) {
          if (indeterminate) {
            this.$refs.progress.removeAttribute('value');
          } else {
            this.$refs.progress.setAttribute('value', this.value);
          }
        }
      });
    }
  },
  methods: {
    calculateValue(value) {
      if (value === undefined || value === null || isNaN(value)) {
        return undefined;
      }

      const minimumFractionDigits = this.keepTrailingZeroes ? this.precision : 0;
      const maximumFractionDigits = this.precision;
      if (this.format === 'percent') {
        return new Intl.NumberFormat(undefined, {
          style: 'percent',
          minimumFractionDigits: minimumFractionDigits,
          maximumFractionDigits: maximumFractionDigits
        }).format(value / this.max);
      }

      return new Intl.NumberFormat(undefined, {
        minimumFractionDigits: minimumFractionDigits,
        maximumFractionDigits: maximumFractionDigits
      }).format(value);
    }
  }
};
</script>
