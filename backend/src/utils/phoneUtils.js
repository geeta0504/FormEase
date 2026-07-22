import { parsePhoneNumberFromString } from "libphonenumber-js";

/**
 * Normalizes any phone number input to E.164 format (e.g. +919876543210).
 * Defaults to India if no country code is given, since your current userbase
 * is mostly Indian numbers — but properly handles international numbers too.
 *
 * @param {string} rawPhone
 * @returns {string|null} normalized phone, or null if invalid
 */
export function normalizePhone(rawPhone) {
  if (!rawPhone) return null;

  const phone = parsePhoneNumberFromString(rawPhone, "IN"); // "IN" = default country if no + prefix given

  if (!phone || !phone.isValid()) {
    return null;
  }

  return phone.number; // always returns E.164 format, e.g. "+919876543210"
}