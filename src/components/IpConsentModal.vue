<template>
  <div v-if="!modelValue" class="modal-backdrop">
    <div class="modal-card">
      <h3>隱私通知</h3>
      <p>
        本網站會記錄您的 IP 位址以用於訪問統計及安全監控。
        上傳或使用相機前，請先同意此行為。
      </p>
      <div class="modal-buttons">
        <button @click="accept">我同意</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'
import axios from 'axios'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  }
})

const emits = defineEmits(['update:modelValue'])

function accept() {
    const res = axios.post(
        `${import.meta.env.VITE_API_BASE}/api/Notify/enter`,
        props.form,
        { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    console.log('Notify response:', res.data)

    emits('update:modelValue', true)
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.modal-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 32px 40px;
  max-width: 420px;
  text-align: center;
  color: #333;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
  animation: fadeIn 0.3s ease-out;
  font-family: "Segoe UI", "Roboto", sans-serif;
}

.modal-card h3 {
  font-size: 1.6rem;
  color: #222;
  font-weight: 700;
  margin-bottom: 16px;
}

.modal-card p {
  font-size: 1rem;
  color: #555;
  line-height: 1.5;
  margin-bottom: 28px;
}

.modal-buttons {
  display: flex;
  justify-content: center;
  outline: none;
}

.modal-buttons button {
  padding: 12px 40px;
  border-radius: 8px;
  border: none;
  background: #309edf;
  color: #fff;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: 0.3s ease;
  outline: none;
}

.modal-buttons button:hover {
  transform: scale(1);
  box-shadow: 0 0 25px #309edf, 0 0 35px #309edf;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

</style>