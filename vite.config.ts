import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

import dotenv from 'dotenv';

dotenv.config();  // Load the .env file

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  define: {
    'process.env': {
      VITE_CLIENT_ID: process.env.VITE_CLIENT_ID,
      VITE_REDIRECT_URI: process.env.VITE_REDIRECT_URI,
      VITE_OPENAI_KEY: process.env.VITE_OPENAI_KEY,
      VITE_CLIENT_SECRET: process.env.VITE_CLIENT_SECRET,
      VITE_ELEVEN_LABS_API_KEY: process.env.VITE_ELEVEN_LABS_API_KEY,
    },
  },
  server: {
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
