import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clue Game Tracker",
  description: "A comprehensive mobile-first tracker for the classic board game Clue. Track cards, suggestions, players, and deductions.",
  keywords: ["Clue", "board game", "tracker", "detective", "mystery"],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
