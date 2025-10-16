<template>
  <div class="container">
    <!-- 載入中遮罩 -->
    <Loading v-if="loading || ttsLoading" />

    <div class="card">
      <h1 class="title">🔬 未來影像分析中心</h1>

      <div class="upload-area">
        <!-- 檔案選擇 -->
        <input id="fileUpload" type="file" accept="image/*" ref="fileInput" @change="onFileChange" hidden />
        <button class="file-label" @click="onSelectImageClick">選擇圖片</button>

        <!-- 開啟相機 -->
        <button class="file-label" @click="openCamera">開啟相機</button>

        <!-- 上傳按鈕 -->
        <button class="file-label" :disabled="!file || loading" @click="upload">
          {{ loading ? '分析中...' : '上傳分析' }}
        </button>

        <!-- 物件追蹤 -->
        <button class="file-label" @click="openObjectTracking">物件追蹤</button>

        <!-- 顯示 ObjectTracking 元件 -->
        <ObjectTracking v-if="showObjectTracking" @close="closeObjectTracking" />
      </div>

      <!-- 相機預覽 -->
        <div v-if="cameraActive" class="camera-preview">
          <video ref="video" autoplay playsinline></video>
          <div class="button-group">
            <button class="file-label" @click="capturePhoto">📸 拍照</button>
            <button class="file-label" @click="closeCamera">❌ 關閉</button>
          </div>
        </div>

      <div v-if="previewUrl" class="preview">
        <img :src="previewUrl" alt="preview" />
      </div>

      <div v-if="loading" class="progress-bar">
        <div class="progress"></div>
      </div>
      <br />

      <!-- 整合 result 與 error 區塊 -->
      <div v-if="result || error" class="result">
        <template v-if="result">
          <br />
          <h3>📋 分析結果</h3>
          <p><strong>辨識結果：</strong> {{ result.gptDescription.description }}</p>

          <!-- TTS 播放按鈕 -->
          <!-- 語速滑桿 -->
          <div class="tts-controls">
            <label>語速: {{ ttsSpeed.toFixed(1) }}x</label>
            <input type="range" min="0.5" max="3" step="0.1" v-model.number="ttsSpeed" />
            <button class="file-label" :disabled="ttsLoading" @click="playTts">
              {{ ttsLoading ? '生成語音中...' : '🔊 播放語音' }}
            </button>
            <audio ref="audioPlayer" hidden></audio>
          </div>
          <p><strong>標籤：</strong>
            <span v-for="(tag, i) in result.gptDescription.extraTags" :key="i" class="hashtag">
              #{{ tag }} <span v-if="i < result.gptDescription.extraTags.length - 1">, </span>
            </span>
          </p>
          <p><strong>信心值：</strong>
            <span class="highlight">{{ (result.captionConfidence * 100).toFixed(2) }}%</span>
          </p>
          <p><strong>分析時間：</strong> {{ (result.requestDurationMs).toFixed(2) }} 秒</p>

          <table class="result-table">
            <thead>
            <tr>
              <th>標籤</th>
              <th>信心值</th>
            </tr>
            </thead>
            <tbody>
              <tr v-for="(tag, i) in result.tags" :key="i">
                <td>{{ tag.name }}</td>
                <td>{{ (tag.confidence * 100).toFixed(2) }}%</td>
              </tr>
            </tbody>
          </table>
        </template>

        <!-- 錯誤訊息 -->
        <div v-if="error" class="error">
          <strong>⚠️ {{ error.code }}</strong><br />
          {{ error.message }}
        </div>
      </div>
      <br />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import axios from 'axios'
import Loading from './Loading.vue'
import ObjectTracking from './ObjectTracking.vue'

const file = ref(null)
const previewUrl = ref('')
const loading = ref(false)
const result = ref(null)
const error = ref('')
const cameraActive = ref(false)
const video = ref(null)
let stream = null 
const ttsLoading = ref(false)
const audioPlayer = ref(null)
const ttsAudio = ref(null)
const ttsSpeed = ref(1.5)
const playing = ref(false)
const fileInput = ref(null)

function onFileChange(e) {
  error.value = ''
  result.value = null
  const f = e.target.files?.[0]
  if (!f) return
  file.value = f
  previewUrl.value = URL.createObjectURL(f)
}

async function upload() {
  if (!file.value) return
  loading.value = true
  error.value = ''
  result.value = null
  ttsAudio.value = null

  try {
    const form = new FormData()
    form.append('file', file.value)

    const res = await axios.post(
      `${import.meta.env.VITE_API_BASE}/api/Azure/analyze`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )

    result.value = res.data
    const data = res.data

    if (data.annotatedImageBase64) {
      let base64 = data.annotatedImageBase64
      if (!base64.startsWith('data:image')) {
        base64 = `data:image/png;base64,${base64}`
      }
      previewUrl.value = base64
    }
  } catch (err) {
    const data = err?.response?.data
    if (data?.code && data?.message) {
      error.value = { code: data.code, message: data.message }
    } else {
      error.value = { code: 'Error', message: err.message || '上傳失敗' }
    }
  } finally {
    loading.value = false
  }
}

async function openCamera() {
  error.value = ''
  result.value = null
  previewUrl.value = ''
  cameraActive.value = true

  try {
    // 判斷是不是手機裝置 → 如果是就用後鏡頭
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

    stream = await navigator.mediaDevices.getUserMedia({
      video: isMobile
        ? { facingMode: { ideal: "environment" } }
        : true
    })

    video.value.srcObject = stream
  } catch (err) {
    error.value = { code: 'CameraError', message: '無法存取相機: ' + err.message }
  }
}

function closeCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop())
  }
  cameraActive.value = false
}

function capturePhoto() {
  const canvas = document.createElement('canvas')
  canvas.width = video.value.videoWidth
  canvas.height = video.value.videoHeight
  const ctx = canvas.getContext('2d')
  ctx.drawImage(video.value, 0, 0, canvas.width, canvas.height)

  canvas.toBlob(blob => {
    file.value = new File([blob], 'capture.jpg', { type: 'image/jpeg' })
    previewUrl.value = URL.createObjectURL(blob)
    closeCamera()
  }, 'image/jpeg')
}

async function playTts() {
  if (!result.value?.gptDescription?.description) return
  ttsLoading.value = true

  try {
    // 第一次才呼叫後端
    if (!ttsAudio.value) {
      const form = new FormData()
      form.append('text', result.value.gptDescription.description)

      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE}/api/Azure/tts`,
        form
      )

      ttsAudio.value = base64ToBlob(res.data.audioBase64, 'audio/mpeg')
    }

    // 用已儲存音檔播放
    const url = URL.createObjectURL(ttsAudio.value)
    audioPlayer.value.src = url
    audioPlayer.value.playbackRate = ttsSpeed.value
    audioPlayer.value.play()
    playing.value = true
  } catch (err) {
    const data = err?.response?.data
    if (data?.code && data?.message) {
      error.value = { code: data.code, message: data.message }
    } else {
      error.value = { code: 'Error', message: err.message || 'TTS 失敗' }
    }
  } finally {
    ttsLoading.value = false
  }
}

// base64 → Blob
function base64ToBlob(base64, type = 'application/octet-stream') {
  const binary = atob(base64)
  const len = binary.length
  const buffer = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    buffer[i] = binary.charCodeAt(i)
  }
  return new Blob([buffer], { type })
}

function onSelectImageClick() {
  // 如果相機正在開啟中 → 先關閉相機
  if (cameraActive.value) {
    closeCamera()
    return
  }

  fileInput.value?.click()
}

// 控制是否顯示 ObjectTracking 元件
const showObjectTracking = ref(false)

const openObjectTracking = () => {
  showObjectTracking.value = true
}

const closeObjectTracking = () => {
  showObjectTracking.value = false
}

// 監聽滑桿，直接套用語速
watch(ttsSpeed, (newSpeed) => {
  if (audioPlayer.value) {
    audioPlayer.value.playbackRate = newSpeed
  }
})

</script>

<style scoped>
html, body {
  height: 100%;
  margin: 0;
  background: #0a1a2f; /* 深藍背景 */
  overflow: hidden;
}

/* 容器透明，像科幻走廊 */
.container {
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  padding: 32px 16px;
  font-family: 'Inter', 'Arial', sans-serif;
}

/* 卡片：冷白玻璃 + 藍色霓虹 */
.card {
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(0, 200, 255, 0.4);
  border-radius: 20px;
  padding: 40px;
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 0 30px rgba(0, 200, 255, 0.4);
  backdrop-filter: blur(18px);
  text-align: center;
}

/* 標題：冷藍光 */
.title {
  font-size: clamp(1.2rem, 5vw, 2.4rem);
  margin-bottom: 24px;
  background: linear-gradient(90deg, #21b3d8, #1c79e4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 800;
  text-shadow: 0 0 12px rgba(0, 240, 255, 0.6), 0 0 24px rgba(0, 255, 200, 0.4);
  letter-spacing: 1px;
}

/* 上傳區 */
.upload-area {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

/* 隱藏原生 input */
.upload-area input[type="file"] {
  display: none;
}

/* 自訂檔案選擇按鈕 */
.file-label {
  padding: 10px 20px;
  background: linear-gradient(45deg, #00eaff, #66ccff);
  border: none;
  border-radius: 12px;
  color: white;
  font-weight: bold;
  cursor: pointer;
  text-shadow: 0 0 6px #003344;
  transition: 0.3s;
  box-shadow: 0 0 15px rgba(0, 234, 255, 0.6), 0 0 25px rgba(102, 204, 255, 0.4);
}
.file-label:hover {
  transform: scale(1.05);
  box-shadow: 0 0 25px #00eaff, 0 0 35px #66ccff;
}

/* 上傳按鈕 */
.upload-area button {
  padding: 8px 22px;
  background: linear-gradient(45deg, #00eaff, #66ccff);
  border: none;
  border-radius: 12px;
  color: white;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 0 15px rgba(0, 234, 255, 0.6), 0 0 25px rgba(102, 204, 255, 0.4);
  transition: 0.3s;
}
.upload-area button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.camera-preview {
  position: relative;
  width: 100%;
  max-width: 400px;
  margin: 15px auto;
  border-radius: 10px;
  overflow: hidden;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.button-group {
  display: flex;
  gap: 12px;
  margin-top: 8px;
  justify-content: center;
}

/* 限制 video 尺寸，避免撐爆版面 */
.camera-preview video {
  width: 100%;
  height: auto;
  max-height: 500px; /* 限制高度避免太高 */
  object-fit: cover;
  border-radius: 10px;
}

/* 圖片預覽 */
.preview img {
  max-width: 100%;
  max-height: 50vh; /* 不超過螢幕一半 */
  object-fit: contain;
  border-radius: 12px;
  margin: 12px auto;
  display: block;
  box-shadow: 0 0 18px #00eaff;
}

input[type="range"] {
  accent-color: #00eaff;
}

.tts-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 10px;
}

/* 結果區 */
.result-table {
  width: 100%;
  margin-top: 20px;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 1rem;
  color: #e6faff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 0 25px rgba(0, 200, 255, 0.3);
  background: linear-gradient(90deg, #003344, #005577);
}

.hashtag {
  color: #888888;
}

.highlight {
  background-color: #ffeb3b;
  padding: 0 4px; /* 螢光筆效果 */
}

/* 表頭 */
.result-table th {
  background: linear-gradient(90deg, #003344, #005577);
  color: #00eaff;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  padding: 14px 20px;
  border-bottom: 2px solid rgba(0, 234, 255, 0.6);
  text-shadow: 0 0 6px rgba(0, 234, 255, 0.7);
}

/* 表格內容 */
.result-table td {
  padding: 12px 18px;
  text-align: center;
  border-bottom: 1px solid rgba(0, 234, 255, 0.15);
  transition: background 0.3s, color 0.3s;
}

/* 偶數列加一點淡淡光影 */
.result-table tr:nth-child(even) td {
  background: rgba(0, 200, 255, 0.05);
}

/* 滑過列：光影掃過去的感覺 */
.result-table tr:hover td {
  background: rgba(0, 200, 255, 0.15);
  color: #ffffff;
  box-shadow: inset 0 0 15px rgba(0, 234, 255, 0.4);
}

/* 表格邊角圓潤 */
.result-table thead tr:first-child th:first-child {
  border-top-left-radius: 12px;
}
.result-table thead tr:first-child th:last-child {
  border-top-right-radius: 12px;
}
.result-table tbody tr:last-child td:first-child {
  border-bottom-left-radius: 12px;
}
.result-table tbody tr:last-child td:last-child {
  border-bottom-right-radius: 12px;
}


/* 錯誤訊息 */
.error {
  margin-top: 20px;
  padding: 16px;
  border-radius: 12px;
  background: rgba(255, 0, 0, 0.15);
  color: #ff4d4d;
  font-weight: bold;
  text-align: left;
  white-space: pre-line;
  box-shadow: 0 0 15px rgba(255, 0, 0, 0.3);
}

/* 手機小螢幕 */
@media (max-width: 480px) {
  body {
    color: #000000;
  }

  .container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    color: #000000;
    padding: 16px;
    box-sizing: border-box;
  }

  .card {
    background: #ffffff;
    box-shadow: none;
    border: none;
    color: #000000;
    max-width: 400px;
    width: 100%;
  }

  .title {
    font-size: 1.4rem;
    line-height: 1.6rem;
    margin-bottom: 16px;
  }

  .upload-area {
    flex-direction: column;
    gap: 10px;
    align-items: center;
  }

  .upload-area label {
    width: 100%;
    max-width: 200px;
    font-size: 1rem;
    padding: 10px;
    text-align: center;
  }

  .upload-area button {
    padding: 10px 20px;
    width: 85%;
    font-size: 1rem;
    align-self: center;
  }

  .preview img {
    max-height: 200px;
    width: 100%;
    object-fit: contain;
    border-radius: 10px;
  }

  .result-table {
    font-size: 0.85rem;
  }
}
</style>
