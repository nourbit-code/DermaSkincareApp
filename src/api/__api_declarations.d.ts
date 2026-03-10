// Temporary module declarations for API JS modules
// Treat modules under src/api as `any` to avoid widespread TS errors
declare module "*src/api/*" {
  const api: any;
  export = api;
}

// Generic API response helper type
declare global {
  interface ApiResponse<T = any> {
    success: boolean;
    data: T;
    error?: string;
  }
}

export {};
