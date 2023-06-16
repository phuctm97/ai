import type { ServerRuntime } from "next";

import { OpenAIStream, StreamingTextResponse } from "ai";
import { Configuration, OpenAIApi } from "openai-edge";

export const runtime: ServerRuntime = "edge";

const openaiApi = new OpenAIApi(
  new Configuration({ apiKey: process.env.NEXT_OPENAI_API_KEY })
);

export async function POST(req: Request): Promise<Response> {
  const { messages } = await req.json();
  const response = await openaiApi.createChatCompletion({
    stream: true,
    model: "gpt-3.5-turbo",
    messages,
  });
  const stream = OpenAIStream(response);
  return new StreamingTextResponse(stream);
}
