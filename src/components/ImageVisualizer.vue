<template>
  <div class="image-visualizer">
    <h3>📷 標註圖片預覽</h3>

    <div v-if="base64Image">
      <img :src="base64Image" alt="Annotated Image" />
    </div>

    <div v-else>
      <p>尚未分析圖片</p>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  base64Image: String
})
</script>

<style scoped>
.image-visualizer img {
  max-width: 100%;
  max-height: 50vh;
  object-fit: contain;
  border-radius: 12px;
  margin: 12px auto;
  display: block;
  box-shadow: 0 0 18px #00eaff;
}
</style>
