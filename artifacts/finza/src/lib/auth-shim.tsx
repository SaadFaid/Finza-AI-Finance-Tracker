import { createContext, useContext, type ReactNode } from 'react';

import { useAuth as useClerkAuth, useClerk as useClerkClient } from '@clerk/react';

interface AuthValue {
  isLoaded: boolean;
  isSignedIn: boolean | undefined;
}

interface ClerkValue {
  signOut: (opts?: { redirectUrl?: string }) => Promise<void> | void;
  addListener: (cb: (state: { user?: { id?: string | null } | null }) => void) => () => void;
}

interface AuthApi {
  useAuth: () => AuthValue;
  useClerk: () => ClerkValue;
}

const realApi: AuthApi = {
  useAuth: () => useClerkAuth(),
  useClerk: () => useClerkClient(),
};

const demoApi: AuthApi = {
  useAuth: () => ({ isLoaded: true, isSignedIn: false }),
  useClerk: () => ({
    signOut: () => undefined,
    addListener: () => () => undefined,
  }),
};

const AuthApiContext = createContext<AuthApi>(realApi);

export function AuthProvider({ demo, children }: { demo: boolean; children: ReactNode }) {
  return <AuthApiContext.Provider value={demo ? demoApi : realApi}>{children}</AuthApiContext.Provider>;
}

export function useAuth(): AuthValue {
  return useContext(AuthApiContext).useAuth();
}

export function useClerk(): ClerkValue {
  return useContext(AuthApiContext).useClerk();
}
