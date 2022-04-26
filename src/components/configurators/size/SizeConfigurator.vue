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
        :validator="validator"
        :geometry="geometry"
        @input="updateSettings($event)"
      >
      </SizeStaticConfigurator>
      <SizeByValueConfigurator
        v-else-if="clauseType === 'byValue'"
        :value="currentClause"
        :entityProps="entityProps"
        :geometry="geometry"
        @input="updateSettings($event)"
      >
      </SizeByValueConfigurator>
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
import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import SizeStaticConfigurator from './SizeStaticConfigurator.vue';
import SizeByValueConfigurator from './SizeByValueConfigurator.vue';
import FormValidator from '@movici-flow-common/utils/FormValidator';

@Component({
  components: {
    SizeStaticConfigurator,
    SizeByValueConfigurator
  }
})
export default class SizeConfigurator extends Vue {
  @Prop({ default: () => ({}) }) readonly value!: SizeClause;
  @Prop({ default: () => [] }) readonly entityProps!: PropertySummary[];
  @Prop([String]) readonly geometry!: FlowVisualizerType;
  @Prop([Object]) validator!: FormValidator;
  currentClause: SizeClause = {};
  clauseType: 'static' | 'byValue' | null = null;

  get staticSettings(): Partial<StaticSizeClause> {
    return this.currentClause.static ?? {};
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

  // Saves the old configuration if the user is changing between the kinds
  @Watch('clauseType')
  kindUpdated() {
    if (!this.clauseType) return;
    this.updateSettings({ [this.clauseType]: this.currentClause[this.clauseType] ?? {} });
  }

  @Watch('value', { immediate: true })
  updateLocal() {
    if (this.value) {
      this.clauseType = this.value.byValue ? 'byValue' : 'static';
      this.currentClause = Object.assign({}, this.currentClause, this.value);
    } else {
      this.clauseType = 'static';
    }
  }
}
</script>

<style lang="scss"></style>
