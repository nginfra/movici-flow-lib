<template>
  <div>
    <b-field v-for="(val, index) in value" class="is-align-items-center" :key="index">
      <b-input
        :value="String(Boolean(val))"
        native-class="has-text-centered"
        size="is-small"
        disabled
      ></b-input>
    </b-field>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';

@Component({ name: 'BooleanInputs' })
export default class BooleanInputs extends Vue {
  @Prop({ type: Array, required: true }) readonly value!: number[];
}
</script>
