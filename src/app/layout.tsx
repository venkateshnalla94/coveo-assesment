import type { Metadata } from "next";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Coveo Search Assessment",
  description: "A secured Coveo Headless search implementation.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
