import "@/styles/globals.css";
import { ReactNode } from "react";
import { SessionProvider } from "./components/SessionProvider";

export const metadata = {
  title: "Retell AI & N8N Virtual Assistant",
  description: "Chat with an OpenAI assistant via n8n webhook"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}