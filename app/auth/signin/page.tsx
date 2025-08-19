"use client";

import { signIn, getProviders } from "next-auth/react";
import { useEffect, useState } from "react";
import type { ClientSafeProvider, LiteralUnion } from "next-auth/react";
import type { BuiltInProviderType } from "next-auth/providers/index";

type Providers = Record<
  LiteralUnion<BuiltInProviderType, string>,
  ClientSafeProvider
> | null;

const SignIn = () => {
  const [providers, setProviders] = useState<Providers>(null);

  useEffect(() => {
    const fetchProviders = async () => {
      const res = await getProviders();
      setProviders(res);
    };
    void fetchProviders();
  }, []);

  const handleSignIn = (providerId: string) => {
    void signIn(providerId, { callbackUrl: "/" });
  };

  return (
    <main className="container-responsive flex min-h-screen flex-col items-center justify-center py-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card/60 p-8 shadow-glass">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-primary/15 ring-1 ring-primary/30" />
          <h1 className="text-2xl font-semibold tracking-tight">Welcome to Retell AI & N8N Virtual Assistant</h1>
          <p className="mt-2 text-sm text-muted">Sign in to start chatting with the assistant</p>
        </div>

        <div className="space-y-4">
          {providers &&
            Object.values(providers).map((provider) => (
              <button
                key={provider.name}
                onClick={() => handleSignIn(provider.id)}
                className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground ring-1 ring-primary/40 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                Sign in with {provider.name}
              </button>
            ))}
        </div>
      </div>
    </main>
  );
};

export default SignIn;
