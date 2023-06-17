import { atom } from "jotai";

export interface AssistantTableItem {
  userId: string;
  assistantId: string;
  name: string;
}

export const assistantTableItemsAtom = atom<AssistantTableItem[]>([
  {
    userId: "1",
    assistantId: "1",
    name: "Assistant 1",
  },
  {
    userId: "1",
    assistantId: "2",
    name: "Assistant 2",
  },
]);
