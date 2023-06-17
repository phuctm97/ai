import type { UseChatOptions } from "ai/react";
import type { FC } from "react";

import { useChat } from "ai/react";
import { atom, useAtomValue } from "jotai";
import { Suspense } from "react";

import { assistantTableItemsAtom } from "~/assistant";
import { authedAtom, authorizationHeaderAtom, SignIn } from "~/auth";

const Assistant: FC = () => {
  const assistantTableItems = useAtomValue(assistantTableItemsAtom);
  return (
    <select className="absolute left-4 top-4">
      {assistantTableItems.map((assistantTableItem) => (
        <option
          key={assistantTableItem.assistantId}
          value={assistantTableItem.assistantId}
        >
          {assistantTableItem.name}
        </option>
      ))}
    </select>
  );
};

function asChatOptions(authorizationHeader: string): UseChatOptions {
  return {
    api: process.env.NEXT_PUBLIC_FOR_MOBILE
      ? "https://ai.phuctm97.com/api/chat"
      : "/api/chat",
    headers: { authorization: authorizationHeader },
  };
}

const chatOptionsAtom = atom<UseChatOptions | Promise<UseChatOptions>>(
  (get) => {
    const authorizationHeaderGet = get(authorizationHeaderAtom);
    if (authorizationHeaderGet instanceof Promise)
      return authorizationHeaderGet.then(asChatOptions);
    return asChatOptions(authorizationHeaderGet);
  }
);

const Chat: FC = () => {
  const chatOptions = useAtomValue(chatOptionsAtom);
  const { messages, error, input, handleInputChange, handleSubmit } =
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
        className="fixed bottom-8 left-4 right-4 flex flex-col items-center justify-end space-y-4"
        onSubmit={handleSubmit}
      >
        {error && <p className="text-red-600">{error.message}</p>}
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
  return (
    <>
      <Suspense>
        <Assistant />
      </Suspense>
      <Suspense>
        <Chat />
      </Suspense>
    </>
  );
};

export default Page;
