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
