import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: tag => {
            return ['conversation-list', 'message-list', 'message-editor'].indexOf(tag) !== -1
          }
        }
      }
    }),
  ],
})
