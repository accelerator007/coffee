import type { Metadata } from 'next'
import { Playfair_Display, Amiri, Inter, Almarai } from 'next/font/google'
import './globals.css'

// Display / headings / numbers — elegant serif (Latin + Arabic).
// No weight list: Playfair is a variable font, so this ships one file
// covering 400–900 instead of six static instances.
const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const amiri = Amiri({
  subsets: ['arabic'],
  variable: '--font-amiri',
  display: 'swap',
  weight: ['400', '700'],
})

// Body / UI — clean sans (Latin + Arabic).
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const almarai = Almarai({
  subsets: ['arabic'],
  variable: '--font-almarai',
  display: 'swap',
  weight: ['300', '400', '700', '800'],
})

export const metadata: Metadata = {
  title: 'District 7 · ديستركت 7',
  description: 'Specialty coffee loyalty & subscriptions · ولاء واشتراكات القهوة المختصة',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${playfair.variable} ${amiri.variable} ${inter.variable} ${almarai.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  )
}
