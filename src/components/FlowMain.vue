<template>
  <section class="flow columns is-gapless is-margin-less">
    <b-menu class="column flow-menu" :activable="false">
      <b-menu-list aria-role="menu">
        <b-menu-item class="home" tag="router-link" :to="homeRoute">
          <template #label>
            <b-image
              src="/static/movici-logo.svg"
              :title="$t('flow.leftMenu.returnToDashboard')"
            ></b-image>
          </template>
        </b-menu-item>
        <b-menu-item
          v-for="section in sectionMenu"
          aria-role="menuitem"
          :key="section.name"
          :label="$t(section.label)"
          :icon-pack="section.iconPack"
          :icon="section.icon"
          :disabled="!section.enabled"
          :active="isActive(section.to)"
          @click="click(section)"
          size="is-medium"
          tag="a"
        ></b-menu-item>
        <b-menu-item v-if="userInitials" class="bottom">
          <template #label>
            <span class="is-small icon user-initials">
              {{ userInitials }}
            </span>
            <span class="pt-1">{{ flowVersion }}</span>
          </template>
        </b-menu-item>
      </b-menu-list>
    </b-menu>
    <b-tooltip
      class="collapse-button"
      type="is-black"
      position="is-right"
      :label="(collapse ? $t('flow.leftMenu.expand') : $t('flow.leftMenu.collapse')) + ' menu'"
    >
      <b-button
        size="is-small"
        v-if="!disableCollapser"
        :icon-left="collapse ? 'angle-right' : 'angle-left'"
        @click="toggleCollapse()"
      ></b-button>
    </b-tooltip>
    <main class="column">
      <router-view></router-view>
    </main>
  </section>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { FlowSection, FlowSectionItem, User } from '../types';
import FlowExport from './FlowExport.vue';
import { flowStore, flowUIStore } from '../store/store-accessor'; // create getters for other store it interacts with?
import { buildFlowUrl } from '@movici-flow-common/utils';
import VERSION from '@movici-flow-common/version';

@Component({ name: 'FlowMain' })
export default class FlowMain extends Vue {
  get sectionMenu() {
    return flowUIStore.flowSections ?? [];
  }

  get collapse() {
    return flowUIStore.collapse;
  }

  get disableCollapser() {
    return flowUIStore.disableCollapser;
  }

  get hasProjectsCapabilities() {
    return flowStore.hasProjectsCapabilities;
  }

  get currentUser(): User | null {
    return flowStore.currentUser;
  }

  get userInitials(): string | null {
    return this.currentUser
      ? this.currentUser.firstname.slice(0, 1) + this.currentUser.lastname.slice(0, 1)
      : null;
  }

  get homeRoute() {
    return this.$flow.settings?.homeRoute ?? '';
  }

  get flowVersion() {
    return VERSION;
  }

  click(section: FlowSection) {
    if (section.type === 'callback') {
      section.callback();
    } else if (this.$route.path !== section.to) {
      this.toggleCollapse(false);

      this.$router.push(
        buildFlowUrl(section.to, {
          project: flowStore.project?.name,
          scenario: flowStore.scenario?.name
        })
      );
    } else {
      this.toggleCollapse(!this.collapse);
    }
  }

  isActive(name: string) {
    return this.$route.name?.includes(name);
  }

  toggleCollapse(value?: boolean) {
    flowUIStore.toggleCollapse(value);
  }

  createFlowSections() {
    const sections: FlowSection[] = [],
      defaultSections: FlowSection[] = [
        {
          name: FlowSectionItem.DATASETS,
          label: 'flow.datasets.label',
          icon: 'fa-dataset',
          iconPack: 'fak',
          enabled: !this.hasProjectsCapabilities,
          to: 'FlowDataset',
          type: 'route'
        },
        {
          name: FlowSectionItem.SCENARIO,
          label: 'flow.scenarios.label',
          icon: 'fa-scenario',
          iconPack: 'fak',
          enabled: !this.hasProjectsCapabilities,
          to: 'FlowScenario',
          type: 'route'
        },
        {
          name: FlowSectionItem.VISUALIZATION,
          label: 'flow.visualization.label',
          icon: 'map',
          iconPack: 'far',
          enabled: false,
          to: 'FlowVisualization',
          type: 'route'
        },
        {
          name: FlowSectionItem.EXPORT,
          label: 'flow.export.label',
          iconPack: 'fal',
          icon: 'file-download',
          enabled: false,
          type: 'callback',
          callback: () => {
            this.$buefy.modal.open({
              parent: this,
              width: 720,
              component: FlowExport,
              canCancel: ['x', 'escape'],
              customClass: 'overflow-visible',
              hasModalCard: false
            });
          }
        }
      ];

    if (this.hasProjectsCapabilities) {
      sections.push({
        name: FlowSectionItem.PROJECT,
        label: 'flow.projects.label',
        icon: 'fa-workspace',
        iconPack: 'fak',
        enabled: true,
        to: 'FlowProject',
        type: 'route'
      });
    }

    sections.push(...defaultSections);

    flowUIStore.setSections(sections);
  }

  async mounted() {
    this.createFlowSections();
  }

  created() {}
}
</script>

<style scoped lang="scss">
.flow {
  height: 100vh;
  margin: 0 !important;
  color: $black;
  .collapse-button {
    position: absolute;
    left: 22.5px;
    bottom: 85px;
    z-index: 10;
  }
  // left-hand-side menu
  ::v-deep {
    .flow-menu {
      max-width: $menu-item-size;
      z-index: 3;
      .menu-list {
        height: 100vh;
        background-color: $white-ter;
        li {
          height: $menu-item-height;
          width: $menu-item-size;
          border-radius: 0;
          &.home {
            a {
              background-color: $white-ter !important;
            }
          }
          &.bottom {
            position: absolute;
            bottom: 0;
            height: $menu-item-height;
            a {
              height: $menu-bottom-item-size;
              .icon {
                margin: 0;
              }
            }
          }
          a {
            height: $menu-item-height;
            padding: 0.625rem;
            border-radius: 0;
            background-color: $white-ter;
            text-align: center;
            transition: background-color 0.2s;
            .image {
              margin: 12px auto;
              width: 36px;
              height: 36px;
            }
            span {
              &:not(.icon) {
                font-size: 0.625rem;
                color: $black-bis !important;
                display: flex;
                flex-direction: column;
                align-items: center !important;
                justify-content: center !important;
              }
              &.icon {
                width: 40px;
                height: 40px;
                border-radius: 100%;
                color: $green;
                background-color: $white;
                margin: 0;
                transition: background-color 0.2s;
                svg,
                i {
                  width: 1.1em !important;
                  font-size: 20px;
                }
              }
            }
            &:hover {
              @include hover-grey-bgcolor;
            }
            &.is-active {
              background-color: $white;
              span.icon {
                background-color: $green;
                color: $white;
              }
            }
            &.is-disabled {
              opacity: 1;
              span {
                &:not(.icon) {
                  color: $grey-lighter !important;
                }
                &.icon {
                  background-color: $grey-lighter !important;
                  color: $white !important;
                }
              }
            }
          }
        }
      }
    }
    main {
      background-color: $white;
      .flow-datasets {
        #mapbox-container {
          height: initial;
        }
      }
      .flow-datasets,
      .flow-scenarios {
        .main-view {
          padding: 1rem 2rem;
        }
      }
    }
  }
}
</style>
