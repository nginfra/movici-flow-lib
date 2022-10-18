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
    <div class="columns mb-0 is-multiline" v-if="showVisiblity">
      <div class="column is-two-thirds-desktop is-full-tablet">
        <b-field
          required
          :label="$t('flow.visualization.basedOn')"
          :message="errors['selectedEntityProp']"
          :type="{ 'is-danger': errors['selectedEntityProp'] }"
        >
          <AttributeSelector
            :value="selectedEntityProp"
            :entity-props="entityProps"
            :filter-prop="filterProp"
            @input="updateAttribute"
          />
        </b-field>
      </div>
    </div>
    <div class="columns" v-if="showVisiblity && selectedEntityProp">
      <div class="column mapped-values is-full-tablet is-2">
        <label class="label"> {{ $t('flow.visualization.visibilityConfig.value') }}</label>
        <b-field v-for="(val, index) in mappingValues" class="is-align-items-center" :key="index">
          <div class="values is-flex is-align-items-center">
            <span class="is-flex-grow-1 values-from">
              <b-input
                :value="String(Boolean(val))"
                native-class="has-text-centered"
                size="is-small"
                disabled
              />
            </span>
          </div>
        </b-field>
      </div>
      <div class="column is-1 visibility">
        <label class="label"> {{ $t('flow.visualization.visibilityConfig.visible') }}</label>
        <b-field
          v-for="(val, index) in visibilities"
          class="is-flex is-align-items-center"
          :key="index"
        >
          <b-checkbox :value="val" @input="updateVisibilityFromIndex(index, $event)" />
        </b-field>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  ByValueVisibilityClause,
  PropertySummary,
  VisibilityClause,
  VisibilityMapping
} from '@movici-flow-common/types';
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator';
import ByValueMixin from './ByValueMixin';
import AttributeSelector from '@movici-flow-common/components/widgets/AttributeSelector.vue';
import isEqual from 'lodash/isEqual';
import AttributeMixin from './AttributeMixin';
import { attributeValidator } from './helpers';
import FormValidator from '@movici-flow-common/utils/FormValidator';

const DEFAULT_BOOLEAN_MAPPING = [
  [true, true],
  [false, false]
];

@Component({
  name: 'VisibilityConfigurator',
  components: {
    AttributeSelector
  }
})
export default class VisibilityConfigurator extends Mixins<
  AttributeMixin,
  ByValueMixin<VisibilityClause | null>
>(AttributeMixin, ByValueMixin) {
  @Prop({ type: Object, required: true }) declare readonly validator: FormValidator;
  // overrides ByValueMixin
  allowedPropertyTypes = ['BOOLEAN'];
  showVisiblity = false;
  mapping: VisibilityMapping = [];

  get currentClause(): ByValueVisibilityClause | null {
    if (!this.showVisiblity || !this.selectedEntityProp) return null;

    return {
      attribute: this.selectedEntityProp,
      mapping: this.mapping
    };
  }

  get mode(): 'number' | 'boolean' {
    return this.selectedDataType === 'BOOLEAN' ? 'boolean' : 'number';
  }

  get mappingValues(): boolean[] {
    return this.mapping.map(val => Boolean(val[0]));
  }

  get visibilities(): boolean[] {
    return this.mapping.map(val => val[1]);
  }

  get selectedEntityPropName(): string {
    return this.selectedEntityProp?.name ?? '';
  }

  get defaults() {
    return {
      attribute: null,
      mapping: DEFAULT_BOOLEAN_MAPPING
    };
  }

  /**
   * Updates mapping[index] into newValue and the other index are set as opposite of newValue
   * @param index index that will be changed
   * @param newValue new boolean value for index
   */
  updateVisibilityFromIndex(index: number, newValue: boolean) {
    this.mapping = this.mapping.map((val, i) => {
      return (index === i ? [val[0], newValue] : [val[0], !newValue]) as [boolean, boolean];
    });

    this.prepareEmitClause(this.currentClause);
  }

  @Watch('currentClause')
  prepareEmitClause(byValue: ByValueVisibilityClause | null) {
    this.emitClause(byValue ? { byValue } : null);
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
    this.validator.touch('selectedEntityProp');
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
        selectedEntityProp: attributeValidator(this, () => this.showVisiblity)
      },
      onValidate: e => {
        this.errors = e;
      }
    });
  }

  mounted() {
    const localValue: ByValueVisibilityClause = Object.assign(
      {},
      this.defaults,
      this.value?.byValue
    );

    this.mapping = localValue.mapping;
    this.toggleVisiblity(!!localValue.attribute);
    this.pickSelectedEntityProp(localValue.attribute);
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
