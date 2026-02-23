import type { Metadata } from "next";
import { SessionProvider } from "@/components/providers/session-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bilardeando",
  description:
    "Armá tu equipo, competí con amigos y demostrá que sabés de fútbol.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased font-body">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
