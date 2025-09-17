import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { createHtmlPlugin } from 'vite-plugin-html'

export default defineConfig(({ mode }) => ({
  plugins: [
    vue(),
    ...(mode === 'production'
      ? [
          createHtmlPlugin({
            inject: {
              data: {
                mainJs: '/assets/index.[hash].js' // build 後才替換
              }
            }
          })
        ]
      : []),
  ],
  base: './',
}))
