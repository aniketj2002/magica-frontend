"use client";

import { create } from "zustand";

export type ActiveRun = {
  agentRunId: string;
  triggerRunId: string;
  publicAccessToken: string;
};

type ActiveRunState = {
  byChatId: Record<string, ActiveRun>;
  setActiveRun: (chatId: string, run: ActiveRun) => void;
  clearActiveRun: (chatId: string) => void;
  getActiveRun: (chatId: string) => ActiveRun | undefined;
};

export const useActiveRunStore = create<ActiveRunState>((set, get) => ({
  byChatId: {},
  setActiveRun: (chatId, run) =>
    set((state) => ({
      byChatId: { ...state.byChatId, [chatId]: run },
    })),
  clearActiveRun: (chatId) =>
    set((state) => {
      const next = { ...state.byChatId };
      delete next[chatId];
      return { byChatId: next };
    }),
  getActiveRun: (chatId) => get().byChatId[chatId],
}));
