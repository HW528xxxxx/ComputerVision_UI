# 未來影像分析中心 (Future Image Analysis Center)

這是一個使用 **Vue 3** 製作的前端專案，可以上傳圖片或開啟相機拍照，並呼叫後端 API 進行影像分析，分析結果可以：
- 顯示辨識結果
- 顯示標籤及信心值
- 播放語音（TTS）

## 功能
- 上傳本地圖片
- 開啟相機拍照
- 呼叫後端分析 API
- 顯示分析結果、標籤、信心值
- TTS 語音播放，語速可調整

## 安裝與運行
1. 安裝依賴：
```bash
啟動本地開發伺服器：
npm install


打開瀏覽器訪問：
npm run dev


需有後端 API 提供 /api/analyze 與 /api/tts 功能
http://localhost:5173


專案環境變數請參考 .env 設定

技術棧
Vue 3 + Composition API
Axios
HTML/CSS
