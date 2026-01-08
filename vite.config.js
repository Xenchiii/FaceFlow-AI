import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Ensure the server looks in the ROOT folder for index.html
  root: './', 
  build: {
    outDir: 'dist',
  },
  server: {
    // This allows the server to work on the expected port
    port: 5173,
    open: true // This will automatically open the browser for you
  }
})