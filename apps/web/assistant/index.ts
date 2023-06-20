import { atom } from "jotai";

import { mustNotNilAtom } from "~/misc";

export interface AssistantTableItem {
  userId: string;
  assistantId: string;
  name: string;
}

const assistantTableItemsNullableAtom = atom<AssistantTableItem[] | undefined>(
  undefined
);

export const assistantTableItemsAtom = mustNotNilAtom(
  assistantTableItemsNullableAtom
);
