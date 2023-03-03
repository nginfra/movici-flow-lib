<template>
  <o-field>
    <template #label>
      {{ $t('flow.visualization.colorConfig.advanced.renderOrder') }}
      <o-icon
        size="small"
        variant="info"
        icon-pack="far"
        icon="info-circle"
        :title="$t('flow.visualization.colorConfig.advanced.renderOrderInfo')"
      />
    </template>
    <div class="is-flex is-flex-direction-column">
      <o-radio
        v-for="(label, index) in labels"
        :key="index"
        class="mb-2"
        size="small"
        :value="value"
        @input="input"
        :native-value="label"
        type="is-success is-outlined"
      >
        <span>{{ $t('flow.visualization.colorConfig.advanced.' + label) }}</span>
      </o-radio>
    </div>
  </o-field>
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
