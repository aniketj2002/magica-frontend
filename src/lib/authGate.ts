/**
 * If the user is signed out, open the Clerk sign-in modal and return true
 * (caller must abort). If signed in, return false (caller may proceed).
 */
export function blockForSignIn(opts: {
  isSignedIn: boolean;
  openSignIn: () => void;
}): boolean {
  if (opts.isSignedIn) return false;
  opts.openSignIn();
  return true;
}
