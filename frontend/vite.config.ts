import path from 'path'
import tailwindcss from "@tailwindcss/vite"
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // Expose environment variables to the client
    define: {
      __APP_ENV__: JSON.stringify(env.APP_ENV),
    },
    // Configure environment variables
    envPrefix: 'VITE_',
    server: {
      port: 3001,
      host: true,
    },
    preview: {
      port: 3001,
      host: true,
    },
  }
})
