import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'iLabs WhatsApp Agent',
  description: 'AI-powered WhatsApp Business agent for iLabs Pharmaceuticals',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}