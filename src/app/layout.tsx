import type { Metadata } from "next";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "RoboMotion Industries Product Discovery",
  description: "A secured Coveo Commerce and Headless product discovery implementation.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
