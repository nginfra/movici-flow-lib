import { ActionMenuItem } from '@movici-flow-common/types';
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class ByValueListMixin<Item> extends Vue {
  @Prop({ type: Array, default: () => [] }) readonly value!: [number, Item][];
  @Prop({ type: String, required: true }) readonly mode!: string;
  @Prop({ type: Number, default: 0 }) readonly minValue!: number;
  @Prop({ type: Number, default: 1 }) readonly maxValue!: number;
  @Prop({ type: Boolean, default: false }) readonly reversed!: boolean;
  @Prop({ type: String, default: null }) readonly dataType!: string | null;
  @Prop({ type: Array, default: null }) readonly entityEnums!: string[] | null;
  defaultOutputRow!: Item;

  get orderedValue() {
    return this.reversed ? this.value.slice().reverse() : this.value;
  }

  get output() {
    return this.orderedValue.map(val => val[1]);
  }

  get mappingValues() {
    return this.orderedValue.map(v => v[0]);
  }

  get isEnum() {
    return !!this.entityEnums;
  }

  get valueActions(): ActionMenuItem[] {
    return [
      {
        label: '' + this.$t('flow.visualization.resetValues'),
        icon: 'undo',
        iconPack: 'far',
        event: 'resetValues'
      },
      {
        label: '' + this.$t('flow.visualization.interpolateMinMax'),
        icon: 'sort',
        iconPack: 'far',
        event: 'interpolateMinMax',
        isDisabled: this.dataType === 'BOOLEAN'
      }
    ];
  }

  emitOriginalOrder(values: [number, Item][]) {
    this.$emit('input', this.reversed ? values.slice().reverse() : values);
  }

  addRow() {
    this.emitOriginalOrder([...this.orderedValue, [0, this.defaultOutputRow]]);
  }

  removeRow(idx: number) {
    const data = [...this.orderedValue];
    data.splice(idx, 1);
    this.emitOriginalOrder(data);
  }

  isMode(mode: string) {
    return this.mode === mode;
  }

  updateOutput(idx: number, newValue: Item) {
    this.emitOriginalOrder(
      this.orderedValue.map((item, arrayIdx) => {
        return arrayIdx === idx ? [item[0], newValue] : item;
      })
    );
  }

  updateMappingValue(idx: number, newValue: number) {
    this.emitOriginalOrder(
      this.orderedValue.map((item, arrayIdx) => {
        return arrayIdx === idx ? [newValue, item[1]] : item;
      })
    );
  }
}
