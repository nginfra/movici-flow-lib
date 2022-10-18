import SizeByValueConfigurator from '@movici-flow-common/components/configurators/size/SizeByValueConfigurator.vue';
import { createComponentWrapper } from '../../../helpers';
import entityGroups from '../../data/dummy_entityGroups.json';
import byValue from '../../data/dummy_sizeByValueClause.json';
import { cloneDeep } from 'lodash';

const validator = {
  configure: jest.fn(),
  touch: jest.fn()
};

function updateMapping(mapping_, i, val) {
  const mapping = cloneDeep(mapping_);
  mapping[i][0] = val;
  return mapping;
}

function wrapperOptions(opts = {}) {
  const { value = undefined, geometry = 'points', selectedEntityProp = null } = opts;

  return {
    mountOptions: {
      propsData: {
        value, // if value is undefined, this is a new visualizer
        geometry,
        validator,
        selectedEntityProp
      }
    },
    mergeWithDefaults: true,
    doShallowMount: true // very important so jest mocks all children component
  };
}
describe('SizeByValueConfigurator.vue', () => {
  let wrapper, value, entityProps, booleanProps, doubleProps, intProps;

  beforeEach(() => {
    entityProps = entityGroups[0].properties;
    value = { byValue };
    booleanProps = entityProps[0];
    doubleProps = entityProps[1];
    intProps = entityProps[2];
  });

  it('new visualizer, select BOOLEAN attribute', () => {
    wrapper = createComponentWrapper(
      SizeByValueConfigurator,
      wrapperOptions({ selectedEntityProp: booleanProps })
    );

    expect(wrapper.vm.currentClause.sizes).toHaveLength(2);
  });

  it('new visualizer, select BOOLEAN attribute then select DOUBLE attribute', async () => {
    wrapper = createComponentWrapper(SizeByValueConfigurator, wrapperOptions());

    await wrapper.setProps({ selectedEntityProp: booleanProps });
    expect(wrapper.vm.currentClause.sizes).toStrictEqual([
      [0, 2],
      [1, 4]
    ]);

    await wrapper.setProps({ selectedEntityProp: doubleProps });
    expect(wrapper.vm.currentClause.sizes).toStrictEqual([
      [0, 2],
      [150000, 4]
    ]);
  });

  it('new visualizer, select DOUBLE attr, expects min and max', () => {
    wrapper = createComponentWrapper(
      SizeByValueConfigurator,
      wrapperOptions({ selectedEntityProp: doubleProps })
    );

    // simulates user updating attribute, we make sure min and max are correct
    expect(wrapper.vm.minValue).toBe(doubleProps.min_val);
    expect(wrapper.vm.maxValue).toBe(doubleProps.max_val);
  });

  it('new visualizer, select DOUBLE attr, then change nSteps', async () => {
    wrapper = createComponentWrapper(SizeByValueConfigurator, wrapperOptions());
    await wrapper.setProps({ selectedEntityProp: doubleProps });

    // simulates user updating attribute w/ a DOUBLE data type, then back to BOOLEAN
    expect(wrapper.vm.currentClause.sizes).toHaveLength(2);
    wrapper.vm.updateSteps(6);
    expect(wrapper.vm.currentClause.sizes).toHaveLength(6);
  });

  it('set visualizer', () => {
    // value is defined, so its a previously set visualizer
    wrapper = createComponentWrapper(
      SizeByValueConfigurator,
      wrapperOptions({ value, selectedEntityProp: value.byValue.attribute })
    );

    // this particular mockup has 3 colors, so we expect length to be 3
    expect(wrapper.vm.currentClause.sizes).toHaveLength(byValue.sizes.length);
  });

  it('set visualizer, then change attr to BOOLEAN', async () => {
    wrapper = createComponentWrapper(
      SizeByValueConfigurator,
      wrapperOptions({ value, selectedEntityProp: value.byValue.attribute })
    );

    expect(wrapper.vm.currentClause.sizes).toHaveLength(byValue.sizes.length);
    await wrapper.setProps({ selectedEntityProp: booleanProps });
    expect(wrapper.vm.currentClause.sizes).toHaveLength(2);
  });

  it('test changes in nSteps, max, min and its results in mappingValues', async () => {
    wrapper = createComponentWrapper(SizeByValueConfigurator, wrapperOptions());
    await wrapper.setProps({ selectedEntityProp: intProps });

    expect(wrapper.vm.mappingValues).toStrictEqual([0, 1000]);
    // when we change steps, we expect that changes in the mappingValues
    await wrapper.vm.updateSteps(5);
    expect(wrapper.vm.mappingValues).toStrictEqual([0, 250, 500, 750, 1000]);
  });

  it('test resetValues', async () => {
    // set an entityProp which min = 0 and max = 1000
    wrapper = createComponentWrapper(SizeByValueConfigurator, wrapperOptions());
    await wrapper.setProps({ selectedEntityProp: intProps });
    expect(wrapper.vm.mappingValues).toStrictEqual([0, 1000]);
    wrapper.vm.sizes = updateMapping(wrapper.vm.sizes, 0, 100); // changing currentMinValue
    // resetting
    wrapper.vm.resetValues();
    expect(wrapper.vm.mappingValues).toStrictEqual([0, 1000]);
  });

  it('ignores min/max from attribute summary in view config when loading min/max', async () => {
    // we expect that for any reason the min_val and max_val from an attribute might change
    // These should be ignored altogether, since data coming from the entityGroup is updated
    value.byValue.attribute.min_val = 100;
    value.byValue.attribute.max_val = 4000;

    wrapper = createComponentWrapper(
      SizeByValueConfigurator,
      wrapperOptions({ value, selectedEntityProp: value.byValue.attribute })
    );
    await wrapper.setProps({ selectedEntityProp: doubleProps });

    const vm = wrapper.vm,
      minMaxAttrFromValue = () => ({
        min: vm.value.byValue.attribute.min_val,
        max: vm.value.byValue.attribute.max_val
      }),
      minMaxAttrFromComponent = () => ({
        min: vm.selectedEntityProp.min_val,
        max: vm.selectedEntityProp.max_val
      }),
      minMaxSizeFromComponent = () => ({
        min: vm.sizes[0][0],
        max: vm.currentMaxValue
      });

    expect(minMaxAttrFromValue()).not.toStrictEqual(minMaxAttrFromComponent());

    wrapper.vm.resetValues();

    // new min and max do use data from value.byValye.attribute
    expect(minMaxAttrFromValue()).not.toStrictEqual(minMaxAttrFromComponent());
    expect(minMaxAttrFromValue()).not.toStrictEqual(minMaxSizeFromComponent());
    // they use data from selectedEntityProp and not
    expect(minMaxAttrFromComponent()).toStrictEqual(minMaxSizeFromComponent());
  });

  it('invalid boolean nSteps', async () => {
    // select a boolean entityProp
    wrapper = createComponentWrapper(SizeByValueConfigurator, wrapperOptions());
    await wrapper.setProps({ selectedEntityProp: booleanProps });

    expect(wrapper.vm.currentClause.sizes).toHaveLength(2);
    expect(() => wrapper.vm.updateSteps(3)).toThrow();
  });
});
