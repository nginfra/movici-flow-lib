import { createLocalVue, RouterLinkStub, mount, shallowMount } from '@vue/test-utils';
import merge from 'lodash/merge';
import VueI18n from 'vue-i18n';
import Buefy from 'buefy';
import Vuex, { StoreOptions } from 'vuex';
import Globals from '@movici-flow-common/components/global';
import Filters from '@movici-flow-common/filters';
import { VueClass } from 'vue-class-component/lib/declarations';

export function createStore(overrides: StoreOptions<unknown>) {
  const defaultStoreConfig = {};
  return new Vuex.Store(merge(defaultStoreConfig, overrides));
}

export function createComponentWrapper(
  component: VueClass<unknown>,
  overrides: any = {},
  opts: { shallowMount?: boolean } = {}
) {
  const localVue = getLocalVue(),
    defaultMountingOptions = {
      localVue,
      i18n: new VueI18n({ locale: 'en' }),
      stubs: {
        RouterLink: RouterLinkStub
      },
      mocks: {
        $t: (val: string) => val,
        $router: { push: jest.fn() }
      }
    };

  const mountFunc = opts.shallowMount ? shallowMount : mount;
  return mountFunc(component, merge(defaultMountingOptions, overrides));
}

export function getLocalVue() {
  const localVue = createLocalVue();

  localVue.use(Vuex);
  localVue.use(Globals);
  localVue.use(Buefy, { defaultIconPack: 'fas' });
  localVue.use(Filters);

  return localVue;
}
