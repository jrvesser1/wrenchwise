import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title:"Wrenchwise — Vehicle diagnostics, repair research & community",
  description:"A vehicle-specific workspace for diagnostics, recalls, repair research and mechanic community knowledge."
};
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body>{children}</body></html>;
}