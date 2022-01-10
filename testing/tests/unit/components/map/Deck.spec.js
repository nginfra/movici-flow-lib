jest.mock('@deck.gl/core');

import Deck from '@movici-flow-common/components/map/Deck';
import { Deck as DeckGL } from '@deck.gl/core';
import { createComponentWrapper } from '../../helpers';

describe('Deck.vue', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = createComponentWrapper(Deck);
  });
  it('renders correctly', () => {
    expect(wrapper.element).toMatchSnapshot();
  });
  it('creates a Deck.gl instance', () => {
    expect(wrapper.vm.deck).toBeInstanceOf(DeckGL);
  });
});
