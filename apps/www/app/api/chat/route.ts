import type { ServerRuntime } from "next";

import { OpenAIStream, StreamingTextResponse } from "ai";
import * as jose from "jose";
import { Configuration, OpenAIApi } from "openai-edge";

export const runtime: ServerRuntime = "edge";

const authScheme = "Bearer ";

const authIssuer = `https://cognito-idp.${process.env.NEXT_PUBLIC_REGION}.amazonaws.com/${process.env.NEXT_PUBLIC_USER_POOL_ID}`;

const authClockTolerance = 60; // 1 minute (in seconds)

const authJwks = jose.createRemoteJWKSet(
  new URL(`${authIssuer}/.well-known/jwks.json`)
);

interface AuthJwtPayload extends jose.JWTPayload {
  "cognito:username": string;
  email: string;
}

interface AuthUser {
  username: string;
}

async function auth(req: Request): Promise<AuthUser | undefined> {
  const authorizationHeader = req.headers.get("authorization");
  if (!authorizationHeader || !authorizationHeader.startsWith(authScheme))
    return;
  try {
    const jwt = await jose.jwtVerify(
      authorizationHeader.substring(authScheme.length),
      authJwks,
      { issuer: authIssuer, clockTolerance: authClockTolerance }
    );
    const jwtPayload = jwt.payload as AuthJwtPayload;
    return { username: jwtPayload["cognito:username"] };
  } catch (err) {
    if (!(err instanceof jose.errors.JOSEError)) throw err;
  }
}

const openaiApi = new OpenAIApi(
  new Configuration({ apiKey: process.env.NEXT_OPENAI_API_KEY })
);

export async function POST(req: Request): Promise<Response> {
  const user = await auth(req);
  if (!user) return new Response("Unauthorized", { status: 401 });
  const { messages } = await req.json();
  const response = await openaiApi.createChatCompletion({
    stream: true,
    model: "gpt-3.5-turbo",
    messages,
  });
  const stream = OpenAIStream(response);
  return new StreamingTextResponse(stream);
}
