import layerMixin from '@movici-flow-common/components/webviz/mapLayers/LayerMixin';
import { createComponentWrapper } from '../../../helpers';

const LayerComponent = {
  mixins: [layerMixin],
  data() {
    return {
      id: 'some-id',
      sources: { 'some-source': 'source-data' },
      layer: { layerprop: 'some-value' }
    };
  }
};
describe('Deck.vue', () => {
  let mockMap;
  let wrapper;
  beforeEach(() => {
    mockMap = {
      painter: {
        context: {}
      },
      on: jest.fn(),
      off: jest.fn(),
      addSource: jest.fn(),
      removeSource: jest.fn(),
      addLayer: jest.fn(),
      removeLayer: jest.fn()
    };

    wrapper = createComponentWrapper(
      LayerComponent,
      {
        propsData: {
          map: mockMap
        }
      },
      { shallowMount: true }
    );
  });
  it('attaches itself on map idle', () => {
    expect(mockMap.on).toBeCalledWith('idle', wrapper.vm.attach);
  });
  it('deregisters idle callback on first call', () => {
    wrapper.vm.attach();
    expect(mockMap.off).toBeCalledWith('idle', wrapper.vm.attach);
  });
  it('adds source on attach', () => {
    wrapper.vm.attach();
    expect(mockMap.addSource).toBeCalledWith('some-source', 'source-data');
  });
  it('adds layer on attach', () => {
    wrapper.vm.attach();
    expect(mockMap.addLayer).toBeCalledWith({ id: wrapper.vm.id, layerprop: 'some-value' });
  });
  it('removes source on destroy', () => {
    wrapper.destroy();
    expect(mockMap.removeSource).toBeCalledWith('some-source');
  });
  it('removes layer on destroy', () => {
    wrapper.destroy();
    expect(mockMap.removeLayer).toBeCalledWith(wrapper.vm.id);
  });
});
