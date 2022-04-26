module.exports = {
  Map: jest.fn(() => ({
    on: jest.fn(),
    addControl: jest.fn(),
    jumpTo: jest.fn()
  })),
  NavigationControl: jest.fn(() => {})
};
