import type { AuthError } from '@supabase/supabase-js'

export function mapAuthError(error: AuthError): string {
  switch (error.code) {
    case 'invalid_credentials':
      return 'Incorrect email or password.'
    case 'email_exists':
    case 'user_already_exists':
      return 'This email is already registered. Try logging in instead.'
    case 'weak_password':
      return 'Password is too weak. Use at least 6 characters.'
    case 'email_not_confirmed':
      return 'Please confirm your email before logging in.'
    case 'validation_failed':
    case 'email_address_invalid':
      return 'Please check your email and password and try again.'
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Too many attempts. Please wait a moment and try again.'
    default:
      return error.message || 'Something went wrong. Please try again.'
  }
}
