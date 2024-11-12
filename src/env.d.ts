interface ImportMetaEnv {
    readonly VITE_CLIENT_ID: string;
    readonly VITE_CLIENT_SECRET: string;
    readonly VITE_REDIRECT_URI: string;
    readonly VITE_OPENAI_KEY: string;
    readonly VITE_ELEVEN_LABS_API_KEY: string;
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
  