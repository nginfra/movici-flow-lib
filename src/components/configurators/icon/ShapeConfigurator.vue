<template>
  <div>
    <div class="columns mb-0 layer-kind">
      <div class="column is-two-thirds-desktop">
        <b-field>
          <b-radio class="mr-4" v-model="clauseType" native-value="static" size="is-small">
            {{ $t('flow.visualization.static') }}
          </b-radio>
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
    <ShapeStaticConfigurator
      v-if="clauseType === 'static'"
      :value="currentClause"
      :validator="staticValidator"
      @input="updateSettings"
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
      <ByValueConfigurator
        v-if="selectedAttribute"
        v-model="icons"
        :selectedAttribute="selectedAttribute"
        :strategy="strategy"
        :summary="summary"
        :component="component"
        :props="componentProps"
        :label="header"
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
      </ByValueConfigurator>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator';
import ShapeStaticConfigurator from './ShapeStaticConfigurator.vue';
import { IconClause, LegendOptions, PropertySummary } from '@movici-flow-common/types';
import AttributeSelector from '@movici-flow-common/components/widgets/AttributeSelector.vue';
import ConfiguratorMixin from '../ConfiguratorMixin';
import { attributeValidator } from '../helpers';
import LegendLabelsConfigurator from '../shared/LegendLabelsConfigurator.vue';
import { MAPPED_ICONS } from '@movici-flow-common/visualizers/visualizerModules/iconCommon';
import IconSelector from './IconDropdownSelector.vue';
import ByValueConfigurator from '../shared/ByValueConfigurator.vue';
import { MappingStrategy } from '../shared/ValueMappingHelper';

class ShapeMappingStrategy extends MappingStrategy<string> {
  defaultStepCount(): number {
    return 4;
  }

  defaultOutput(): string {
    return Object.keys(MAPPED_ICONS.shapes)[0];
  }
}

@Component({
  name: 'ShapeConfigurator',
  components: {
    ShapeStaticConfigurator,
    AttributeSelector,
    LegendLabelsConfigurator,
    ByValueConfigurator
  }
})
export default class ShapeConfigurator extends Mixins<ConfiguratorMixin<IconClause>>(
  ConfiguratorMixin
) {
  allowedPropertyTypes = ['BOOLEAN', 'INT', 'DOUBLE'];
  currentClause: IconClause = {};
  clauseType: 'static' | 'byValue' | null = null;
  showLegend = false;
  legend: LegendOptions = {
    title: ''
  };
  advLegend: LegendOptions = {
    labels: ['Special', 'Undefined']
  };
  get icons() {
    return this.currentClause.byValue?.icons ?? [];
  }
  set icons(val: [number, string][]) {
    this.updateSettings({
      byValue: {
        attribute: this.selectedAttribute,
        icons: val
      }
    });
  }
  get strategy() {
    return new ShapeMappingStrategy();
  }

  get component() {
    return IconSelector;
  }
  get componentProps() {
    return {
      iconOptions: MAPPED_ICONS.shapes,
      placeholder: this.$t('actions.select'),
      pack: 'fas',
      expanded: true
    };
  }
  get header() {
    return this.$t('flow.visualization.iconConfig.shapes');
  }
  get staticValidator() {
    return this.validator.child('static');
  }

  get byValueValidator() {
    return this.validator.child('byValue');
  }

  get nSteps(): number {
    if (this.clauseType === 'static') return 1;
    return this.currentClause.byValue?.icons?.length ?? 0;
  }

  updateAttribute(val: PropertySummary | null) {
    if (val) {
      this.ensureProp(val);
    }
  }

  updateSettings(updatedClause: IconClause) {
    this.currentClause = updatedClause;
    this.emitClause();
  }

  updateShowLegend(showLegend: boolean) {
    this.showLegend = showLegend;
    this.emitClause();
  }

  updateLegend(legend: Partial<LegendOptions>) {
    this.legend = Object.assign({}, this.legend, legend);
    this.emitClause();
  }

  emitClause() {
    const toEmit: IconClause = {};

    if (this.showLegend) {
      toEmit.legend = this.legend;
    } else {
      delete toEmit.legend;
    }

    if (this.clauseType === 'static') {
      toEmit.static = this.currentClause.static;
    } else {
      toEmit.byValue = this.currentClause.byValue;
    }

    this.$emit('input', toEmit);
  }

  @Watch('value', { immediate: true })
  updateLocal() {
    if (this.value) {
      if (this.value?.legend) {
        this.showLegend = true;
        this.legend = this.value.legend;
      }
      this.clauseType = this.value.byValue ? 'byValue' : 'static';
      this.currentClause = Object.assign({}, this.currentClause, this.value);
    } else {
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

<style scoped lang="scss"></style>
