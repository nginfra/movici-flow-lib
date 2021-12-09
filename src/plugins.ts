import Vue_ from 'vue';

export const registerComponent = (Vue: typeof Vue_, component: typeof Vue, name: string) => {
  Vue.component(name, component);
};

export const registerInNamespace = (Vue: typeof Vue_, property: string, obj: unknown) => {
  if (!Vue.prototype.$flow) Vue.prototype.$flow = {};
  Vue.prototype.$flow[property] = obj;
};
