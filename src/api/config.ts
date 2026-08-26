// Base URL for main-frame's API, e.g. https://main-frame.vercel.app/api.
// Set EXPO_PUBLIC_API_BASE_URL (see .env.example) once main-frame is
// deployed. Until then USE_MOCK_API stays true and the app runs entirely
// against the mock layer in src/api/mock.ts.
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? null;

export const USE_MOCK_API = API_BASE_URL === null;
