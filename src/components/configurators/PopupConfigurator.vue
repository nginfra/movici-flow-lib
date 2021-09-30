<template>
  <div>
    <div class="columns mb-0 layer-kind">
      <div class="column is-two-thirds-desktop is-full-tablet show-when is-flex">
        <b-checkbox v-model="showPopup" size="is-small">
          {{ $t('flow.visualization.popup.showPopup') }}
        </b-checkbox>
        <b-field
          class="when ml-6"
          v-if="showPopup"
          :type="{ 'is-danger': errors['popup-when'] }"
          :message="errors['popup-when']"
        >
          <b-radio
            :value="currentClause.when"
            @input="updateValue({ when: $event })"
            class="mr-4"
            size="is-small"
            native-value="onHover"
          >
            {{ $t('flow.visualization.popup.onHover') }}</b-radio
          >
          <b-radio
            :value="currentClause.when"
            @input="updateValue({ when: $event })"
            size="is-small"
            native-value="onClick"
          >
            {{ $t('flow.visualization.popup.onClick') }}
          </b-radio>
        </b-field>
      </div>
    </div>
    <div class="columns mb-0" v-if="showPopup && currentClause.when === 'onClick'">
      <div class="column is-two-thirds">
        <label class="label"> {{ $t('flow.visualization.popup.position') }}</label>
        <b-radio
          :value="currentClause.position"
          @input="updateValue({ position: $event })"
          class="mr-4"
          size="is-small"
          native-value="dynamic"
        >
          {{ $t('flow.visualization.popup.dynamic') }}</b-radio
        >
        <b-radio
          :value="currentClause.position"
          @input="updateValue({ position: $event })"
          size="is-small"
          native-value="static"
        >
          {{ $t('flow.visualization.popup.static') }}
        </b-radio>
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
          ></b-input>
        </b-field>
      </div>
    </div>
    <div class="columns mb-0 items" v-if="showPopup">
      <div class="column is-full">
        <label class="label">{{ $t('misc.properties') }}</label>
        <span v-if="errors['popup-items']" class="error is-block is-size-7 has-text-danger">
          {{ errors['popup-items'] }}
        </span>
        <b-dropdown
          aria-role="list"
          :value="items"
          @input="addItem($event)"
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
            :focusable="false"
            aria-role="listitem"
            class="is-size-7"
          >
            {{ propertyString(item.attribute) }}
          </b-dropdown-item>
        </b-dropdown>

        <Draggable
          :list="items"
          @input="updateValue({ items: $event })"
          v-bind="draggableOptions"
          class="draggable"
          :class="{ dashed: drag }"
          @start="drag = true"
          @end="drag = false"
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
                <span class="attribute text-ellipsis" :title="propertyString(item.attribute)">
                  {{ propertyString(item.attribute) }}
                </span>
              </label>
              <b-input
                :placeholder="propertyString(item.attribute)"
                v-model="item.name"
                size="is-small"
              ></b-input>
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
import { PropertyType, PopupClause, PopupItem } from '@/flow/src/types';
import { propertyString } from '@/flow/src/utils';
import Draggable from 'vuedraggable';
import ValidationProvider from '@/flow/src/mixins/ValidationProvider';
import FormValidator from '@/flow/src/utils/FormValidator';

@Component({
  components: {
    Draggable
  }
})
export default class PopupConfigurator extends Mixins(ValidationProvider) {
  @Prop({ default: () => {} }) value!: PopupClause;
  @Prop({ default: () => [] }) entityProps!: PropertyType[];
  @Prop()
  declare validator: FormValidator;
  items: PopupItem[] = [];
  showPopup = false;
  drag = false; // start your engines...
  propertyString = propertyString;

  get defaults() {
    return {
      title: '',
      when: 'onHover',
      position: 'dynamic',
      items: [],
      show: false
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

  get draggableOptions() {
    return {
      animation: 500,
      group: 'popup-config',
      disabled: false,
      ghostClass: 'ghost',
      handle: '.grip'
    };
  }

  // saves a last version of the clause, then emit whole settings object with new clause
  @Watch('showPopup')
  updateSettings(showPopup: boolean) {
    this.updateValue(Object.assign(this.currentClause, { show: showPopup }));
  }

  addItem(prop: PropertyType) {
    this.items.push({ name: '', attribute: prop });
    this.updateValue({ items: this.items });
    this.validator.touch('popup-items');
  }

  removeItem(idx: number) {
    this.items.splice(idx, 1);
    this.updateValue({ items: this.items });
    this.validator.touch('popup-items');
  }

  updateName(idx: number, name: string) {
    this.$set(this.items[idx], 'name', name || this.propertyString(this.items[idx].attribute));
    this.updateValue({ items: this.items });
  }

  updateValue(props: Partial<PopupClause>) {
    Object.keys(props).forEach(key => this.validator.touch('popup-' + key));
    const clause = Object.assign({}, this.currentClause, props);
    this.$emit('input', clause);
  }

  setupValidator() {
    this.validator.addModule({
      name: 'popup',
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
.flip-list-move {
  transition: transform 0.5s;
}
.no-move {
  transition: transform 0s;
}
.ghost {
  opacity: 0.5;
  background: $grey;
}

.list-group {
  min-height: 20px;
}
</style>
