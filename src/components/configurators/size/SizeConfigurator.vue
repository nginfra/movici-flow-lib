<template>
  <div>
    <div class="columns mb-0 layer-kind">
      <div class="column is-two-thirds-desktop is-full-tablet">
        <b-radio class="mr-4" v-model="clauseType" native-value="static" size="is-small">
          {{ $t('flow.visualization.static') }}</b-radio
        >
        <b-radio v-model="clauseType" native-value="byValue" size="is-small">
          {{ $t('flow.visualization.byValue') }}
        </b-radio>
      </div>
    </div>
    <div v-if="clauseType">
      <!-- todo: add a radius / diameter in points option and account for it on the size module -->
      <SizeStaticConfigurator
        v-if="clauseType === 'static'"
        :value="currentClause"
        :name="name"
        :validator="validator"
        :geometry="geometry"
        @input="updateSettings($event)"
      />
      <SizeByValueConfigurator
        v-else-if="clauseType === 'byValue'"
        :value="currentClause"
        :name="name"
        :validator="validator"
        :entityProps="entityProps"
        :geometry="geometry"
        @input="updateSettings($event)"
      />
    </div>
  </div>
</template>

<script lang="ts">
import {
  ByValueSizeClause,
  SizeClause,
  StaticSizeClause,
  PropertySummary,
  FlowVisualizerType
} from '@movici-flow-common/types';
import { Component, Prop, Watch, Mixins } from 'vue-property-decorator';
import SizeStaticConfigurator from './SizeStaticConfigurator.vue';
import SizeByValueConfigurator from './SizeByValueConfigurator.vue';
import ValidationProvider from '@movici-flow-common/mixins/ValidationProvider';
import FormValidator from '@movici-flow-common/utils/FormValidator';
import isEqual from 'lodash/isEqual';

@Component({
  name: 'SizeConfigurator',
  components: {
    SizeStaticConfigurator,
    SizeByValueConfigurator
  }
})
export default class SizeConfigurator extends Mixins(ValidationProvider) {
  @Prop({ type: Object, default: () => new Object() }) readonly value!: SizeClause;
  @Prop({ type: Array, default: () => [] }) readonly entityProps!: PropertySummary[];
  @Prop({ type: String, default: FlowVisualizerType.POINTS })
  readonly geometry!: FlowVisualizerType;
  @Prop({ type: Object, required: true }) declare readonly validator: FormValidator;
  currentClause: SizeClause = {};
  clauseType: 'static' | 'byValue' | null = null;

  get staticSettings(): Partial<StaticSizeClause> {
    return this.currentClause.static ?? {};
  }

  get byValueSettings(): Partial<ByValueSizeClause> {
    return this.currentClause.byValue ?? {};
  }

  updateSettings(updatedClause: { static?: StaticSizeClause; byValue?: ByValueSizeClause }) {
    this.currentClause = Object.assign({}, this.currentClause, updatedClause);
    this.emitClause();
  }

  emitClause() {
    const toEmit: SizeClause = {};

    if (this.clauseType === 'static') {
      toEmit.static = this.currentClause.static;
    } else {
      toEmit.byValue = this.currentClause.byValue;
    }

    this.$emit('input', toEmit);
  }

  @Watch('entityProps')
  afterEntityProps(value: PropertySummary[], old?: PropertySummary[]) {
    if (!isEqual(value, old)) {
      delete this.currentClause.static;
      delete this.currentClause.byValue;
      this.clauseType = 'static';
    }
  }

  // Saves the old configuration if the user is changing between the kinds
  @Watch('clauseType')
  kindUpdated() {
    if (!this.clauseType) return;
    this.updateSettings({ [this.clauseType]: this.currentClause[this.clauseType] ?? {} });
  }

  @Watch('value', { immediate: true })
  updateLocal(value: SizeClause) {
    if (value) {
      this.clauseType = value.byValue ? 'byValue' : 'static';
      this.currentClause = Object.assign({}, this.currentClause, value);
    } else {
      this.clauseType = 'static';
    }
  }
}
</script>

<style lang="scss"></style>
