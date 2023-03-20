<script setup>
const props = defineProps({
  app: Object,
});

const emit = defineEmits(['openApp', 'deleteApp']);

function openApp() {
  emit("openApp", props.app);
}
function deleteApp() {
  emit("deleteApp", props.app);
}
</script>

<template>
  <h2>{{ app.name }}</h2>
  <div v-if="app.imageUrl">
    <img :src="app.imageUrl">
  </div>
  <div v-if="app.description">
    {{ app.description }}
  </div>
  <br>
  <div>
    <button @click="openApp">Open</button> 
    <button v-if="app.isInstalled" @click="deleteApp">Delete</button>
    <a v-if="app.documentationUrl" :href="app.documentationUrl" target="_blank">
      <button>Documentation</button></a> 
  </div>
</template>

<style scoped>
img {
  width: 100px;
}
</style>
