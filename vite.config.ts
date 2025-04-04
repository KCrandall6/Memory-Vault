import { defineConfig } from 'vite';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        // Main process entry file
        entry: 'electron/main.ts',
        vite: {
          build: {
            sourcemap: true,
            outDir: 'dist-electron',
            rollupOptions: {
              // External dependencies that shouldn't be bundled
              external: [
                'electron', 
                'better-sqlite3', 
                'sharp'
              ],
            },
          },
        },
      },
      {
        // Preload process entry file
        entry: 'electron/preload.ts',
        onstart(options) {
          // Notify the renderer process when development mode changes
          options.reload();
        },
        vite: {
          build: {
            sourcemap: true,
            outDir: 'dist-electron',
          },
        },
      }
    ]),
    renderer(),
  ],
  resolve: {
    // Add support for importing CommonJS modules
    preserveSymlinks: true,
  },
  // Add optionally if you need aliasing
  // resolve: {
  //   alias: {
  //     '@': '/src',
  //   },
  // },
});