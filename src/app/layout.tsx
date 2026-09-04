import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Olanjay School Platform",
  description: "Academic operations for Olanjay Technical School",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
