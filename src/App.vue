<template>
  <!-- IP 同意彈窗 -->
  <IpConsentModal v-model="ipConsentGiven" />

  <ImageUploader v-if="ipConsentGiven" />
</template>

<script setup>
import { ref } from 'vue'
import IpConsentModal from './components/IpConsentModal.vue'
import ImageUploader from './components/ImageUploader.vue'

const ipConsentGiven = ref(false)
</script>