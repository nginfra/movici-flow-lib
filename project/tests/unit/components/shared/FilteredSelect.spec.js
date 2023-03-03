import FilteredSelect from '@movici-flow-common/components/global/FilteredSelect.vue';
import { createComponentWrapper } from '../../helpers';

const data = [
  { id: 1, label: 'a' },
  { id: 2, label: 'b' },
  { id: 3, label: 'c' }
];

function wrapperOptions(opts = {}) {
  const { value = undefined, options = [], filterVal, displayName, getTitle } = opts;

  return {
    mountOptions: {
      propsData: {
        value,
        options,
        filterVal,
        displayName,
        getTitle
      }
    },
    mergeWithDefaults: true,
    doShallowMount: true // very important so jest mocks all children component
  };
}
describe('ColorByValueConfigurator.vue', () => {
  let wrapper;

  it('empty select', () => {
    // in new visualizer
    wrapper = createComponentWrapper(FilteredSelect, wrapperOptions());

    expect(wrapper.findAll('o-select').length).toBe(1);
    expect(wrapper.findAll('option').length).toBe(0);
  });

  it('new select without filters', () => {
    // in new visualizer
    wrapper = createComponentWrapper(
      FilteredSelect,
      wrapperOptions({ value: data[0], options: data })
    );

    expect(wrapper.findAll('o-select').length).toBe(1);
    expect(wrapper.findAll('option').length).toBe(3);
  });

  it('new select with filters', () => {
    // in new visualizer
    wrapper = createComponentWrapper(
      FilteredSelect,
      wrapperOptions({ value: data[0], options: data, filterVal: a => a.id > 1 })
    );

    expect(wrapper.findAll('option').length).toBe(3);
    expect(wrapper.findAll('option[disabled]').length).toBe(1);
    expect(wrapper.findAll('option:not([disabled])').length).toBe(2);
  });

  it('new select with displayName', () => {
    // in new visualizer
    wrapper = createComponentWrapper(
      FilteredSelect,
      wrapperOptions({ value: data[0], options: data, displayName: a => a.label })
    );

    expect(wrapper.findAll('option').at(0).element.innerHTML.trim()).toBe('a');
    expect(wrapper.findAll('option').at(1).element.innerHTML.trim()).toBe('b');
    expect(wrapper.findAll('option').at(2).element.innerHTML.trim()).toBe('c');

    expect(wrapper.findAll('option').at(0).element.title.trim()).toBe('a');
    expect(wrapper.findAll('option').at(1).element.title.trim()).toBe('b');
    expect(wrapper.findAll('option').at(2).element.title.trim()).toBe('c');
  });

  it('new select with getTitle', () => {
    // in new visualizer
    wrapper = createComponentWrapper(
      FilteredSelect,
      wrapperOptions({ value: data[0], options: data, getTitle: a => 'title-' + a.label })
    );

    expect(wrapper.findAll('option').at(0).element.title.trim()).toBe('title-a');
    expect(wrapper.findAll('option').at(1).element.title.trim()).toBe('title-b');
    expect(wrapper.findAll('option').at(2).element.title.trim()).toBe('title-c');
  });
});
