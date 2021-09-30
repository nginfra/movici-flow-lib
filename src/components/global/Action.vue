<template>
  <b-tooltip :label="label" type="is-black">
    <b-button
      class="is-borderless"
      :class="actionClass"
      :disabled="disabled"
      @click="$emit('click')"
    >
      <b-icon :icon="icon" :size="minIconSize" :type="type"></b-icon>
    </b-button>
  </b-tooltip>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import upperFirst from 'lodash/upperFirst';

@Component({ name: 'MovAction' })
export default class MovAction extends Vue {
  @Prop({ type: String, default: '' }) readonly action!: string;
  @Prop({ type: String, default: '' }) readonly size!: string;
  @Prop({ type: Boolean, default: false }) readonly disabled!: boolean;
  disabledType = 'is-inactive';
  // Even when the button is-small we want the icon to be is-medium. We can safely use this as
  // the de-facto icon size as bulma automatically scales the icon up when the button becomes larger
  minIconSize = 'is-medium';

  get currentAction() {
    const action = this.actions[this.action];
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
    return `action-${this.action} ${this.size}`;
  }

  get actions(): Record<string, { icon: string; type: string }> {
    return {
      add: {
        icon: 'plus',
        type: 'is-primary'
      },
      view: {
        icon: 'eye',
        type: 'is-primary'
      },
      edit: {
        icon: 'pen',
        type: 'is-info'
      },
      delete: {
        icon: 'trash',
        type: 'is-danger'
      },
      duplicate: {
        icon: 'clone',
        type: 'is-primary'
      },
      download: {
        icon: 'download',
        type: 'is-success'
      },
      generate: {
        icon: 'play',
        type: 'is-primary'
      },
      play: {
        icon: 'play',
        type: 'is-primary'
      },
      reset: {
        icon: 'undo-alt',
        type: 'is-danger'
      },
      cancel: {
        icon: 'stop',
        type: 'is-danger'
      },
      invite: {
        icon: 'envelope',
        type: 'is-dark'
      },
      logs: {
        icon: 'file-alt',
        type: 'is-dark'
      }
    };
  }
}
</script>

<style scoped></style>
