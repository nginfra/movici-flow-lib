# Web Console
Web console for the MoViCI Simulation Engine

Copyright (c) 2020ff NGINFRA


## Local installation

The following dependencies are needed:
- [NodeJS](https://nodejs.org/en/download/package-manager/) 

### Installation instructions

``` bash
npm install
```

**Compiles and hot-reloads for development**
``` bash
npm run serve
```

**Compiles and minifies for production**
``` bash
npm run build
```

**Lints and fixes files**
``` bash
npm run lint
```

**Run your unit tests**
``` bash
npm run test:unit
```

**Run your end-to-end tests**
``` bash
npm run test:e2e
```


## Docker

### Build and start web console
```bash
docker build --tag movici/web_console:0.0.1 .
docker run --name web_console --hostname web_console --publish 80:80/tcp --rm movici/web_console:0.0.1
```


## VueX
This project uses Vue.js as a framework and VueX for MVC. The structure of VueX can use some explanation. VueX adds the
concept of *State*, *Actions*, *Mutations* and *Getters* to a Vue app. The general workflow for this is as following.
Vue component use *Actions* to request changes to the *State* of the app. This can for example be through API-calls with
a backend. Inside the *Action* eventually a *Mutation* is called that updates the *State*. *Actions* do not set the 
*State* directly. This may seem a bit cumbersome, but it keeps the concerns separated.

Whenever a component wants data from the state, it should use a *Getter*. For now, *Actions* may also return a value 
when called. This could be for example a JSON structure that is also saved in a *State* variable. It remains to be seen
if this is good for the longer term. The reason for this is that *Actions* call *Mutations* for setting the state. 
*Mutations* may have additional logic before setting the *State* and the *Action* may be unaware of this. So maybe we 
shouldn't rely on *Actions* return values.

### Store
The VueX instance is called the *Store* and can be accessed globally via `Vue.store` or through `this.$store` in a 
component. It is also the directory structure that contains all the logic concerning *State*, *Actions* etc and can be
found under `src/store`. The entrypoint for the store is `store.ts` which also contains some general actions.
Furthermore, the store is divided in `modules` which contain the logic for different types of data, such as `projects`
or `scenarios`.

### State
This is where globally used data is stored in memory for a VueX app. It should not be retrieved directly from Vue files,
but retrieved via *Getters*. Also, setting global state should be done via *Mutations*.

### Actions
*Actions* are entry points for components to request updates to the state and are named in `camelCase`. They are called 
using the `dispatch` method. In components this method can be called using `this.$store.dispatch`.

### Mutations
*Mutations* are invoked by *Actions*. They are functions that actually set the *State*. They are generally named in 
`ALL_CAPS` and can be called using the `commit` function that is available in all *Actions*.

### Getters
Vue components use *Getters* to retrieve values from the *State*. A good pattern in to insert the getters into the 
`computed` section of a component. In this example the getter is called `getMyValue` and the associated component 
variable is `myValue`:
```js
import { mapGetters } from 'vuex';
export default {
  computed: {
    ...mapGetters({
      myValue: 'getMyValue'
    })
  }
};
```

## Version management
We use semantic versioning for the webconsole and the accompanying Helm chart. Versions are formatted like the following:
```
<major>.<minor>.<patch>
```
* a `major` version increase signifies a breaking change in functionality
* a `minor` version increase signifies larger additional features
* a `patch` version increase signifies bugfixes and very small new features

bumping a version must be done by using the `bump2version` tool. This python tool can be installed and used as following:

### Linux
The quickest way to install the tool would be running `pip3 install bump2version`. However, this installs the tool in a
global environment. It is better to first install `pipx` which can manage python environments:

```
pip3 install --user pipx
pipx ensurepath
pipx install bump2version
```

you can then use `make` to use the tool to version bump the webconsole version and/or the chart version:

```
make bump-version
```

or to bump only the chart version:

```
make bump-chart-version
```

by default this will bump the `patch` version. To increment the `major` or `minor` version, run the command with that 
argument. eg `make bump-version level=minor`

### Windows
On Windows, Python must first be installed itself. This can be done through the windows store. After installation it
should be possible to run either `pip` or `pip3` directly, or through python:
```
python -m pip install --user pipx
python -m pipx ensurepath
python -m pipx install bump2version
```

`make` is not part of windows, although it might be available through WSL. To bump the version through make, run the
following commands directly:

```
bumpversion  --config-file .bumpversion.app patch
bumpversion  --config-file .bumpversion.chart patch
```
