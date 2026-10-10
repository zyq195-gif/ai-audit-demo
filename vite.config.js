import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const [owner, repository] = (process.env.GITHUB_REPOSITORY || '').split('/')
const isUserSite = repository?.toLowerCase() === `${owner?.toLowerCase()}.github.io`

export default defineConfig({
  plugins: [vue()],
  base: repository && !isUserSite ? `/${repository}/` : '/',
})
