import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(root, "src/hooks/queries/index.ts"), "utf8");

test("run status HTTP refetch stays disabled (Trigger Realtime owns updates)", () => {
  assert.match(
    src,
    /RUN_STATUS_HTTP_REFETCH_INTERVAL_MS:\s*false\s*\|\s*number\s*=\s*false/,
  );
  assert.doesNotMatch(src, /refetchInterval:\s*2000/);
});
