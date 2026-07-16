export type PhoneResult =
  | { ok: true; international: string; local: string }
  | { ok: false; error: 'invalid' }

/** Normalize an Oman mobile number to +968XXXXXXXX. */
export function normalizeOmanPhone(input: string): PhoneResult {
  let digits = input.replace(/\D/g, '')

  if (digits.startsWith('968')) digits = digits.slice(3)
  if (digits.startsWith('0')) digits = digits.slice(1)

  if (!/^[79]\d{7}$/.test(digits)) {
    return { ok: false, error: 'invalid' }
  }

  return {
    ok: true,
    local: digits,
    international: `+968${digits}`,
  }
}

/**
 * Supabase Auth stores phone customers as internal email users.
 * Keep the address RFC/Auth-safe by avoiding a leading "+" in the local part
 * and by using a normal domain instead of ".local".
 */
export function phoneAuthEmail(localOrInternational: string) {
  const digits = localOrInternational.replace(/\D/g, '')
  const withCountryCode = digits.startsWith('968') ? digits : `968${digits}`
  return `${withCountryCode}@phone.district7.app`
}

/** Legacy format used before the safe internal email format. */
export function legacyPhoneAuthEmail(international: string) {
  return `${international}@phone.local`
}

/** Legacy safe format used before the Auth-valid phone domain. */
export function legacySafePhoneAuthEmail(localOrInternational: string) {
  const digits = localOrInternational.replace(/\D/g, '')
  const withCountryCode = digits.startsWith('968') ? digits : `968${digits}`
  return `${withCountryCode}@phone.local`
}

/** Username-based employee accounts use an internal but Auth-valid email. */
export function staffAuthEmail(username: string) {
  return `${username.trim().toLowerCase()}@staff.district7.app`
}

/** Legacy staff domain used before Auth-valid internal addresses. */
export function legacyStaffAuthEmail(username: string) {
  return `${username.trim().toLowerCase()}@internal.local`
}
