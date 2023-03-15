<script setup>
import { confirm } from '@tauri-apps/api/dialog';

const props = defineProps({
  app: Object,
})

const emit = defineEmits(['openApp', 'deleteApp']);

function openApp() {
  emit("openApp", props.app);
}
async function deleteApp() {
  const confirmed = await confirm('Are you sure you want to remove this application?', { title: 'Validation' });
  if(confirmed) {
    emit("deleteApp", props.app);
  }
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
    <button @click="deleteApp">Delete</button>
    <a :href="app.documentationUrl" target="_blank">
      <button>Documentation</button></a> 
  </div>
</template>

<style scoped>
img {
  width: 100px;
}
</style>
