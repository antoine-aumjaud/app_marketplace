<script setup>
import { invoke } from "@tauri-apps/api/tauri";

import { ref, computed, onMounted } from 'vue'

import AppList   from "./components/AppList.vue";
import AppDetail from './components/AppDetail.vue';

//apps
const apps = ref({})
async function initApps() {
  console.debug("init apps");
  const appsJson = await (await fetch("/apps.json")).json();
  for(const entity of Object.values(appsJson).filter(entity => entity.appsUrl != null)) {
    try {
      entity.apps = await (await fetch(entity.appsUrl)).json();
    }
    catch(e) {
      console.error("Can't load " + entity.appsUrl, e);
    }
  }
  apps.value = appsJson;
}

//filter entities
const entitySelected = ref("");
const entities = computed({
  get() {
    return Object.keys(apps.value)
      .map( key =>  { return {value: key, text: apps.value[key].name }; } );
  }
});
function initEntity() {
  entitySelected.value = localStorage.getItem("entitySelected"); 
}
function selectEntity(event) {
  localStorage.setItem("entitySelected", event.target.value);
  computeApps();
}

//filter favorites
const viewOnlyFavorites = ref(false);
const favorites = ref([]);
function initFavorites() {
  viewOnlyFavorites.value = localStorage.getItem("viewOnlyFavorites") || false;
  const favs = localStorage.getItem("favorites") || "";
  favorites.value = favs.split(',');
}
function checkViewOnlyFavorites(event) {
  localStorage.setItem("viewOnlyFavorites", event.target.checked); 
  computeApps();
}
function changeFavorites() {
  localStorage.setItem("favorites", favorites.value);
  computeApps();
}

//filter production
const viewOnlyProduction = ref(true);
async function initProduction() {
  viewOnlyProduction.value = localStorage.getItem("viewOnlyProduction") || true;
}
function checkViewOnlyProduction(event) {
  localStorage.setItem("viewOnlyProduction", event.target.checked); 
  computeApps();
}

//filter search
const searchFilter = ref("");
const computedApps = ref([])
function computeApps() {
  selectedApp.value = ""
    if(!entitySelected.value || !apps.value[entitySelected.value] || !apps.value[entitySelected.value].apps) {
      console.debug("computeApps no entity selected");
      computedApps.value = [];
    }
    else {
      let myapps = apps.value[entitySelected.value].apps;
      console.debug("computeApps", myapps);
      if(searchFilter.value.trim().length > 0) {
        const searchValue = searchFilter.value.toLowerCase();
        myapps = myapps.filter(app => app.name.toLowerCase().includes(searchValue) || app.description?.toLowerCase().includes(searchValue) );
        console.debug("computeApps filter by searchFilter", myapps)
      }
      if(viewOnlyFavorites.value === true) {
        myapps = myapps.filter(app => favorites.value.includes(app.code));
        console.debug("computeApps filter by viewOnlyFavorites", myapps)
      }
      if(viewOnlyProduction.value === true) {
        myapps = myapps.filter(app => app.isProduction);
        console.debug("computeApps filter by viewOnlyProduction", myapps)
      }
      myapps.forEach(app => app.isFavorite = favorites.value.includes(app.code));
      console.debug("computeApps resut:", myapps);
      computedApps.value = myapps;
    }
}

//app
const selectedApp = ref();
function showApp(app) {
  selectedApp.value = app;
}
async function openApp(app) {
  const appsToInstall = [];
  //check tools
  if(app.tools) for(const tool of app.tools) {
    const toolApp = apps.value.filter["tools"].filter(a => a.name === tool);
    const localVersion = await invoke("get_app_file_version", { appCode: toolApp.code });
    const remoteVersion = await(await fetch(toolApp.versionUri)).json();
    console.debug(`Tool '${toolApp.code}': versions ${localVersion}/${remoteVersion}`);
    if(remoteVersion != localVersion) appsToInstall.push(toolApp.installUri);
  }
  //check app
  const localVersion = await invoke("get_app_file_version", { app_code: app.code });
  const remoteVersion = await(await fetch(app.versionUri)).json();
  console.debug(`App '${app.code}': versions ${localVersion}/${remoteVersion}`);
  if(remoteVersion != localVersion) appsToInstall.push(app.installUri);
  //installations
  for(const appToInstall of appsToInstall) {
    console.info("install app", app.installUri, 
      await invoke("install_app", { installUri: app.installUri }));
  }
  //launch app
  console.info("launch_app", app.launchCommand, 
    await invoke("launch_app", { command: app.launchCommand }));
}
async function deleteApp(app) {
  console.info("delete_app", app.code, 
    await invoke("delete_app", { app: app.code }));
}
//init
onMounted(async () => {
  await initApps();
  initEntity();
  initProduction();
  initFavorites();
  computeApps();
});

</script>

<template>
  <div class="container">
    <h1>BizApp: the Business Applications market place!</h1>

    <div class="row">
      <div class="col">
        <label for="entitySelect">BU/SU</label>
        <select id="entitySelect" v-model="entitySelected" @change="selectEntity">
          <option value="">Select one</option>
          <option v-for="entity in entities" :value="entity.value">{{ entity.text }}</option>
        </select>
      </div>

      <div class="col search">
        <input id="searchInput" v-model="searchFilter" placeholder="Filter by name" @input="computeApps">
      </div>

      <div class="col">
        <label for="viewOnlyFavoritesCheckbox">View only favorites</label>
        <input  id="viewOnlyFavoritesCheckbox"  type="checkbox" v-model="viewOnlyFavorites"  @change="checkViewOnlyFavorites">
        <label for="viewOnlyProductionCheckbox">View only production</label>
        <input  id="viewOnlyProductionCheckbox" type="checkbox" v-model="viewOnlyProduction" @change="checkViewOnlyProduction">
      </div>
    </div>
    
    <hr class="max">

    <div class="row">
      <div class="col">
        <AppList 
          :apps="computedApps" 
          :favorites="favorites"
          @changeFavorites="changeFavorites" 
          @openApp="openApp"
          @showApp="showApp"
          />
      </div>
      <div class="col detail">
        <AppDetail v-if="selectedApp"
          :app="selectedApp" 
          @openApp="openApp"
          @deleteApp="deleteApp"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
}
.row {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}
.col {
  align-items: center;
  vertical-align: middle;
}
.col label {
  white-space: nowrap;
}
.col.search {
  flex: 2;
}
.col.search input {
  min-width: 80px;
  width: 80%;
}

.max {
  width: 100%;
}

.detail {
  border-left: 2px solid #456566;
  padding-left: 10px;
}
</style>
