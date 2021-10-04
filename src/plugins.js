export const registerComponent = (Vue, component) => {
  Vue.component(component.name, component);
};

export const registerComponentProgrammatic = (Vue, property, component) => {
  if (!Vue.prototype.$flow) Vue.prototype.$flow = {};
  Vue.prototype.$flow[property] = component;
};
