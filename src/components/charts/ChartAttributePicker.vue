<template>
  <div class="modal-card">
    <div class="box has-background-white p-4">
      <o-field
        :message="errors['duplicateEntityId']"
        :variant="errors['duplicateEntityId'] && 'danger'"
      >
        <template #label>
          <div class="is-flex is-align-items-center">
            <label class="label is-size-7 mb-0 mr-2">{{
              $t('flow.visualization.graph.chooseAttribute')
            }}</label>
            <o-icon
              :title="$t('flow.visualization.graph.attributeInfo')"
              size="tiny"
              icon="info-circle"
              variant="info"
            />
          </div>
        </template>
        <AttributeSelector
          expanded
          :value="selectedAttribute"
          :entity-props="properties"
          :filter-prop="filterProp"
          @input="updateAttribute"
        />
      </o-field>
      <MovButtons
        size="small"
        isPulledRight
        :value="buttons"
        @save="saveChart()"
        @saveAndEdit="saveChart(true)"
        @cancel="$emit('close')"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { MoviciError } from '@movici-flow-common/errors';
import SummaryListing from '@movici-flow-common/mixins/SummaryListing';
import ValidationProvider from '@movici-flow-common/mixins/ValidationProvider';
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator';
import AttributeSelector from '@movici-flow-common/components/widgets/AttributeSelector.vue';
import FormValidator from '@movici-flow-common/utils/FormValidator';
import {
  ButtonItem,
  DeckEntityObject,
  IMPORTANT_ATTRIBUTES,
  PropertySummary,
  PropertyType
} from '@movici-flow-common/types';
import {
  ChartVisualizerInfo,
  ChartVisualizerItem
} from '@movici-flow-common/visualizers/VisualizerInfo';
import { hexToColorTriple, MoviciColors } from '@movici-flow-common/visualizers/maps/colorMaps';

@Component({
  name: 'ChartAttributePicker',
  components: { AttributeSelector }
})
export default class ChartAttributePicker extends Mixins(ValidationProvider, SummaryListing) {
  @Prop({ type: Array, default: () => [] }) value!: ChartVisualizerInfo[];
  @Prop({ type: String, default: '' }) scenarioUUID!: string;
  @Prop({ type: String, default: '' }) datasetName!: string;
  @Prop({ type: String, default: '' }) datasetUUID!: string;
  @Prop({ type: String, default: '' }) entityGroup!: string;
  @Prop({ type: Object, required: true }) object!: DeckEntityObject<unknown>;

  allowedPropertyTypes = ['INT', 'DOUBLE', 'BOOLEAN'];
  selectedAttribute: PropertyType | null = null;
  declare validator: FormValidator;

  get filteredEntityProps() {
    return this.properties.filter(this.filterProp);
  }

  get errorMessage() {
    return '';
  }

  get isValid() {
    return this.selectedAttribute && !this.hasErrors;
  }

  get buttons(): ButtonItem[] {
    return [
      {
        variant: 'success',
        label: '' + this.$t('actions.save'),
        icon: 'save',
        iconPack: 'fas',
        event: 'save',
        isDisabled: !this.isValid
      },
      {
        variant: 'success',
        label: `${this.$t('actions.save')} & ${this.$t('actions.edit')}`,
        icon: 'edit',
        iconPack: 'fas',
        event: 'saveAndEdit',
        isDisabled: !this.isValid
      },
      {
        label: '' + this.$t('actions.cancel'),
        icon: 'times',
        iconPack: 'fas',
        event: 'cancel'
      }
    ];
  }

  filterProp(prop: PropertyType) {
    return this.allowedPropertyTypes.indexOf(prop.data_type) !== -1;
  }

  updateAttribute(val: PropertySummary | null) {
    if (val) {
      this.ensureProp(val);
      this.validator.validate();
    }
  }

  saveChart(edit?: boolean) {
    const attribute = this.selectedAttribute?.name ?? '';
    const [idx, charts] = this.constructCharts(attribute);
    this.$emit('input', charts);
    this.$emit('openChart', charts[idx].id);
    if (edit) {
      this.$emit('openConfig', idx);
    }
    this.$emit('close');
  }

  constructCharts(attribute: string): [number, ChartVisualizerInfo[]] {
    const found = this.value.findIndex(chart => chart.attribute === attribute) ?? null,
      chartItem = new ChartVisualizerItem({
        datasetName: this.datasetName,
        datasetUUID: this.datasetUUID,
        entityGroup: this.entityGroup,
        entityId: this.object.id,
        entityIdx: this.object.idx,
        attribute,
        name: getItemName(this.object),
        color: getSuggestedColor(this.value[found] ?? null),
        settings: {}
      });

    if (found < 0) {
      return [
        this.value.length,
        [
          ...this.value,
          new ChartVisualizerInfo({
            attribute,
            scenarioUUID: this.scenarioUUID,
            title: attribute,
            items: [chartItem]
          })
        ]
      ];
    } else {
      return [
        found,
        this.value.map(chart => {
          if (chartItem.attribute === chart.attribute) {
            return chart.addItem(chartItem);
          }
          return chart;
        })
      ];
    }
  }

  ensureProp(prop: PropertySummary) {
    const found = this.filteredEntityProps.find(entityProp => prop.name === entityProp.name);
    if (found) {
      this.validated('selectedAttribute', found);
    } else {
      throw new MoviciError('Invalid attribute selected');
    }
  }

  @Watch('datasetUUID', { immediate: true })
  setDatasetUUID() {
    this.currentDatasetUUID = this.datasetUUID;
  }

  mounted() {
    this.currentEntityName = this.entityGroup;
    this.validator = new FormValidator({
      validators: {
        duplicateEntityId: () => {
          const found = this.value.find(chart => {
            return chart.items.some(i => {
              return (
                i.datasetName == this.datasetName &&
                i.entityGroup == this.entityGroup &&
                i.attribute === this.selectedAttribute?.name &&
                i.entityId === this.object.id &&
                i.entityIdx === this.object.idx
              );
            });
          });
          if (found)
            return 'A chart with this attribute and entity already exists, please select other attribute.';
        }
      },
      onValidate: e => {
        this.errors = e;
      }
    });
  }
}
const colorPickerPresets = Object.values(MoviciColors);

function getSuggestedColor(chart: ChartVisualizerInfo | null) {
  return hexToColorTriple(
    colorPickerPresets[chart?.items.length ?? 0 % (colorPickerPresets.length - 1)]
  );
}
function getItemName(obj: DeckEntityObject<unknown>): string {
  for (const attr of IMPORTANT_ATTRIBUTES) {
    const val = obj[attr];
    if (val) return val;
  }
  return '#' + obj.id;
}
</script>
<style lang="scss" scoped>
.modal-card {
  width: inherit;
}
</style>
