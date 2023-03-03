<template>
  <div>
    <div class="columns mb-0 layer-kind">
      <div class="column is-two-thirds-desktop">
        <o-field>
          <o-radio class="mr-4" v-model="clauseType" native-value="static" size="small">
            {{ $t('flow.visualization.static') }}</o-radio
          >
          <o-radio v-model="clauseType" native-value="byValue" size="small">
            {{ $t('flow.visualization.byValue') }}
          </o-radio>
        </o-field>
      </div>
      <div class="column is-one-third-desktop">
        <o-field>
          <o-checkbox :value="showLegend" @input="updateShowLegend" size="small">
            {{ $t('flow.visualization.showLegend') }}
          </o-checkbox>
        </o-field>
      </div>
    </div>
    <IconStaticConfigurator
      v-if="clauseType === 'static'"
      :value="currentClause"
      @input="updateSettings"
    />
    <template v-else-if="clauseType === 'byValue'">
      <div class="columns mb-0 is-multiline">
        <div class="column is-two-thirds-desktop is-full-tablet">
          <o-field
            required
            :label="$t('flow.visualization.basedOn')"
            :message="errors['selectedAttribute']"
            :variant="errors['selectedAttribute'] && 'danger'"
          >
            <AttributeSelector
              :value="selectedAttribute"
              :entity-props="entityProps"
              :filter-prop="filterProp"
              @input="updateAttribute"
            />
          </o-field>
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
import AttributeSelector from '@movici-flow-common/components/widgets/AttributeSelector.vue';
import { IconClause, LegendOptions, PropertySummary } from '@movici-flow-common/types';
import { MAPPED_ICONS } from '@movici-flow-common/visualizers/visualizerModules/iconCommon';
import { Component, Mixins, Watch } from 'vue-property-decorator';
import ConfiguratorMixin from '../ConfiguratorMixin';
import { attributeValidator } from '../helpers';
import ByValueConfigurator from '../shared/ByValueConfigurator.vue';
import LegendLabelsConfigurator from '../shared/LegendLabelsConfigurator.vue';
import { MappingStrategy } from '../shared/ValueMappingHelper';
import IconSelector from './IconDropdownSelector.vue';
import IconStaticConfigurator from './IconStaticConfigurator.vue';

class IconMappingStrategy extends MappingStrategy<string> {
  defaultStepCount(): number {
    return 4;
  }

  defaultOutput(): string {
    return Object.keys(MAPPED_ICONS.icons)[0];
  }
}
@Component({
  name: 'IconConfigurator',
  components: {
    IconStaticConfigurator,
    AttributeSelector,
    LegendLabelsConfigurator,
    ByValueConfigurator
  }
})
export default class IconConfigurator extends Mixins<ConfiguratorMixin<IconClause>>(
  ConfiguratorMixin
) {
  allowedPropertyTypes = ['BOOLEAN', 'INT', 'DOUBLE'];
  currentClause: IconClause = {};
  clauseType: 'static' | 'byValue' | null = null;
  showLegend = false;
  legend: LegendOptions = {
    title: ''
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
    return new IconMappingStrategy();
  }

  get component() {
    return IconSelector;
  }
  get componentProps() {
    return {
      iconOptions: MAPPED_ICONS.icons,
      placeholder: this.$t('actions.select'),
      pack: 'fas',
      expanded: true
    };
  }
  get header() {
    return this.$t('flow.visualization.type.icons');
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
