<template>
  <div v-if="value">
    <slot name="options-top" v-bind="{ mappingHelper }"></slot>
    <div class="columns mb-0 is-multiline">
      <div class="column is-full">
        <div class="is-flex">
          <b-field
            class="mr-4 is-flex-shrink-1"
            :label="$t('flow.visualization.byValueConfig.steps')"
          >
            <b-select
              :value="value.length"
              @input="updateSteps"
              size="is-small"
              expanded
              :disabled="!isMode('number')"
            >
              <option v-for="index in stepArray" :key="index" :value="index">{{ index }}</option>
            </b-select>
          </b-field>
          <slot name="options-side" v-bind="{ mappingHelper }"></slot>
        </div>
      </div>
    </div>
    <div class="columns mb-0 is-multiline">
      <div class="column py-0 is-two-thirds-desktop is-full-tablet">
        <ByValueList
          :value="value"
          :component="component"
          :props="props"
          :mappingHelper="mappingHelper"
          :maxValue="maxValue"
          @update:maxValue="setMaxValue"
          :label="label"
          reversed
          @input="emitMapping($event)"
          @click="$emit('click', $event)"
          @resetValues="resetValues"
          @interpolateMinMax="interpolateMinMax"
          @add-row="addRow"
        >
          <template #after-output="{ output }">
            <slot name="after-output" v-bind="{ output, mappingHelper }"></slot>
          </template>
        </ByValueList>
      </div>
      <div class="column py-0 is-one-third-desktop is-full-tablet">
        <slot name="legend-labels" v-bind="{ placeholders: legendPlaceHolders }" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import AttributeSelector from '@movici-flow-common/components/widgets/AttributeSelector.vue';
import { DatasetSummary, PropertySummary } from '@movici-flow-common/types';
import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import ByValueList from '../shared/ByValueList.vue';
import {
  ValueMappingHelper,
  createValueMappingHelper,
  MappingMode,
  MappingStrategy
} from '../shared/ValueMappingHelper';

type PlaceholderType = 'single' | 'range';

function getLegendPlaceholders(
  items: number[],
  type: PlaceholderType,
  maxValue?: number | null
): string[] {
  if (!items.length) return [];
  return items.map((_, index) => getSingleLegendPlaceholder(items, type, index, maxValue));
}

function getSingleLegendPlaceholder(
  items: number[],
  type: PlaceholderType,
  index: number,
  maxValue?: number | null
): string {
  if (index > items.length - 1) {
    throw RangeError('index out of bounds');
  }
  let rv = `${items[index]}`;
  if (type === 'range') {
    rv += ' - ' + (items[index + 1] ?? maxValue ?? '');
  }
  return rv;
}

@Component({
  name: 'ByValueConfigurator',
  components: {
    AttributeSelector,
    ByValueList
  }
})
export default class ByValueConfigurator<T> extends Vue {
  @Prop({ type: Array, default: null }) readonly value!: [number, T][] | null;
  @Prop({ type: Object, required: true }) readonly selectedAttribute!: PropertySummary;
  @Prop({ type: Object, required: true }) strategy!: MappingStrategy<T>;
  @Prop({ type: Object, default: null }) readonly summary!: DatasetSummary | null;
  @Prop({ required: true }) readonly component!: string | Vue;
  @Prop({ type: Object, default: () => Object() }) readonly props!: Record<string, unknown>;
  @Prop({ default: '' }) readonly label!: string;
  @Prop({ type: Boolean, default: false }) readonly buckets!: boolean;
  @Prop({ type: Number, default: null }) readonly maxValue!: number | null;

  mappingHelper: ValueMappingHelper<T> | null = null;

  stepArray: number[] = [2, 3, 4, 5, 6, 7, 8];

  get enums() {
    return this.summary?.general?.enum;
  }

  get enumLabels() {
    return this.enums?.[this.selectedAttribute?.enum_name ?? ''] ?? null;
  }

  get legendPlaceHolders() {
    if (this.isMode('enum')) {
      return this.enumLabels;
    }
    if (this.isMode('boolean')) {
      return ['no', 'yes'];
    }
    return getLegendPlaceholders(
      this.value?.map(v => v[0]) ?? [],
      this.isMode('buckets') ? 'range' : 'single',
      this.maxValue
    );
  }

  isMode(query: MappingMode) {
    return this.mappingHelper!.modeFlags.includes(query);
  }

  interpolateMinMax() {
    this.emitMapping(this.mappingHelper!.linearizeValues(this.value ?? []));
  }

  updateSteps(nSteps: number) {
    this.emitMapping(this.mappingHelper!.updateSteps(this.value ?? [], nSteps));
  }

  resetValues() {
    const result = this.mappingHelper!.resetMinMax(this.value ?? []);
    this.$emit('update:maxValue', this.mappingHelper!.getMaxValue());
    this.emitMapping(result);
  }

  addRow() {
    this.emitMapping(this.mappingHelper!.addRow(this.value ?? []));
  }

  emitMapping(mapping: [number, T][]) {
    this.$emit('input', mapping);
  }

  setMaxValue(val: number | null) {
    this.mappingHelper!.setMaxValue(val);
    this.emitMaxValueFromHelper();
  }

  emitMaxValueFromHelper() {
    this.$emit('update:maxValue', this.mappingHelper!.getMaxValue());
  }
  @Watch('selectedAttribute')
  updateAttributeSummary(summary: PropertySummary) {
    this.evolveMappingHelper({ summary, buckets: this.buckets }, { resetMinMax: true });
    this.emitMaxValueFromHelper();
  }

  @Watch('strategy')
  updateStrategy(strategy: MappingStrategy<T>) {
    this.evolveMappingHelper({ strategy });
  }

  @Watch('enums')
  updateEnums(enums: Record<string, string[]>) {
    this.evolveMappingHelper({ enums });
  }

  @Watch('buckets')
  updateBuckets(buckets: boolean) {
    const mapping = this.value ?? [];
    const maxValue = this.mappingHelper!.getMaxValue(mapping);
    this.mappingHelper = this.mappingHelper!.evolve({ buckets });
    const newMapping = this.mappingHelper.initializeMapping(mapping, {
      overrideMax: maxValue
    });
    this.emitMaxValueFromHelper();
    this.emitMapping(newMapping);
  }

  @Watch('maxValue')
  updateMaxValue() {
    if (this.maxValue != null) {
      this.mappingHelper!.setMaxValue(this.maxValue);
    }
  }
  evolveMappingHelper(
    evolveArgs: {
      summary?: PropertySummary;
      strategy?: MappingStrategy<T>;
      enums?: Record<string, string[]>;
      buckets?: boolean;
    },
    initializeFlags?: {
      resetMinMax?: boolean;
    }
  ) {
    this.mappingHelper = this.mappingHelper!.evolve(evolveArgs);
    this.emitMapping(this.mappingHelper.initializeMapping(this.value ?? [], initializeFlags));
  }

  created() {
    this.mappingHelper = createValueMappingHelper({
      summary: this.selectedAttribute,
      strategy: this.strategy,
      buckets: this.buckets,
      enums: this.enums
    });
    this.updateMaxValue();
  }

  mounted() {
    this.emitMapping(this.mappingHelper!.initializeMapping(this.value ?? []));
    this.emitMaxValueFromHelper();
  }
}
</script>

<style scoped lang="scss"></style>
