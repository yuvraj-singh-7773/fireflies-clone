import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { AuthProvider } from "@/components/auth/auth-provider";

export const metadata: Metadata = {
  title: "Firefiles — Meeting Notes & Transcription",
  description: "AI-powered meeting notes, transcripts, and intelligence platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-violet-500/30 selection:text-violet-200">
        <ToastProvider>
          <AuthProvider>
            <div className="min-h-screen">{children}</div>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
