import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Optimisations pour le build Lovable
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-toast'],
          'audio-vendor': ['eventemitter3']
        }
      }
    },
    // Augmenter la limite de taille des chunks
    chunkSizeWarningLimit: 1000,
    // Désactiver la minification pour éviter les erreurs de build
    minify: mode === 'production' ? 'esbuild' : false
  },
  define: {
    // Polyfill pour environnements sans global
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['eventemitter3', 'react', 'react-dom'],
    // Exclure les modules potentiellement problématiques
    exclude: ['sass-embedded']
  }
}));
