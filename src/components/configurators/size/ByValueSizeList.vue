<template>
  <div class="is-flex min-max mt-1">
    <div class="values is-flex is-flex-shrink-1 is-flex-direction-column">
      <span class="is-flex">
        <label class="label mr-1 is-flex-grow-1">
          {{ $t('flow.visualization.sizeConfig.value') }}
        </label>
        <MovActionMenu
          :value="valueActions"
          @resetValues="$emit('resetValues')"
          @interpolateMinMax="$emit('interpolateMinMax')"
        />
      </span>
      <div class="is-flex is-flex-direction-column">
        <b-field v-for="(val, i) in mappingValues" :key="i">
          <b-numberinput
            :value="val"
            @input="updateMappingValue(i, $event)"
            :controls="false"
            :min-step="1e-15"
            step="1"
            size="is-small"
          />
        </b-field>
      </div>
    </div>
    <div class="carets is-flex is-flex-shrink-1 is-flex-direction-column">
      <span class="caret pt-1" v-for="(val, i) in mappingValues" :key="i">
        <b-icon class="mx-2" icon="angle-right" pack="far" size="is-small" />
      </span>
    </div>
    <div class="sizes-is-flex is-flex-shrink-1 is-flex-direction-column">
      <span class="is-flex">
        <label class="label mr-1 is-flex-grow-1">
          {{ $t('flow.visualization.sizeConfig.size') }} ({{ miniUnits }})
        </label>
      </span>
      <div class="is-flex is-flex-direction-column">
        <b-field v-for="(val, i) in sizes" :key="i">
          <b-numberinput
            :value="val"
            @input="updateSize(i, $event)"
            :controls="false"
            :min-step="1e-15"
            step="1"
            size="is-small"
          />
        </b-field>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { ActionMenuItem } from '@movici-flow-common/types';

@Component({
  name: 'ByValueSizeList',
  components: {}
})
export default class ByValueSizeList extends Vue {
  @Prop({ type: Array, default: () => [] }) readonly value!: [number, number][];
  @Prop({ type: Number, default: 0 }) readonly minValue!: number;
  @Prop({ type: Number, default: 1 }) readonly maxValue!: number;
  @Prop({ type: String, default: 'pixels' }) readonly units!: string;
  @Prop({ type: Boolean, default: false }) readonly reversed!: boolean;
  @Prop({ type: String, default: null }) readonly dataType!: string | null;
  selectedIndex = -1;

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

  get orderedValue() {
    return this.reversed ? this.value.slice().reverse() : this.value;
  }

  get sizes() {
    return this.orderedValue.map(v => v[1]);
  }

  get mappingValues() {
    return this.orderedValue.map(v => v[0]);
  }

  get miniUnits() {
    switch (this.units) {
      case 'meters':
        return 'm';
      case 'pixels':
        return 'px';
      default:
        return '';
    }
  }

  updateSize(idx: number, newValue: number) {
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

  emitOriginalOrder(values: [number, number][]) {
    if (this.reversed) {
      values = values.slice().reverse();
    }
    this.$emit('input', values);
  }
}
</script>

<style lang="scss" scoped>
.carets {
  margin-top: 27px;
  .caret {
    height: 30px;
    margin-bottom: 0.75em;
    &:last-child {
      margin-bottom: 0;
    }
  }
}
</style>
