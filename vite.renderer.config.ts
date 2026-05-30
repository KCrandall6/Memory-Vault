import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Renderer-only Vite config for rare browser isolation checks.
// Use `npm run dev` for normal development so the Electron preload and IPC bridge are active.
export default defineConfig({
  plugins: [react()],
});
