<template>
  <div>
    <div class="columns mb-0 is-multiline">
      <div class="column is-two-thirds-desktop is-full-tablet">
        <b-field>
          <b-checkbox :value="showVisiblity" @input="toggleVisiblity" size="is-small">
            {{ $t('flow.visualization.byValue') }}
          </b-checkbox>
        </b-field>
      </div>
    </div>
    <template v-if="showVisiblity">
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
        v-model="mapping"
        :selectedAttribute="selectedAttribute"
        :strategy="strategy"
        :summary="summary"
        :component="component"
        :label="$t('flow.visualization.visibilityConfig.visible')"
        buckets
      />
    </template>
  </div>
</template>

<script lang="ts">
import AttributeSelector from '@movici-flow-common/components/widgets/AttributeSelector.vue';
import {
  ByValueVisibilityClause,
  PropertySummary,
  VisibilityClause,
  VisibilityMapping
} from '@movici-flow-common/types';
import isEqual from 'lodash/isEqual';
import { Component, Mixins, Watch } from 'vue-property-decorator';
import ByValueConfigurator from './shared/ByValueConfigurator.vue';
import BooleanOutput from './shared/BooleanOutput.vue';
import ConfiguratorMixin from './ConfiguratorMixin';
import { attributeValidator } from './helpers';
import { MappingStrategy } from './shared/ValueMappingHelper';

class VisibilityMappingStrategy extends MappingStrategy<boolean> {
  defaultStepCount(): number {
    return 2;
  }

  defaultOutput(): boolean {
    return true;
  }
}

@Component({
  name: 'VisibilityConfigurator',
  components: {
    AttributeSelector,
    ByValueConfigurator
  }
})
export default class VisibilityConfigurator extends Mixins<ConfiguratorMixin<VisibilityClause>>(
  ConfiguratorMixin
) {
  allowedPropertyTypes = ['BOOLEAN', 'INT', 'DOUBLE'];
  showVisiblity = false;
  mapping: VisibilityMapping = [];
  component = BooleanOutput;
  strategy = new VisibilityMappingStrategy();

  get currentClause(): ByValueVisibilityClause | null {
    if (!this.showVisiblity || !this.selectedAttribute) return null;

    return {
      attribute: this.selectedAttribute,
      mapping: this.mapping
    };
  }

  @Watch('currentClause')
  prepareEmitClause(byValue: ByValueVisibilityClause | null) {
    this.$emit('input', byValue ? { byValue } : null);
  }

  /**
   * Toggles visibility, if false, remove any validator created and resets validation of possible errors
   * if true, tries to pick the currentClause attribute
   *
   * @param value new value of showVisiblity
   */
  toggleVisiblity(value: boolean) {
    if (value) {
      this.pickSelectedEntityProp(
        this.currentClause?.attribute ?? this.filteredEntityProps[0] ?? null
      );
    }
    this.validator.touch('selectedAttribute');
    this.prepareEmitClause(this.currentClause);
    this.showVisiblity = value;
  }

  /**
   * Check if the entityProps changed, so we reset the visibility
   */
  @Watch('entityProps')
  afterEntityProps(value: PropertySummary[], old?: PropertySummary[]) {
    if (!isEqual(value, old)) {
      this.toggleVisiblity(false);
    }
  }

  updateAttribute(val: PropertySummary | null) {
    if (val) {
      this.ensureProp(val);
    }
  }

  setupAttributeValidator() {
    this.validator.configure({
      validators: {
        selectedAttribute: attributeValidator(this, () => this.showVisiblity)
      },
      onValidate: e => {
        this.errors = e;
      }
    });
  }

  mounted() {
    const mapping = this.value?.byValue?.mapping;
    if (mapping?.length) {
      this.mapping = mapping;
    }
    const attribute = this.value?.byValue?.attribute ?? null;
    this.toggleVisiblity(!!attribute);
    this.pickSelectedEntityProp(attribute);
    this.setupAttributeValidator();
  }

  beforeDestroy() {
    if (this.validator) {
      this.destroyValidator();
    }
  }
}
</script>

<style scoped lang="scss">
::v-deep {
  .visibility {
    .field {
      height: 30px;
    }
  }
}
</style>
