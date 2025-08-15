import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // GitHub Pages 배포를 위한 기본 경로 (리포지토리 이름으로 변경)
  base: '/Flowment/',
})