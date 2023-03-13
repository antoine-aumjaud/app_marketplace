<script setup>
const props = defineProps({
  apps: Array,
  favorites: Array,
})
const emit = defineEmits(['changeFavorites', 'showApp', 'openApp']);

function setFavorites(app) {
  app.isFavorite =! app.isFavorite;
  if(app.isFavorite) {
    props.favorites.push(app.code);
  }
  else {
    for(var i = 0; i < props.favorites.length; i++){ 
        if(props.favorites[i] === app.code) { 
          props.favorites.splice(i--, 1); 
        }
    }
  }
  emit("changeFavorites")
}

function showApp(app) {
  emit("showApp", app);
}
function openApp(app) {
  emit("openApp", app);
}
</script>

<template>
  <table> 
  <tr v-for="app in apps" >
    <td>
      <img class="fav"
        @click="setFavorites(app)"
        :class="{activated: app.isFavorite === true}"
        src="../assets/favorite.png" 
        alt="Favorite" />  
    </td>
    <td>
      <img class="open" 
        @click="openApp(app)"
        src="../assets/open.png" 
        alt="Open" /> 
    </td>
    <td class="name" @click="showApp(app)">
      {{ app.name }}
    </td>
  </tr> 
  </table>
</template>

<style scoped>
td {
  padding-left: 10px;
  cursor: pointer;
}
td.name {
  min-width: 200px;
  width: 300px;
  padding-left: 10px;
}
td.name:hover {
  text-decoration: underline;
}

img.fav {
  width: 20px;
  filter: grayscale(1);
}
img.fav:hover {
  filter: grayscale(0); 
}
img.fav.activated {
  filter: grayscale(0); 
}

img.open {
  width: 20px;
}
</style>
