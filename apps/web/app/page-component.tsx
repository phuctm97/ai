import type { UseChatOptions } from "ai/react";
import type { FC } from "react";

import { useChat } from "ai/react";
import { atom, useAtomValue } from "jotai";

import { authedAtom, authorizationHeaderAtom, SignIn } from "~/auth";

function asChatOptions(authorizationHeader: string): UseChatOptions {
  return {
    headers: { authorization: authorizationHeader },
  };
}

const chatOptionsAtom = atom<UseChatOptions | Promise<UseChatOptions>>(
  (get) => {
    const authorizationHeaderGet = get(authorizationHeaderAtom);
    if (!(authorizationHeaderGet instanceof Promise))
      return asChatOptions(authorizationHeaderGet);
    return authorizationHeaderGet.then(asChatOptions);
  }
);

const Chat: FC = () => {
  const chatOptions = useAtomValue(chatOptionsAtom);
  const { messages, input, handleInputChange, handleSubmit } =
    useChat(chatOptions);
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

const Page: FC = () => {
  const authed = useAtomValue(authedAtom);
  if (!authed) return <SignIn />;
  return <Chat />;
};

export default Page;
