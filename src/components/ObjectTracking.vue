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
import axios from 'axios'

const video = ref(null)
const canvas = ref(null)
let stream = null
let animationFrameId = null
let lastTime = 0 // 控制送後端頻率

// 啟動相機
async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true })
    video.value.srcObject = stream
    requestAnimationFrame(() => detectFrame())
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

// 送影像到後端
async function sendFrameToBackend(videoElement) {
  const tmpCanvas = document.createElement('canvas')
  tmpCanvas.width = 320
  tmpCanvas.height = 240
  const ctx = tmpCanvas.getContext('2d')
  ctx.drawImage(videoElement, 0, 0, 320, 240)

  const dataUrl = tmpCanvas.toDataURL('image/jpeg', 0.8)

  try {
    const res = await axios.post(
      `${import.meta.env.VITE_API_BASE}/api/Detection/detect`,
      { image: dataUrl }, // JSON 物件
      { headers: { 'Content-Type': 'application/json' } }
    )
    console.log('後端回傳結果', res.data)
    return Array.isArray(res.data) ? res.data : [] // 防呆
  } catch (err) {
    console.error('後端偵測錯誤', err)
    return []
  }
}

// 偵測每一幀
async function detectFrame() {
  if (!video.value) return

  const now = performance.now()
  if (now - lastTime > 200) { // 每 200ms 送一次
    lastTime = now
    const predictions = await sendFrameToBackend(video.value)
    drawPredictions(predictions)
  }

  animationFrameId = requestAnimationFrame(detectFrame)
}

// 在 canvas 上畫出框框和文字
function drawPredictions(predictions) {
  if (!predictions || !Array.isArray(predictions)) return
  if (!canvas.value) return

  const ctx = canvas.value.getContext('2d')
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)

  predictions.forEach(pred => {
    const [x1, y1, x2, y2] = pred.bbox
    console.log(`Bbox raw: ${x1}, ${y1}, ${x2}, ${y2}`)

    // === 後端傳回歸一化座標 (0~1)，需轉回像素 ===
    const x = x1 * canvas.value.width
    const y = y1 * canvas.value.height
    const w = (x2 - x1) * canvas.value.width
    const h = (y2 - y1) * canvas.value.height

    ctx.strokeStyle = '#00eaff'
    ctx.lineWidth = 2
    ctx.strokeRect(x, y, w, h)

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
