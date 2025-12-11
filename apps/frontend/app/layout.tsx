import type { Metadata } from "next";
import './globals.css'
import { AuthProvider } from "../contexts/AuthContext";

export const metadata: Metadata = {
  title: "Vocabulary App",
  description: "Learn English vocabulary",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}