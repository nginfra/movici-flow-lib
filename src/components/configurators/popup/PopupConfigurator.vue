<template>
  <div>
    <div class="columns mb-0 layer-kind">
      <div class="column is-two-thirds-desktop is-full-tablet show-when is-flex">
        <b-field class="show-popup">
          <b-checkbox v-model="showPopup" size="is-small">
            {{ $t('flow.visualization.popup.showPopup') }}
          </b-checkbox>
        </b-field>
        <b-field
          class="when ml-6"
          v-if="showPopup"
          :type="{ 'is-danger': errors['popup-when'] }"
          :message="errors['popup-when']"
        >
          <b-radio
            v-for="(when, idx) in whenRadio"
            :key="when"
            :value="currentClause.when"
            @input="updateValue({ when })"
            :class="{ 'mr-4': idx !== whenRadio.length - 1 }"
            size="is-small"
            :native-value="when"
          >
            {{ $t('flow.visualization.popup.' + when) }}</b-radio
          >
        </b-field>
      </div>
    </div>
    <div class="columns mb-0" v-if="showPopup && currentClause.when === 'onClick'">
      <div class="column is-two-thirds">
        <label class="label"> {{ $t('flow.visualization.popup.position') }}</label>
        <b-radio
          v-for="(position, idx) in positionRadio"
          :key="position"
          :value="currentClause.position"
          @input="updateValue({ position })"
          :class="{ 'mr-4': idx !== position.length - 1 }"
          size="is-small"
          :native-value="position"
        >
          {{ $t('flow.visualization.popup.' + position) }}</b-radio
        >
      </div>
    </div>
    <div class="columns mb-0" v-if="showPopup">
      <div class="column is-two-thirds is-full-tablet popup-title">
        <b-field :label="$t('flow.visualization.popup.title')">
          <b-input
            :value="currentClause.title"
            @input="updateValue({ title: $event })"
            :placeholder="$t('flow.visualization.popup.titlePlaceholder')"
            size="is-small"
            :disabled="dynamicTitle"
          ></b-input>
        </b-field>
      </div>
    </div>
    <div class="columns mb-0 items" v-if="showPopup">
      <div class="column is-full">
        <label class="label">{{ $t('misc.properties') }}</label>
        <b-dropdown
          class="mr-4 mb-2"
          :value="items"
          @input="addItem($event)"
          :close-on-click="false"
          aria-role="list"
          scrollable
          max-height="200"
        >
          <template #trigger>
            <b-button
              class="is-size-7 is-transparent is-borderless has-text-primary has-text-weight-bold"
              icon-left="plus-circle"
              icon-pack="far"
              size="is-small"
            >
              {{ $t('flow.visualization.popup.addItem') }}
            </b-button>
          </template>
          <b-dropdown-item
            v-for="(item, index) in availableItems"
            :value="item.attribute"
            :key="index"
            :title="item.attribute.description"
            :focusable="false"
            aria-role="listitem"
            class="is-size-7"
          >
            {{ propertyString(item.attribute) }}
          </b-dropdown-item>
        </b-dropdown>
        <AttributeSuggestions
          :value="suggestions"
          :items="items"
          :entityProps="entityPropsFiltered"
          @addItem="addItem"
        />
        <p v-if="errors['popup-items']" class="error is-size-7 has-text-danger mt-2">
          {{ errors['popup-items'] }}
        </p>
        <Draggable
          :value="items"
          v-bind="draggableOptions"
          v-on="draggableEvents"
          class="draggable"
          :class="{ dashed: drag, 'mt-0': !items.length, 'mt-2': items.length }"
          @change="updateDraggable"
        >
          <div
            class="group-picker popup-property"
            v-for="(item, idx) in currentClause.items"
            :key="item.attribute.name"
          >
            <div class="header">
              <span class="grip mr-2">
                <span class="icon is-small fa-stack">
                  <i class="far fa-ellipsis-v"></i>
                  <i class="far fa-ellipsis-v"></i>
                </span>
              </span>
              <label class="label is-flex-grow-1 pl-1 pr-3">
                <span class="attribute text-ellipsis" :title="item.attribute.description">
                  {{ propertyString(item.attribute) }}
                </span>
              </label>
              <b-input
                :placeholder="propertyString(item.attribute)"
                v-model="item.name"
                :disabled="idx === 0 && dynamicTitle"
                size="is-small"
              ></b-input>
              <b-checkbox class="ml-2" v-if="idx === 0" size="is-small" v-model="dynamicTitle">
                {{ $t('flow.visualization.popup.setAsDynamicTitle') }}
              </b-checkbox>
              <b-button
                class="is-transparent is-borderless ml-2 has-text-danger"
                icon-left="minus-circle"
                icon-pack="far"
                size="is-small"
                @click="removeItem(idx)"
              >
              </b-button>
            </div>
          </div>
        </Draggable>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Watch, Mixins } from 'vue-property-decorator';
import {
  PropertySummary,
  PopupClause,
  PopupItem,
  FlowVisualizerOptions
} from '@movici-flow-common/types';
import { propertyString } from '@movici-flow-common/utils';
import Draggable from 'vuedraggable';
import DraggableMixin from '@movici-flow-common/mixins/DraggableMixin';
import ValidationProvider from '@movici-flow-common/mixins/ValidationProvider';
import FormValidator from '@movici-flow-common/utils/FormValidator';
import AttributeSuggestions from './AttributeSuggestions.vue';

@Component({
  name: 'PopupConfigurator',
  components: {
    Draggable,
    AttributeSuggestions
  }
})
export default class PopupConfigurator extends Mixins(ValidationProvider, DraggableMixin) {
  @Prop({ type: Object }) readonly value?: PopupClause;
  @Prop({ type: Array, default: () => [] }) readonly entityProps!: PropertySummary[];
  @Prop({ type: Object, required: true }) declare readonly validator: FormValidator;
  @Prop({ type: Object }) readonly settings?: FlowVisualizerOptions;
  group = 'popup-config';
  items: PopupItem[] = [];
  showPopup = false;
  dynamicTitle = false;
  whenRadio = ['onHover', 'onClick'];
  positionRadio = ['dynamic', 'static'];
  propertyString = propertyString;

  get defaults() {
    return {
      title: '',
      when: 'onHover',
      position: 'dynamic',
      items: [],
      show: false,
      dynamicTitle: false
    };
  }

  get currentClause(): PopupClause {
    return Object.assign({}, this.defaults, this.value);
  }
  /**
   * this filters out already set attribute and returns only the ones not selected
   */
  get entityPropsFiltered() {
    return this.entityProps.filter(
      entityProp => !this.currentClause.items.find(item => item.attribute.name === entityProp.name)
    );
  }

  get availableItems(): PopupItem[] {
    return this.entityPropsFiltered.map(p => {
      return {
        name: '',
        attribute: p
      };
    });
  }

  get suggestions() {
    // any new byValue clauses must be added here!
    return [
      this.settings?.color?.byValue?.attribute,
      this.settings?.size?.byValue?.attribute
    ].filter(attr => attr);
  }

  // saves a last version of the clause, then emit whole settings object with new clause
  @Watch('dynamicTitle')
  updateDynamicTitle(dynamicTitle: boolean) {
    this.updateValue(Object.assign(this.currentClause, { dynamicTitle }));
  }

  @Watch('showPopup')
  updateSettings(showPopup: boolean) {
    this.updateValue(Object.assign(this.currentClause, { show: showPopup }));
  }

  addItem(prop: PropertySummary) {
    this.items = this.items.concat({ name: '', attribute: prop });
    this.updateValue({ items: this.items });
    this.validator.touch('popup-items', this.name);
  }

  removeItem(idx: number) {
    this.items = this.items.filter((item, x) => idx !== x);
    this.updateValue({ items: this.items });
    this.validator.touch('popup-items', this.name);
  }

  updateDraggable(event: { moved: { oldIndex: number; newIndex: number } }) {
    const items = this.move(event.moved.oldIndex, event.moved.newIndex, this.items);
    this.updateValue({ items });
  }

  updateName(idx: number, name: string) {
    this.$set(this.items[idx], 'name', name || this.propertyString(this.items[idx].attribute));
    this.updateValue({ items: this.items });
  }

  updateValue(props: Partial<PopupClause>) {
    Object.keys(props).forEach(key => this.validator.touch('popup-' + key, this.name));
    const clause = Object.assign({}, this.currentClause, props);
    this.$emit('input', clause);
  }

  setupValidator() {
    this.validator.addModule({
      name: this.name,
      validators: {
        'popup-items': () => {
          if (!this.items.length && this.showPopup) {
            return 'Select at least 1 property';
          }
        },
        'popup-when': () => {
          if (!this.currentClause.when && this.showPopup) {
            return 'Choose one';
          }
        }
      },
      onValidate: e => (this.errors = e)
    });
  }

  mounted() {
    this.items = this.currentClause?.items ?? [];
    this.showPopup = this.currentClause ? this.currentClause.show ?? true : false;
    this.dynamicTitle = !!this.currentClause.dynamicTitle;
    this.setupValidator();
  }
}
</script>

<style scoped lang="scss">
$container-bg: $white-ter;
.popup-property {
  background-color: $container-bg;
  .header {
    background-color: $container-bg;
    .label {
      max-width: 200px;
      .attribute {
        color: $grey-dark;
        font-weight: 300;
        font-size: 0.75rem;
      }
    }
    .control {
      flex: 1;
    }
  }
}
</style>
