import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GitBot - AI Code Review Assistant',
  description: 'Intelligent code review and diff analysis tool',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
