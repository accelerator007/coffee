import type { Metadata } from 'next'
import { Noto_Sans_Arabic } from 'next/font/google'
import './globals.css'

const notoSansArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  variable: '--font-noto-arabic',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Coffee | كافي',
  description: 'إدارة اشتراكات القهوة',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className={`${notoSansArabic.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  )
}
