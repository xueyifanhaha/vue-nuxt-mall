<script setup lang="ts">
const route = useRoute()
const id = route.params.id
</script>

<template>
  <h1>商品详情 {{ id }}</h1>
</template>
