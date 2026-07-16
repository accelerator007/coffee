import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen grid place-items-center px-6 bg-background text-center">
      <div className="max-w-md">
        <p className="text-7xl font-black text-brand mb-4">404</p>
        <h1 className="text-2xl font-black mb-2">الصفحة غير موجودة</h1>
        <p className="text-text-muted mb-6">Page not found · تحقق من الرابط أو ارجع للصفحة الرئيسية.</p>
        <Link href="/" className="inline-flex min-h-11 items-center justify-center rounded-full bg-brand text-background px-6 font-bold">
          العودة للرئيسية · Home
        </Link>
      </div>
    </main>
  )
}
