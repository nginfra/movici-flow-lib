<template>
  <b-tooltip :label="label" type="is-black">
    <b-button
      class="is-borderless"
      :size="size"
      :class="actionClass"
      :disabled="disabled"
      @click="$emit('click')"
    >
      <!--
        Even when the button is-small we want the icon to be is-medium. We can safely set the icon
        size to medium size as bulma automatically scales the icon up when the button becomes larger.
        The indicated 'is-medium' is therefor only a minimum size.
      -->
      <b-icon :icon="icon" size="is-medium" :type="type"></b-icon>
    </b-button>
  </b-tooltip>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import upperFirst from 'lodash/upperFirst';
import { MovActionType } from '@movici-flow-common/types';

@Component({ name: 'MovAction' })
export default class MovAction extends Vue {
  @Prop({ type: String, default: '' }) readonly action!: MovActionType;
  @Prop({ type: String, default: '' }) readonly size!: string;
  @Prop({ type: Boolean, default: false }) readonly disabled!: boolean;
  disabledType = 'is-inactive';

  get currentAction() {
    const action = this.options[this.action];
    if (!action) {
      console.error('Invalid action: ', this.action);
    }
    return action;
  }

  get icon() {
    return this.currentAction.icon;
  }

  get type() {
    return this.disabled ? this.disabledType : this.currentAction.type;
  }

  get label() {
    return upperFirst(this.action);
  }

  get actionClass() {
    return `action-${this.action}`;
  }

  get options(): Record<MovActionType, { icon: string; type: string }> {
    return {
      [MovActionType.ADD]: {
        icon: 'plus',
        type: 'is-primary'
      },
      [MovActionType.VIEW]: {
        icon: 'eye',
        type: 'is-primary'
      },
      [MovActionType.EDIT]: {
        icon: 'pen',
        type: 'is-info'
      },
      [MovActionType.DELETE]: {
        icon: 'trash',
        type: 'is-danger'
      },
      [MovActionType.DUPLICATE]: {
        icon: 'clone',
        type: 'is-primary'
      },
      [MovActionType.DOWNLOAD]: {
        icon: 'download',
        type: 'is-success'
      },
      [MovActionType.GENERATE]: {
        icon: 'play',
        type: 'is-primary'
      },
      [MovActionType.PLAY]: {
        icon: 'play',
        type: 'is-primary'
      },
      [MovActionType.RESET]: {
        icon: 'undo-alt',
        type: 'is-danger'
      },
      [MovActionType.CANCEL]: {
        icon: 'stop',
        type: 'is-danger'
      },
      [MovActionType.INVITE]: {
        icon: 'envelope',
        type: 'is-dark'
      },
      [MovActionType.LOGS]: {
        icon: 'file-alt',
        type: 'is-dark'
      }
    };
  }
}
</script>

<style scoped></style>
