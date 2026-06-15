import type { Metadata } from 'next'
import { Cairo, Almarai } from 'next/font/google'
import './globals.css'

const cairo = Cairo({
  subsets: ['arabic'],
  variable: '--font-cairo',
  display: 'swap',
  weight: ['400', '600', '700', '800', '900'],
})

const almarai = Almarai({
  subsets: ['arabic'],
  variable: '--font-almarai',
  display: 'swap',
  weight: ['300', '400', '700', '800'],
})

export const metadata: Metadata = {
  title: 'Coffee | كافي',
  description: 'إدارة اشتراكات القهوة',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${almarai.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  )
}
