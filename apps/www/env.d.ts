declare namespace NodeJS {
  export interface ProcessEnv {
    NEXT_PUBLIC_REGION: string;
    NEXT_PUBLIC_USER_POOL_ID: string;
    NEXT_PUBLIC_USER_POOL_WEB_CLIENT_ID: string;
    NEXT_PUBLIC_IDENTITY_POOL_ID: string;
    NEXT_OPENAI_API_KEY: string;
  }
}
