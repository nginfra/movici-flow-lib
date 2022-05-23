import ColorByValueConfigurator from '@movici-flow-common/components/configurators/color/ColorByValueConfigurator.vue';
import { createComponentWrapper } from '../../../helpers';
import entityGroups from '../../data/dummy_entityGroups.json';
import byValue from '../../data/dummy_byValueClause.json';
import { cloneDeep } from 'lodash';

const validator = {
  addModule: jest.fn(),
  touch: jest.fn()
};

function updateMapping(mapping_, i, val) {
  const mapping = cloneDeep(mapping_);
  mapping[i][0] = val;
  return mapping;
}

function wrapperOptions(opts = {}) {
  const { value = undefined, entityProps = [], geometry = 'points' } = opts;

  return {
    mountOptions: {
      propsData: {
        name: 'Colour',
        value, // if value is undefined, this is a new visualizer
        entityProps,
        geometry,
        validator
      }
    },
    mergeWithDefaults: true,
    doShallowMount: true // very important so jest mocks all children component
  };
}
describe('ColorByValueConfigurator.vue', () => {
  let wrapper, entityProps, value, booleanProps, doubleProps, intProps;

  beforeEach(() => {
    entityProps = entityGroups[0].properties;
    value = { byValue };
    booleanProps = entityProps[0];
    doubleProps = entityProps[1];
    intProps = entityProps[2];
  });

  it('new visualizer', () => {
    // in new visualizer
    wrapper = createComponentWrapper(ColorByValueConfigurator, wrapperOptions());

    expect(wrapper.vm.selectedEntityProp).toBe(null);
    expect(wrapper.vm.currentClause).toBe(null);
  });

  it('new visualizer, select BOOLEAN attr', () => {
    // value is undefined, so this is a new visualizer
    wrapper = createComponentWrapper(ColorByValueConfigurator, wrapperOptions({ entityProps }));

    // simulates user updating attribute w/ a BOOLEAN data type
    wrapper.vm.updateAttribute(booleanProps);
    expect(wrapper.vm.currentClause.colors).toHaveLength(2);
  });

  it('new visualizer, select DOUBLE attr, then BOOLEAN attribute', () => {
    wrapper = createComponentWrapper(ColorByValueConfigurator, wrapperOptions({ entityProps }));

    // simulates user updating attribute w/ a DOUBLE data type, then to BOOLEAN type
    wrapper.vm.updateAttribute(doubleProps);
    expect(wrapper.vm.currentClause.colors).toHaveLength(4);
    wrapper.vm.updateAttribute(booleanProps);
    expect(wrapper.vm.currentClause.colors).toHaveLength(2);
  });

  it('new visualizer, select DOUBLE attr, expects min and max', () => {
    wrapper = createComponentWrapper(ColorByValueConfigurator, wrapperOptions({ entityProps }));

    // default min max values
    expect(wrapper.vm.minValue).toBe(0);
    expect(wrapper.vm.maxValue).toBe(1);

    // simulates user updating attribute, we make sure min and max are correct
    wrapper.vm.updateAttribute(doubleProps);
    expect(wrapper.vm.minValue).toBe(doubleProps.min_val);
    expect(wrapper.vm.maxValue).toBe(doubleProps.max_val);
  });

  it('new visualizer, select DOUBLE attr, then change nSteps', () => {
    wrapper = createComponentWrapper(ColorByValueConfigurator, wrapperOptions({ entityProps }));

    // simulates user updating attribute w/ a DOUBLE data type, then back to BOOLEAN
    wrapper.vm.updateAttribute(doubleProps);
    expect(wrapper.vm.currentClause.colors).toHaveLength(4);
    wrapper.vm.updateSteps(6);
    expect(wrapper.vm.currentClause.colors).toHaveLength(6);
  });

  it('set visualizer', () => {
    // value is defined, so its a previously set visualizer
    wrapper = createComponentWrapper(
      ColorByValueConfigurator,
      wrapperOptions({ value, entityProps })
    );

    // this particular mockup has 6 colors, so we expect length to be 6
    expect(wrapper.vm.currentClause.colors).toHaveLength(6);
  });

  it('set visualizer, then change attr to BOOLEAN', () => {
    wrapper = createComponentWrapper(
      ColorByValueConfigurator,
      wrapperOptions({ value, entityProps })
    );

    // this particular mockup has 6 colors, so we expect length to be 6
    expect(wrapper.vm.currentClause.colors).toHaveLength(6);
    wrapper.vm.updateAttribute(booleanProps);
    expect(wrapper.vm.currentClause.colors).toHaveLength(2);
  });

  it('test changes in nSteps, max, min and its results in mappingValues', () => {
    wrapper = createComponentWrapper(ColorByValueConfigurator, wrapperOptions({ entityProps }));

    // set an entityProp which min = 0 and max = 1000
    wrapper.vm.updateAttribute(intProps);
    expect(wrapper.vm.mappingValues).toStrictEqual([0, 250, 500, 750]);
    expect(wrapper.vm.currentMaxValue).toBe(1000);
    // when we change steps, we expect that changes in the mappingValues
    wrapper.vm.updateSteps(5);
    expect(wrapper.vm.mappingValues).toStrictEqual([0, 200, 400, 600, 800]);

    // change min max
    wrapper.vm.colorMapping = updateMapping(wrapper.vm.colorMapping, 0, 100); // changing currentMinValue
    wrapper.vm.currentMaxValue = 1300; // changing currentMaxValue

    // change steps
    wrapper.vm.updateSteps(3);

    // mapping has 3 values, which still respect min max
    // they are also evenly split betwen min max
    expect(wrapper.vm.mappingValues).toStrictEqual([100, 500, 900]);
    expect(wrapper.vm.currentMaxValue).toBe(1300); // max is kept the same
  });

  it('test resetValues', () => {
    wrapper = createComponentWrapper(ColorByValueConfigurator, wrapperOptions({ entityProps }));

    // set an entityProp which min = 0 and max = 1000
    wrapper.vm.updateAttribute(intProps);
    expect(wrapper.vm.mappingValues).toStrictEqual([0, 250, 500, 750]);
    expect(wrapper.vm.currentMaxValue).toBe(1000);

    wrapper.vm.colorMapping = updateMapping(wrapper.vm.colorMapping, 0, 100); // changing currentMinValue
    wrapper.vm.currentMaxValue = 1100; // changing currentMaxValue

    // resetting
    wrapper.vm.resetValues();
    expect(wrapper.vm.mappingValues).toStrictEqual([0, 250, 500, 750]);
    expect(wrapper.vm.currentMaxValue).toBe(1000);
  });

  it('ignores min/max from attribute summary in view config when loading min/max', () => {
    // we expect that for any reason the min_val and max_val from an attribute might change
    // These should be ignored altogether, since data coming from the entityGroup is updated
    value.byValue.attribute.min_val = 100;
    value.byValue.attribute.max_val = 4000;

    wrapper = createComponentWrapper(
      ColorByValueConfigurator,
      wrapperOptions({ value, entityProps })
    );

    const vm = wrapper.vm,
      minMaxAttrFromValue = () => ({
        min: vm.value.byValue.attribute.min_val,
        max: vm.value.byValue.attribute.max_val
      }),
      minMaxAttrFromComponent = () => ({
        min: vm.selectedEntityProp.min_val,
        max: vm.selectedEntityProp.max_val
      }),
      minMaxColorFromComponent = () => ({
        min: vm.colorMapping[0][0],
        max: vm.currentMaxValue
      });

    expect(minMaxAttrFromValue()).not.toStrictEqual(minMaxAttrFromComponent());

    wrapper.vm.resetValues();

    // new min and max do use data from value.byValye.attribute
    expect(minMaxAttrFromValue()).not.toStrictEqual(minMaxAttrFromComponent());
    expect(minMaxAttrFromValue()).not.toStrictEqual(minMaxColorFromComponent());
    // they use data from selectedEntityProp and not
    expect(minMaxAttrFromComponent()).toStrictEqual(minMaxColorFromComponent());
  });

  it('test differences between current and entity min max', () => {
    wrapper = createComponentWrapper(ColorByValueConfigurator, wrapperOptions({ entityProps }));

    // set an entityProp
    wrapper.vm.updateAttribute(doubleProps);
    // current and entity min and max value should be the same
    expect(wrapper.vm.currentMinValue).toBe(wrapper.vm.minValue);
    expect(wrapper.vm.currentMaxValue).toBe(wrapper.vm.maxValue);

    wrapper.vm.colorMapping = updateMapping(wrapper.vm.colorMapping, 0, 1); // changing currentMinValue
    wrapper.vm.currentMaxValue++; // changing currentMaxValue

    expect(wrapper.vm.currentMinValue).not.toBe(wrapper.vm.minValue);
    expect(wrapper.vm.currentMaxValue).not.toBe(wrapper.vm.maxValue);
  });

  it('invalid entityProp', () => {
    wrapper = createComponentWrapper(ColorByValueConfigurator, wrapperOptions({ entityProps }));

    const dummyEntityProp = {
      name: 'dummy',
      component: '',
      data_type: 'BOOLEAN',
      description: '',
      unit: '',
      min_val: 0,
      max_val: 1
    };
    // set an entityProp
    expect(() => wrapper.vm.updateAttribute(dummyEntityProp)).toThrow();
  });

  it('invalid boolean nSteps', () => {
    wrapper = createComponentWrapper(ColorByValueConfigurator, wrapperOptions({ entityProps }));
    // select a boolean entityProp
    wrapper.vm.updateAttribute(booleanProps);
    expect(wrapper.vm.currentClause.colors).toHaveLength(2);
    expect(() => wrapper.vm.updateSteps(3)).toThrow();
  });
});
