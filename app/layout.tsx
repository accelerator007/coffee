import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'District 7 · ديستركت 7',
  description: 'Specialty coffee loyalty & subscriptions · ولاء واشتراكات القهوة المختصة',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  )
}
