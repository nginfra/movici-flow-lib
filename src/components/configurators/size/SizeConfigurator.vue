<template>
  <div>
    <div class="columns mb-0 layer-kind">
      <div class="column is-two-thirds-desktop is-full-tablet">
        <b-radio class="mr-4" v-model="clauseType" native-value="static" size="is-small">
          {{ $t('flow.visualization.static') }}</b-radio
        >
        <b-radio v-model="clauseType" native-value="byValue" size="is-small">
          {{ $t('flow.visualization.byValue') }}
        </b-radio>
      </div>
    </div>
    <div v-if="clauseType">
      <!-- todo: add a radius / diameter in points option and account for it on the size module -->
      <SizeStaticConfigurator
        v-if="clauseType === 'static'"
        :value="currentClause"
        :validator="staticValidator"
        :geometry="geometry"
        @input="updateSettings($event)"
      />
      <template v-else-if="clauseType === 'byValue'">
        <div class="columns mb-0 is-multiline">
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
        <SizeByValueConfigurator
          :value="currentClause"
          :validator="byValueValidator"
          :entityProps="entityProps"
          :selectedEntityProp="selectedEntityProp"
          :summary="summary"
          :geometry="geometry"
          @input="updateSettings($event)"
        />
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import {
  ByValueSizeClause,
  SizeClause,
  StaticSizeClause,
  PropertySummary
} from '@movici-flow-common/types';
import { Component, Prop, Watch, Mixins } from 'vue-property-decorator';
import SizeStaticConfigurator from './SizeStaticConfigurator.vue';
import SizeByValueConfigurator from './SizeByValueConfigurator.vue';
import FormValidator from '@movici-flow-common/utils/FormValidator';
import AttributeSelector from '@movici-flow-common/components/widgets/AttributeSelector.vue';
import isEqual from 'lodash/isEqual';
import AttributeMixin from '../AttributeMixin';
import { attributeValidator } from '../helpers';

@Component({
  name: 'SizeConfigurator',
  components: {
    AttributeSelector,
    SizeStaticConfigurator,
    SizeByValueConfigurator
  }
})
export default class SizeConfigurator extends Mixins(AttributeMixin) {
  @Prop({ type: Object, default: () => new Object() }) readonly value!: SizeClause;
  @Prop({ type: Object, required: true }) declare readonly validator: FormValidator;
  allowedPropertyTypes = ['BOOLEAN', 'INT', 'DOUBLE'];
  currentClause: SizeClause = {};
  clauseType: 'static' | 'byValue' | null = null;

  get staticSettings(): Partial<StaticSizeClause> {
    return this.currentClause.static ?? {};
  }

  get byValueSettings(): Partial<ByValueSizeClause> {
    return this.currentClause.byValue ?? {};
  }

  get staticValidator() {
    return this.validator.child('static');
  }
  get byValueValidator() {
    return this.validator.child('byValue');
  }

  updateSettings(updatedClause: { static?: StaticSizeClause; byValue?: ByValueSizeClause }) {
    this.currentClause = Object.assign({}, this.currentClause, updatedClause);
    this.emitClause();
  }

  updateAttribute(val: PropertySummary | null) {
    if (val) {
      this.ensureProp(val);
    }
  }

  emitClause() {
    const toEmit: SizeClause = {};

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
    this.validator.touch('selectedEntityProp');
  }

  @Watch('value', { immediate: true })
  updateLocal(value: SizeClause) {
    if (value) {
      this.clauseType = value.byValue ? 'byValue' : 'static';
      this.currentClause = Object.assign({}, this.currentClause, value);
    } else {
      this.clauseType = 'static';
    }
  }

  beforeDestroy() {
    if (this.validator) {
      this.validator.reset();
    }
  }

  setupAttributeValidator() {
    this.validator?.configure({
      validators: {
        selectedEntityProp: attributeValidator(this, () => this.clauseType === 'byValue')
      },
      onValidate: e => {
        this.errors = e;
      }
    });
  }

  mounted() {
    this.setupAttributeValidator();
  }
}
</script>

<style lang="scss"></style>
