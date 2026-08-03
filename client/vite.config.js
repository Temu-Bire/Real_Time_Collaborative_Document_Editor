import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [  
    tailwindcss(),
    react()],
  optimizeDeps: {
    include: [
      '@tiptap/extension-collaboration',
      '@tiptap/extension-collaboration-cursor',
      '@tiptap/y-tiptap',
      'y-prosemirror',
      'yjs',
      'y-socket.io'
    ],
  },
})
