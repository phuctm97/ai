declare namespace NodeJS {
  export interface ProcessEnv {
    NEXT_PUBLIC_FOR_MOBILE?: string;
    NEXT_PUBLIC_REGION: string;
    NEXT_PUBLIC_USER_POOL_ID: string;
    NEXT_PUBLIC_USER_POOL_WEB_CLIENT_ID: string;
    NEXT_PUBLIC_IDENTITY_POOL_ID: string;
    NEXT_PUBLIC_ASSISTANT_TABLE_NAME: string;
    NEXT_OPENAI_API_KEY: string;
  }
}
