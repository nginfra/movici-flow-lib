<template>
  <div>
    <o-field v-for="(val, index) in value" class="is-align-items-center" :key="index">
      <o-input
        :value="String(Boolean(val))"
        native-class="has-text-centered"
        size="small"
        disabled
      />
    </o-field>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';

@Component({ name: 'BooleanInputs' })
export default class BooleanInputs extends Vue {
  @Prop({ type: Array, required: true }) readonly value!: number[];
}
</script>
