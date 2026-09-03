import type { Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

// Without this, mobile Safari/Chrome fall back to a desktop-width virtual
// viewport (~980px) and none of the app's responsive breakpoints apply on
// real devices, regardless of how the CSS itself is written.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="page-container">{children}</div>
        </Providers>
      </body>
    </html>
  );
}