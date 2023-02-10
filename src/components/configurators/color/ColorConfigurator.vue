<template>
  <div>
    <div class="columns mb-0 layer-kind">
      <div class="column is-two-thirds-desktop">
        <b-field>
          <b-radio class="mr-4" v-model="clauseType" native-value="static" size="is-small">
            {{ $t('flow.visualization.static') }}</b-radio
          >
          <b-radio v-model="clauseType" native-value="byValue" size="is-small">
            {{ $t('flow.visualization.byValue') }}
          </b-radio>
        </b-field>
      </div>
      <div class="column is-one-third-desktop">
        <b-field>
          <b-checkbox :value="showLegend" @input="updateShowLegend" size="is-small">
            {{ $t('flow.visualization.showLegend') }}
          </b-checkbox>
        </b-field>
      </div>
    </div>
    <template v-if="clauseType">
      <ColorStaticConfigurator
        v-if="clauseType === 'static'"
        :value="currentClause"
        :validator="validator"
        @input="updateSettings"
        size="is-small"
      />
      <template v-else-if="clauseType === 'byValue'">
        <div class="columns mb-0 is-multiline">
          <div class="column is-two-thirds-desktop is-full-tablet">
            <b-field
              required
              :label="$t('flow.visualization.basedOn')"
              :message="errors['selectedAttribute']"
              :type="{ 'is-danger': errors['selectedAttribute'] }"
            >
              <AttributeSelector
                :value="selectedAttribute"
                :entity-props="entityProps"
                :filter-prop="filterProp"
                @input="updateAttribute"
              />
            </b-field>
          </div>
        </div>
        <ColorByValueConfigurator
          v-if="selectedAttribute"
          :value="currentClause"
          :validator="validator"
          :entityProps="entityProps"
          :selectedAttribute="selectedAttribute"
          :summary="summary"
          @input="updateSettings"
        >
          <template #legend-labels="{ placeholders }">
            <LegendLabelsConfigurator
              v-if="showLegend"
              :value="legend"
              @input="updateLegend($event)"
              :placeholders="placeholders"
              :nItems="nSteps"
              reversed
            />
          </template>
        </ColorByValueConfigurator>
      </template>
      <hr />
      <ColorAdvSettingsConfigurator
        :value="advancedSettings"
        :geometry="geometry"
        :fillType="fillType"
        :clauseType="clauseType"
        @input="updateAdvancedSettings($event)"
      >
        <template #legend-labels v-if="showLegend">
          <LegendLabelsConfigurator
            v-model="advLegend"
            :nItems="2"
            :placeholders="['Special', 'Undefined']"
          />
        </template>
      </ColorAdvSettingsConfigurator>
    </template>
  </div>
</template>

<script lang="ts">
import {
  ByValueColorClause,
  AdvancedColorSettings,
  ColorClause,
  LegendOptions,
  PropertySummary,
  StaticColorClause
} from '@movici-flow-common/types';
import { Component, Mixins, Watch } from 'vue-property-decorator';
import ColorStaticConfigurator from './ColorStaticConfigurator.vue';
import ColorByValueConfigurator from './ColorByValueConfigurator.vue';
import LegendLabelsConfigurator from '../shared/LegendLabelsConfigurator.vue';
import ColorAdvSettingsConfigurator from './ColorAdvSettingsConfigurator.vue';
import { attributeValidator } from '../helpers';
import AttributeSelector from '@movici-flow-common/components/widgets/AttributeSelector.vue';
import isEqual from 'lodash/isEqual';
import ConfiguratorMixin from '../ConfiguratorMixin';

@Component({
  name: 'ColorConfigurator',
  components: {
    AttributeSelector,
    LegendLabelsConfigurator,
    ColorStaticConfigurator,
    ColorByValueConfigurator,
    ColorAdvSettingsConfigurator
  }
})
export default class ColorConfigurator extends Mixins<ConfiguratorMixin<ColorClause>>(
  ConfiguratorMixin
) {
  allowedPropertyTypes = ['BOOLEAN', 'INT', 'DOUBLE'];
  currentClause: ColorClause = {};
  clauseType: 'static' | 'byValue' | null = null;
  advancedSettings: AdvancedColorSettings | null = null;
  showLegend = false;
  legend: LegendOptions = {
    title: ''
  };
  advLegend: LegendOptions = {
    labels: ['Special', 'Undefined']
  };

  get staticSettings(): Partial<StaticColorClause> {
    return this.currentClause.static ?? {};
  }

  get byValueSettings(): Partial<ByValueColorClause> {
    return this.currentClause.byValue ?? { type: 'buckets', colors: [] };
  }

  get fillType(): 'buckets' | 'gradient' | null {
    return this.currentClause?.byValue?.type || null;
  }

  get nSteps(): number {
    if (this.clauseType === 'static') return 1;
    return this.currentClause.byValue?.colors?.length ?? 0;
  }

  updateSettings(updatedClause: { static?: StaticColorClause; byValue?: ByValueColorClause }) {
    this.currentClause = Object.assign({}, this.currentClause, updatedClause);
    this.emitClause();
  }

  updateAdvancedSettings(settings: AdvancedColorSettings) {
    this.advancedSettings = settings;
    this.emitClause();
  }

  updateLegend(legend: Partial<LegendOptions>) {
    this.legend = Object.assign({}, this.legend, legend);
    this.emitClause();
  }

  updateShowLegend(showLegend: boolean) {
    this.showLegend = showLegend;
    this.emitClause();
  }

  updateAttribute(val: PropertySummary | null) {
    if (val) {
      this.ensureProp(val);
    }
  }

  emitClause() {
    const toEmit: ColorClause = {};

    if (this.advancedSettings) {
      toEmit.advanced = this.advancedSettings;
    }

    if (this.showLegend) {
      toEmit.legend = this.legend;
    }

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
    this.validator.touch('selectedAttribute');
  }

  @Watch('value', { immediate: true })
  updateLocal(value: ColorClause) {
    if (value) {
      if (value?.legend) {
        this.showLegend = true;
        this.legend = value.legend;
      }
      this.clauseType = value.byValue ? 'byValue' : 'static';
      this.currentClause = Object.assign({}, this.currentClause, value);
      this.advancedSettings = value.advanced ?? null;
    } else {
      this.clauseType = 'static';
    }
  }

  setupAttributeValidator() {
    this.validator?.configure({
      validators: {
        selectedAttribute: attributeValidator(this, () => this.clauseType === 'byValue')
      },
      onValidate: e => {
        this.errors = e;
      }
    });
  }

  mounted() {
    this.setupAttributeValidator();
    if (this.value?.byValue?.attribute) {
      this.pickSelectedEntityProp(this.value.byValue.attribute);
    }
  }
}
</script>

<style lang="scss"></style>
