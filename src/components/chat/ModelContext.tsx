"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export const DEFAULT_MODEL_ID = "openrouter/free";

export type ModelOption = {
  id: string;
  name: string;
  description: string;
  /** Backend modelId; null means UI-only / coming soon. */
  apiModelId: string | null;
  disabled?: boolean;
};

export const MODEL_OPTIONS: ModelOption[] = [
  {
    id: "magica-auto",
    name: "Magica Auto",
    description: "Automatically picks the best model for your task",
    apiModelId: "openrouter/free",
  },
  {
    id: "magica-fast",
    name: "Magica Fast",
    description: "Fast reasoning for everyday tasks",
    apiModelId: null,
    disabled: true,
  },
  {
    id: "magica-max",
    name: "Magica Max",
    description: "Maximum intelligence for complex tasks",
    apiModelId: null,
    disabled: true,
  },
  {
    id: "magica-pro-max",
    name: "Magica Pro Max",
    description: "Most capable model for ambitious projects",
    apiModelId: null,
    disabled: true,
  },
];

type ModelContextValue = {
  selected: ModelOption;
  setSelectedId: (id: string) => void;
  apiModelId: string;
};

const ModelContext = createContext<ModelContextValue | null>(null);

export function ModelProvider({ children }: { children: ReactNode }) {
  const [selectedId, setSelectedId] = useState(MODEL_OPTIONS[0]!.id);

  const value = useMemo(() => {
    const selected =
      MODEL_OPTIONS.find((m) => m.id === selectedId) ?? MODEL_OPTIONS[0]!;
    return {
      selected,
      setSelectedId,
      apiModelId: selected.apiModelId ?? DEFAULT_MODEL_ID,
    };
  }, [selectedId]);

  return <ModelContext.Provider value={value}>{children}</ModelContext.Provider>;
}

export function useModelSelection(): ModelContextValue {
  const ctx = useContext(ModelContext);
  if (!ctx) {
    throw new Error("useModelSelection must be used within ModelProvider");
  }
  return ctx;
}
