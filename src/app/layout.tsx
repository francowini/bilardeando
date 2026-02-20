import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bilardeando — Fantasy Football Argentina",
  description: "Fantasy football platform for Argentine Liga Profesional. Build your squad, earn points, compete with friends.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
