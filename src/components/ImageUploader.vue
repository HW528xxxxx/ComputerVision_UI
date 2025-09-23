<template>
  <div class="container">
    <div class="card">
      <h1 class="title">🔬 未來影像分析中心</h1>

      <div class="upload-area">
        <!-- 檔案選擇 -->
        <label for="fileUpload" class="file-label">選擇圖片</label>
        <input id="fileUpload" type="file" accept="image/*" @change="onFileChange" />

        <!-- 上傳按鈕 -->
        <button class="file-label" :disabled="!file || loading" @click="upload">
          {{ loading ? '分析中...' : '上傳分析' }}
        </button>
      </div>

      <div v-if="previewUrl" class="preview">
        <img :src="previewUrl" alt="preview" />
      </div>

      <div v-if="loading" class="progress-bar">
        <div class="progress"></div>
      </div>

      <div v-if="result" class="result">
        <br />
        <h3>📋 分析結果</h3>
        <p><strong>辨識結果：</strong> {{ result.gptDescription.description }}</p>
        <p><strong>標籤：</strong>
          <span v-for="(tag, i) in result.gptDescription.extraTags" :key="i" class="hashtag">
            #{{ tag }} <span v-if="i < result.gptDescription.extraTags.length - 1">, </span>
          </span>
        </p>
        <p><strong>信心值：</strong>
          <span class="highlight">{{
            (result.captionConfidence * 100).toFixed(2)
          }}%</span>
        </p>
        <p><strong>分析時間：</strong> {{ (result.requestDurationMs).toFixed(2) }} 秒</p>
        <br />

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
      </div>
      <br />

      <!-- 錯誤訊息 -->
      <div v-if="error" class="error">
        <strong>⚠️ {{ error.code }}</strong><br />
        {{ error.message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'

const file = ref(null)
const previewUrl = ref('')
const loading = ref(false)
const result = ref(null)
const error = ref('')

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

  try {
    const form = new FormData()
    form.append('file', file.value)

    const res = await axios.post(
      `${import.meta.env.VITE_API_BASE}/api/analyze`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )

    result.value = res.data
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
  background: #ffffff;
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
    background: #ffffff !important;
  }

  .container {
    background: #ffffff !important;
  }

  .card {
    padding: 20px;
    max-width: 95%;
    margin: 0 auto;

    /* 移除陰影、邊框，但保留白底 */
    background: #ffffff;
    box-shadow: none;
    border: none;
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
