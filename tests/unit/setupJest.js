jest.mock('mapbox-gl/dist/mapbox-gl', () => ({
  Map: jest.fn(() => ({
    on: jest.fn(),
    addControl: jest.fn(),
    jumpTo: jest.fn()
  })),
  NavigationControl: jest.fn(() => {})
}));

jest.mock('@movici-flow-common/locales', () => {
  let obj = jest.fn();
  obj.keys = () => {
    return [];
  };
  return obj;
});
