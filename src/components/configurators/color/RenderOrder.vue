<template>
  <b-field :label="$t('flow.visualization.colorConfig.advanced.renderOrder')">
    <div class="is-flex is-flex-direction-column">
      <b-radio
        v-for="(label, index) in labels"
        :key="index"
        class="mb-2"
        size="is-small"
        :value="value"
        @input="input"
        :native-value="label"
        type="is-success is-outlined"
      >
        <span>{{ $t('flow.visualization.colorConfig.advanced.' + label) }}</span>
      </b-radio>
    </div>
  </b-field>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import { RenderOrderType } from '@movici-flow-common/types';

@Component({
  name: 'RenderOrder'
})
export default class RenderOrder extends Vue {
  @Prop({ default: 'none' }) value!: RenderOrderType;

  get labels(): RenderOrderType[] {
    return Object.values(RenderOrderType);
  }

  input(newValue: RenderOrderType) {
    this.$emit('input', newValue);
  }
}
</script>

<style scoped lang="scss"></style>
