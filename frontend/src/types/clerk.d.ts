interface ClerkSession {
  getToken(): Promise<string>;
}

interface Clerk {
  session: ClerkSession | null;
}

declare global {
  interface Window {
    Clerk?: Clerk;
  }
} 