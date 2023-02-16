<template>
  <b-numberinput v-model="value_" :controls="false" :min-step="1e-15" size="is-small" />
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component({
  name: 'NumberOutput'
})
export default class NumberOutput extends Vue {
  @Prop() readonly value!: number;

  get value_() {
    return this.value;
  }
  set value_(val: number) {
    this.$emit('input', val);
  }
}
</script>

<style lang="scss" scoped></style>
