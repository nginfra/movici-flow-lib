# Movici Flow Lib


## Install this library
Movici Flow is currently not an NPM package. To use this library you must do the following

- add this project to your own project, preferably as a git submodule
- copy the assets from `src/assets` into your own `src/assets/`
- copy the contents from `public` into your own `public/`
- copy the dependencies and devDependencies from `project/package.json` into your own `package.json`

your final project layout should look something like this

```
├── movici-flow-lib
├── src
│   ├── assets
│   │   ├── images
│   │   ├── sass
│   ├── ... your own project stuff
├── public
│   ├── static
│   ├── ... your own public stuff
├── package.json

```

you can then update your `tsconfig.json`
```
{
  "include": [
    ...
    "movici-flow-lib/src/**/*",
    "movici-flow-lib/src/**/*.json",
    "movici-flow-lib/src/**/*.vue"
  ],
  "compilerOptions": {
    ....
    "paths": {
      ...
      "@movici-flow-lib/*": ["./movici-flow-lib/src/*"],
      "@movici-flow-lib": ["movici-flow-lib/src/index.ts"]
    }
  }
}
```

and `vite.config.ts`
```
export default defineConfig({
  ...
  resolve: {
    alias: [
      ...
      {
        find: "@movici-flow-lib",
        replacement: fileURLToPath(new URL("./movici-flow-lib/src", import.meta.url)),
      },
    ],
  },
});
```

update your `createApp`
```
import "@/assets/sass/main.scss";

import { createPinia } from "pinia";
import { createApp } from "vue";

import i18n from "./i18n";

import Oruga from "@oruga-ui/oruga-next";
import { bulmaConfig } from "@oruga-ui/theme-bulma";
import merge from "lodash/merge";

import App from "./App.vue";
import Flow, { orugaConfig } from "@movici-flow-lib";

createApp(App)
  .use(Oruga, merge(bulmaConfig, orugaConfig))
  .use(createPinia())
  .use(router)
  .use(i18n)
  .use(Flow, {
    homeRoute: {
      name: "MyHomeRoute",
    },
  })
  .mount("#app");

```

# Usage
After installation, in order to use Flow Lib, you must implement a `Backend` as specified in
`types/backend.ts` which will be used for requesting data. You should use `api/client.ts:Client`
for creating `Backend` implementations.
```q
import { useFlowStore } from "@movici-flow-lib/stores/flow";
import { setClient } from "@movici-flow-lib/crs";

const flowStore = useFlowStore();
from
// some Client creation logic:
const client = getClient();

//some Backend creation logic using a Client
const backend = getBackend(client);

// supply the backend and client in the required places
flowStore.backend = myBackend;
setClient(client)

```

You can now use Movici Flow. Some components that you may want to use include:

```
views/FlowMainView.vue
components/Deck.vue
components/MapVis.vue
```