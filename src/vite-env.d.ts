/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SHEETS_API_URL?: string;
  readonly VITE_DEMO_MODE?: string;
  readonly VITE_ADMIN_ACADEMIC_PASS?: string;
  readonly VITE_ADMIN_STUDENT_PASS?: string;
  readonly VITE_ADMIN_SYSTEM_PASS?: string;
  readonly GEMINI_API_KEY?: string;
  readonly APP_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
