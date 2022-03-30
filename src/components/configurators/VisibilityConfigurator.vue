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
        <b-field required :label="$t('flow.visualization.basedOn')">
          <b-select
            :value="selectedEntityPropName"
            @input="updateEntityProp"
            :placeholder="$t('actions.select')"
            size="is-small"
            expanded
          >
            <option
              v-for="(prop, index) in entityProps"
              :disabled="!filterProp(prop)"
              :class="{ 'attribute-option-disabled': !filterProp(prop) }"
              :value="prop.name"
              :key="index"
              :title="prop.description"
            >
              {{ prop.name }}
            </option>
          </b-select>
        </b-field>
      </div>
    </div>
    <div class="columns" v-if="showVisiblity">
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
              ></b-input>
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
          <b-checkbox :value="val" @input="updateVisibilityFromIndex(index, $event)"></b-checkbox>
        </b-field>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  ByValueVisibilityClause,
  PropertySummary,
  PropertyType,
  VisibilityMapping
} from '@movici-flow-common/types';
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';

const DEFAULT_BOOLEAN_MAPPING = [
  [true, true],
  [false, false]
];

@Component({
  name: 'VisibilityConfigurator'
})
export default class VisibilityConfigurator extends Vue {
  @Prop() readonly value!: Partial<ByValueVisibilityClause>;
  @Prop({ default: () => [] }) entityProps!: PropertySummary[];
  showVisiblity = false;
  mapping: VisibilityMapping = [];
  selectedEntityProp: PropertySummary | null = null;
  attributeFromValue: PropertyType | null = null;

  get filteredEntityProps() {
    return this.entityProps.filter(prop => prop.data_type === 'BOOLEAN');
  }

  get mode(): 'number' | 'boolean' {
    return this.selectedDataType === 'BOOLEAN' ? 'boolean' : 'number';
  }

  get selectedDataType() {
    return this.selectedEntityProp?.data_type;
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

  updateVisibilityFromIndex(index: number, newValue: boolean) {
    const toEmit = this.mapping.map((val, i) => {
      return (index === i ? [val[0], newValue] : val) as [boolean, boolean];
    });

    this.emitClause(toEmit);
  }

  emitClause(mapping: VisibilityMapping) {
    this.$emit('input', {
      byValue: {
        attribute: this.selectedEntityProp,
        mapping
      }
    });
  }

  updateEntityProp(name: string) {
    const found = this.filteredEntityProps.find(entityProp => name === entityProp.name);
    if (found) this.selectedEntityProp = found;
  }

  filterProp(prop: PropertyType) {
    return ['BOOLEAN'].indexOf(prop.data_type) !== -1;
  }

  toggleVisiblity(value: boolean) {
    this.showVisiblity = value;
    if (!value) {
      this.$emit('input', null);
    } else {
      this.emitClause(this.mapping);
    }
  }

  @Watch('filteredEntityProps')
  pickSelectedEntityProp() {
    this.selectedEntityProp =
      this.filteredEntityProps.find(attr => {
        return (
          attr.component == this.attributeFromValue?.component &&
          attr.name == this.attributeFromValue?.name
        );
      }) ??
      this.filteredEntityProps[0] ??
      null;
  }

  @Watch('value')
  updateValue() {
    const localValue: ByValueVisibilityClause = Object.assign(
      {
        attribute: this.filteredEntityProps[0] ?? null,
        mapping: DEFAULT_BOOLEAN_MAPPING
      },
      this.value
    );

    this.showVisiblity = !!this.value;
    this.attributeFromValue = localValue.attribute ?? null;
    this.pickSelectedEntityProp();
    this.mapping = localValue.mapping;
  }

  mounted() {
    this.updateValue();
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
