import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

console.log('🚀 正在執行的環境:', import.meta.env.MODE)
console.log('📝 當前載入的資源:', Array.from(document.scripts).map(s => s.src).filter(Boolean))

createApp(App).mount('#app')
