export type Lang = 'ar' | 'en'

const translations = {
  // Auth
  login: { ar: 'تسجيل الدخول', en: 'Login' },
  customer: { ar: 'عميل', en: 'Customer' },
  staff: { ar: 'موظف', en: 'Staff' },
  phone: { ar: 'رقم الهاتف', en: 'Phone Number' },
  sendOtp: { ar: 'إرسال الرمز', en: 'Send OTP' },
  enterOtp: { ar: 'أدخل الرمز', en: 'Enter OTP' },
  verify: { ar: 'تحقق', en: 'Verify' },
  username: { ar: 'اسم المستخدم', en: 'Username' },
  password: { ar: 'كلمة المرور', en: 'Password' },
  signIn: { ar: 'دخول', en: 'Sign In' },
  logout: { ar: 'خروج', en: 'Logout' },
  // Dashboard
  mySubscription: { ar: 'اشتراكي', en: 'My Subscription' },
  active: { ar: 'نشط', en: 'Active' },
  expired: { ar: 'منتهي', en: 'Expired' },
  daysLeft: { ar: 'أيام متبقية', en: 'Days Left' },
  dailyAllowance: { ar: 'الكوبات اليومية', en: 'Daily Allowance' },
  cupsRemaining: { ar: 'كوب متبقي', en: 'cups remaining' },
  myQR: { ar: 'رمز QR الخاص بي', en: 'My QR Code' },
  noSubscription: { ar: 'لا يوجد اشتراك نشط', en: 'No active subscription' },
  // Scan
  scanTitle: { ar: 'مسح رمز QR', en: 'Scan QR Code' },
  scanInstruction: { ar: 'وجّه الكاميرا نحو رمز QR للعميل', en: 'Point camera at customer QR code' },
  customerInfo: { ar: 'معلومات العميل', en: 'Customer Info' },
  recordRedemption: { ar: 'تسجيل كوب', en: 'Record Cup' },
  redemptionSuccess: { ar: 'تم تسجيل الكوب بنجاح', en: 'Cup recorded successfully' },
  limitReached: { ar: 'تم استنفاد الحصة اليومية', en: 'Daily limit reached' },
  invalidQR: { ar: 'رمز QR غير صالح', en: 'Invalid QR code' },
  scanAgain: { ar: 'مسح مجدداً', en: 'Scan Again' },
  // Admin
  dashboard: { ar: 'لوحة التحكم', en: 'Dashboard' },
  totalSubscribers: { ar: 'إجمالي المشتركين', en: 'Total Subscribers' },
  activeSubscribers: { ar: 'المشتركون النشطون', en: 'Active Subscribers' },
  expiredSubscribers: { ar: 'المشتركون المنتهون', en: 'Expired Subscribers' },
  totalRedemptions: { ar: 'إجمالي الاسترداد', en: 'Total Redemptions' },
  byPackage: { ar: 'حسب الباقة', en: 'By Package' },
  packageName: { ar: 'الباقة', en: 'Package' },
  subscribers: { ar: 'مشتركون', en: 'Subscribers' },
  redemptions: { ar: 'استرداد', en: 'Redemptions' },
  trend: { ar: 'آخر 30 يوم', en: 'Last 30 Days' },
  customers: { ar: 'العملاء', en: 'Customers' },
  searchCustomers: { ar: 'ابحث بالاسم أو الهاتف', en: 'Search by name or phone' },
  name: { ar: 'الاسم', en: 'Name' },
  timesUsed: { ar: 'مرات الاستخدام', en: 'Times Used' },
  // Common
  loading: { ar: 'جارٍ التحميل...', en: 'Loading...' },
  error: { ar: 'حدث خطأ', en: 'An error occurred' },
  back: { ar: 'رجوع', en: 'Back' },
  search: { ar: 'بحث', en: 'Search' },
} satisfies Record<string, { ar: string; en: string }>

export type TranslationKey = keyof typeof translations

export function t(key: TranslationKey, lang: Lang): string {
  return translations[key][lang]
}
