export default {
  iconPack: "fas",
  // Oruga 0.13 renamed the tabs class-prop keys (itemHeaderClass -> tabClass, …).
  // These map the original custom classes that main.scss/style.scss target.
  tabs: {
    tabClass: "tab-item-header",
    tabActiveClass: "is-active",
    tabDisabledClass: "is-disabled",
    tabLabelClass: "tab-item-header-text",
    tabIconClass: "tab-item-header-icon",
    tabPanelClass: "tab-item",
    contentClass: "tab-content",
  },
  menu: {
    itemActiveClass: "is-active",
    itemDisabledClass: "is-disabled",
  },
  dropdown: {
    menuActiveClass: "is-active",
  },
};
