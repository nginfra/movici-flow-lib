<template>
  <b-checkbox class="fixed-height" v-model="value_" />
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component({
  name: 'BooleanOutput'
})
export default class BooleanOutput extends Vue {
  @Prop() readonly value!: boolean;

  get value_() {
    return this.value;
  }
  set value_(val: boolean) {
    this.$emit('input', val);
  }
}
</script>

<style lang="scss" scoped>
.fixed-height {
  padding-top: 5px;
}
</style>
