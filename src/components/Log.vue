<script setup>
const props = defineProps({
  info: Object,
});

const emit = defineEmits(['cancel']);

function cancel() {
  emit("cancel", props.app);
}
</script>

<template>
  <div>
    <h2>{{ info.title }}</h2>
    <button @click="cancel">Cancel installation</button>
  </div>
  <pre>
    {{ info.output }}
  </pre>
</template>

<style scoped>
div {
  width: 100%;
}
h2 {
  display: inline
}
button {
  text-align: right;
}
pre {
  font-size: small;
  font-family: 'Courier New', Courier, monospace;
  line-height: normal;
}
</style>
