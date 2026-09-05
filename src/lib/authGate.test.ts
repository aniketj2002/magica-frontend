import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { blockForSignIn } from "./authGate";

describe("blockForSignIn", () => {
  it("returns false and does not open when signed in", () => {
    let opened = 0;
    const blocked = blockForSignIn({
      isSignedIn: true,
      openSignIn: () => {
        opened += 1;
      },
    });
    assert.equal(blocked, false);
    assert.equal(opened, 0);
  });

  it("opens sign-in and returns true when signed out", () => {
    let opened = 0;
    const blocked = blockForSignIn({
      isSignedIn: false,
      openSignIn: () => {
        opened += 1;
      },
    });
    assert.equal(blocked, true);
    assert.equal(opened, 1);
  });
});
