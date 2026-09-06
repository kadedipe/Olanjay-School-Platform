import type { Metadata } from "next";
import "./styles.css";
import "./brand.css";
import "./crud.css";

export const metadata: Metadata = {
  title: "Olanjay School Platform",
  description: "Academic operations for Olanjay Technical School",
  icons: { icon: "/Olanjay_School_Logo.jpg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
