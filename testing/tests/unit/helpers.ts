import Vue, { VueConstructor } from 'vue';
import { createLocalVue, RouterLinkStub, mount, shallowMount } from '@vue/test-utils';
import merge from 'lodash/merge';
import Buefy from 'buefy';
import Vuex, { StoreOptions } from 'vuex';
import { VueClass } from 'vue-class-component/lib/declarations';
import VueI18n from 'vue-i18n';
import defaultStore from '@movici-flow-common/store';

type wrapperOpts = {
  overrides?: Record<string, unknown>;
  doShallowMount?: boolean;
  storeOpts?: StoreOptions<unknown>;
};

export function createComponentWrapper(
  component: VueClass<unknown>,
  { overrides, doShallowMount, storeOpts }: wrapperOpts = {}
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
        $router: {
          push: jest.fn()
        },
        $flow: {
          successMessage: jest.fn(),
          failMessage: jest.fn()
        }
      },
      store: storeOpts ? new Vuex.Store(storeOpts) : defaultStore
    };

  const mountFunc = doShallowMount ? shallowMount : mount;
  return mountFunc(component, merge(defaultMountingOptions, overrides));
}

export function getLocalVue(): VueConstructor<Vue> {
  const localVue = createLocalVue();

  localVue.use(Vuex);
  localVue.use(VueI18n);
  localVue.use(Buefy, { defaultIconPack: 'fas' });

  return localVue;
}
