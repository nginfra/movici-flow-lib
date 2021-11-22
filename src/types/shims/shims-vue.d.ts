import 'vue';

declare module '*.vue' {
  import Vue from 'vue';
  export default Vue;
}

declare module 'vue/types/vue' {
  import { Route } from 'vue-router';
  interface Vue {
    $flow: {
      snackbar: typeof snackbar;
      settings: {
        homeRoute: Route;
      };
    };
  }
  interface VueConstructor {
    $flow: {
      snackbar: typeof snackbar;
      settings: {
        homeRoute: Route;
      };
    };
  }
}
