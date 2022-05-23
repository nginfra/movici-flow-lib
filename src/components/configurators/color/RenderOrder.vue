<template>
  <b-field>
    <template #label>
      {{ $t('flow.visualization.colorConfig.advanced.renderOrder') }}
      <b-icon
        size="is-small"
        icon-pack="far"
        icon="info-circle"
        :title="$t('flow.visualization.colorConfig.advanced.renderOrderInfo')"
      />
    </template>
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

@Component({ name: 'RenderOrder' })
export default class RenderOrder extends Vue {
  @Prop({ type: String, default: RenderOrderType.DISABLED }) readonly value!: RenderOrderType;

  get labels(): RenderOrderType[] {
    return Object.values(RenderOrderType);
  }

  input(newValue: RenderOrderType) {
    this.$emit('input', newValue);
  }
  mounted() {
    if (this.labels.indexOf(this.value) === -1) {
      this.input(RenderOrderType.DISABLED);
    }
  }
}
</script>

<style scoped lang="scss"></style>
