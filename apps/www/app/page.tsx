"use client";

import type { FC } from "react";

import { useChat } from "ai/react";

const Page: FC = () => {
  const { messages, input, handleInputChange, handleSubmit } = useChat();
  return (
    <>
      <main className="container mx-auto flex max-w-md flex-col items-stretch justify-start space-y-4 px-4 py-10">
        {messages.map((message) => (
          <div className="whitespace-pre-wrap" key={message.id}>
            {message.role === "user" ? "User: " : "AI: "}
            {message.content}
          </div>
        ))}
      </main>
      <form
        className="fixed bottom-8 left-4 right-4 flex flex-col items-center justify-end"
        onSubmit={handleSubmit}
      >
        <input
          className="container max-w-md rounded border border-gray-300 px-4 py-2 shadow-xl focus:outline-none"
          placeholder="Say something…"
          value={input}
          onChange={handleInputChange}
        />
      </form>
    </>
  );
};

export default Page;
