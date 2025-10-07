<template>
  <div class="object-tracking-page">
    <h1>即時相機 + AI 物件追蹤</h1>

    <video ref="video" autoplay playsinline width="640" height="480"></video>
    <canvas ref="canvas" width="640" height="480"></canvas>

    <div class="controls">
      <button @click="startCamera">啟動相機</button>
      <button @click="stopCamera">關閉相機</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue'

// TensorFlow.js 與 COCO-SSD
import * as tf from '@tensorflow/tfjs'
import * as cocoSsd from '@tensorflow-models/coco-ssd'

const video = ref(null)
const canvas = ref(null)
let stream = null
let model = null
let animationFrameId = null

// 啟動相機 + 載入模型
async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true })
    video.value.srcObject = stream

    // 載入模型（第一次啟動）
    if (!model) {
      model = await cocoSsd.load()
      console.log('模型載入完成')
    }

    detectFrame()
  } catch (err) {
    console.error('無法啟動相機', err)
  }
}

// 停止相機
function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop())
  }
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
  const ctx = canvas.value.getContext('2d')
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
}

// 偵測每一幀
async function detectFrame() {
  if (!model || !video.value) return

  const predictions = await model.detect(video.value)

  drawPredictions(predictions)

  animationFrameId = requestAnimationFrame(detectFrame)
}

// 在 canvas 上畫出框框和文字
function drawPredictions(predictions) {
  const ctx = canvas.value.getContext('2d')
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)

  predictions.forEach(pred => {
    const [x, y, width, height] = pred.bbox

    // 框框
    ctx.strokeStyle = '#00eaff'
    ctx.lineWidth = 2
    ctx.strokeRect(x, y, width, height)

    // 標籤文字
    ctx.font = '16px Arial'
    ctx.fillStyle = '#00eaff'
    ctx.fillText(`${pred.class} (${(pred.score * 100).toFixed(1)}%)`, x, y > 10 ? y - 5 : 10)
  })
}

onBeforeUnmount(() => {
  stopCamera()
})
</script>

<style scoped>
.object-tracking-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}
video, canvas {
  border: 2px solid #00eaff;
  border-radius: 12px;
  margin-bottom: 12px;
}
.controls button {
  margin: 0 8px;
  padding: 8px 20px;
  border-radius: 10px;
  background-color: #00eaff;
  color: white;
  border: none;
  cursor: pointer;
}
</style>
