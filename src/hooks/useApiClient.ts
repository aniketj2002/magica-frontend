"use client";

import { useAuth } from "@clerk/nextjs";
import { useMemo } from "react";
import { createApi, type MagicaApi } from "@/lib/api/endpoints";

export function useApiClient(): MagicaApi {
  const { getToken } = useAuth();

  return useMemo(
    () =>
      createApi(async () => {
        return getToken();
      }),
    [getToken],
  );
}
