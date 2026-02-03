import defaultStore from "@movici-flow-lib/stores-old";
import { createLocalVue, mount, shallowMount } from "@vue/test-utils";
import merge from "lodash/merge";
import { VueConstructor } from "vue";
import { VueClass } from "vue-class-component/lib/declarations";
import VueI18n from "vue-i18n";
import VueRouter from "vue-router";
import Vuex, { StoreOptions } from "vuex";

type wrapperOpts = {
  mountOptions?: Record<string, unknown>;
  mergeWithDefaults?: boolean;
  doShallowMount?: boolean;
  storeOpts?: StoreOptions<unknown>;
};

export function createComponentWrapper(
  component_: VueClass<unknown>,
  { mountOptions, mergeWithDefaults, doShallowMount, storeOpts }: wrapperOpts = {},
) {
  const localVue = getLocalVue({ mountOptions }),
    defaultMountingOptions = {
      localVue,
      i18n: new VueI18n({ locale: "en" }),
      stubs: ["router-view", "router-link"],
      mocks: {
        $flow: {
          successMessage: jest.fn(),
          failMessage: jest.fn(),
        },
      },
      store: storeOpts ? new Vuex.Store(storeOpts) : defaultStore,
    };

  let options: Record<string, unknown> = defaultMountingOptions;

  if (mountOptions) {
    if (!mergeWithDefaults) {
      options = mountOptions;
    } else {
      options = merge({}, defaultMountingOptions, mountOptions);
      if (Array.isArray(mountOptions.stubs)) {
        options.stubs = [...defaultMountingOptions.stubs, ...mountOptions.stubs] as Array<string>;
      }
    }
  }

  const doMount = (
    m: typeof mount | typeof shallowMount,
    component: VueClass<unknown>,
    opts: Record<string, unknown>,
  ) => {
    return m(component, opts);
  };

  return doMount(doShallowMount ? shallowMount : mount, component_, options);
}

export function getLocalVue(opts: { mountOptions?: Record<string, unknown> }): VueConstructor<Vue> {
  const localVue = createLocalVue();

  if (opts.mountOptions) {
    localVue.use(VueRouter);
  }

  localVue.use(Vuex);
  localVue.use(VueI18n);

  return localVue;
}
