export type Lang = 'ar' | 'en'

/** District 7 brand constants (Sohar branch). */
export const brand = {
  name: 'District 7',
  nameAr: 'ديستركت 7',
  tagline: 'Specialty Coffee',
  taglineAr: 'قهوة مختصة',
  location: 'Sohar University, City Center',
  locationAr: 'جامعة صحار، سيتي سنتر',
  shortLocation: 'Sohar · City Center',
  shortLocationAr: 'صحار · سيتي سنتر',
  phone: '+968 9989 9865',
  beans: 'True Roasters',
  beansAr: 'ترو روسترز',
  instagram: '@district7.om',
} as const

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
  // Dashboard — District 7 screens
  welcomeBack: { ar: 'أهلاً', en: 'Welcome back' },
  currentPlan: { ar: 'الباقة الحالية', en: 'Current Plan' },
  memberSince: { ar: 'عضو منذ', en: 'since' },
  thisMonth: { ar: 'هذا الشهر', en: 'This month' },
  cups: { ar: 'كوب', en: 'cups' },
  todaysCups: { ar: 'أكواب اليوم', en: "Today's cups" },
  leftToday: { ar: 'متبقٍ اليوم', en: 'left today' },
  myCode: { ar: 'رمزي', en: 'My Code' },
  scanToRedeem: { ar: 'امسح الرمز لاستلام قهوتك', en: 'Scan at the counter to redeem your cup' },
  showToStaff: { ar: 'اعرضه للموظف لتسجيل كوبك', en: 'Show to staff to redeem your cup' },
  contactToSubscribe: { ar: 'تواصل معنا للاشتراك', en: 'Contact us to subscribe' },
  fromOurFeed: { ar: 'من حسابنا', en: 'From our feed' },
  beansBy: { ar: 'حبوب من ترو روسترز', en: 'Beans by True Roasters' },
  // Scan — staff
  redeemCup: { ar: 'تسجيل كوب', en: 'Redeem a cup' },
  alignQr: { ar: 'وجّه رمز العميل داخل الإطار', en: "Align the customer's QR within the frame" },
  readyToRead: { ar: 'جاهز للقراءة', en: 'Ready to read' },
  holdCard: { ar: 'قرّب بطاقة العضو من الجهاز', en: 'Hold the member card near the device' },
  cupRedeemed: { ar: 'تم تسجيل الكوب', en: 'Cup redeemed' },
  cupLogged: { ar: 'تم تسجيل ‎+1 كوب', en: '+1 cup logged' },
  // Admin — District 7
  today: { ar: 'اليوم', en: 'Today' },
  revenue: { ar: 'الإيرادات (شهرياً)', en: 'Revenue (mo.)' },
  activePlans: { ar: 'الباقات الفعّالة', en: 'Active plans' },
  cupsToday: { ar: 'أكواب اليوم', en: 'Cups today' },
  totalCustomers: { ar: 'إجمالي العملاء', en: 'Total customers' },
  cupsPerDay: { ar: 'الأكواب يومياً', en: 'Cups per day' },
  thisWeek: { ar: 'هذا الأسبوع', en: 'This week' },
  // Tiers
  tierGold: { ar: 'ذهبية', en: 'Gold' },
  tierSilver: { ar: 'فضية', en: 'Silver' },
  tierBronze: { ar: 'برونزية', en: 'Bronze' },
  tier: { ar: 'الفئة', en: 'Tier' },
  // Cards
  cards: { ar: 'البطاقات', en: 'Cards' },
  addCard: { ar: 'بطاقة جديدة', en: 'New Card' },
  cardNumber: { ar: 'رقم البطاقة', en: 'Card Number' },
  cardLabel: { ar: 'وصف البطاقة', en: 'Label' },
  linkedCustomer: { ar: 'العميل المرتبط', en: 'Linked Customer' },
  unassigned: { ar: 'غير مرتبطة', en: 'Unassigned' },
  lost: { ar: 'مفقودة', en: 'Lost' },
  blocked: { ar: 'محظورة', en: 'Blocked' },
  activateCard: { ar: 'تفعيل', en: 'Activate' },
  cardExists: { ar: 'رقم البطاقة مستخدم مسبقاً', en: 'Card number already exists' },
  noCards: { ar: 'لا توجد بطاقات بعد', en: 'No cards yet' },
  searchCards: { ar: 'ابحث برقم البطاقة أو اسم العميل', en: 'Search by card or customer' },
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
