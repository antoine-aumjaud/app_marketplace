<script setup>
const props = defineProps({
  app: Object,
})

const emit = defineEmits(['openApp']);

function openApp(app) {
  emit("openApp", app);
}

</script>

<template>
  <img class="open" 
    @click="openApp(app)"
    src="../assets/open.png" 
    alt="Open" /> 
  <h2>{{ app.name }}</h2>
  <div v-if="app.imageUrl">
    <img class="logo" :src="app.imageUrl">
  </div>
  <div v-if="app.description">
    {{ app.description }}
  </div>
  <div v-if="app.documentationUrl">
    <a :href="app.documentationUrl" target="_blank">{{ app.documentationUrl }}</a>
  </div>
</template>

<style scoped>
img.logo {
  width: 100px;
}

img.open {
  width: 100px;
}
</style>
