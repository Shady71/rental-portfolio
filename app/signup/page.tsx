'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { signup, type SignupState } from './actions'

const initialState: SignupState = {}

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signup, initialState)

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 px-4">
      <h1 className="text-2xl font-semibold text-accent">
        Sign up
      </h1>

      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="full_name" className="text-sm font-medium text-body ">
            Full name
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            required
            autoComplete="name"
            className="rounded-md border border-edge-strong bg-surface-raised px-3 py-2 text-sm text-heading focus:border-accent focus:outline-none   "
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium text-body ">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="rounded-md border border-edge-strong bg-surface-raised px-3 py-2 text-sm text-heading focus:border-accent focus:outline-none   "
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm font-medium text-body ">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className="rounded-md border border-edge-strong bg-surface-raised px-3 py-2 text-sm text-heading focus:border-accent focus:outline-none   "
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="role" className="text-sm font-medium text-body ">
            I am a
          </label>
          <select
            id="role"
            name="role"
            required
            defaultValue=""
            className="rounded-md border border-edge-strong bg-surface-raised px-3 py-2 text-sm text-heading focus:border-accent focus:outline-none   "
          >
            <option value="" disabled>
              Select a role
            </option>
            <option value="landlord">Landlord</option>
            <option value="tenant">Tenant</option>
          </select>
        </div>

        {state.error && (
          <p
            role="alert"
            className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger-text"
          >
            {state.error}
          </p>
        )}
        {state.info && (
          <p
            role="status"
            className="rounded-md bg-info-bg px-3 py-2 text-sm text-info-text"
          >
            {state.info}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-accent-strong px-3 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent disabled:opacity-50"
        >
          {pending ? 'Creating account…' : 'Sign up'}
        </button>
      </form>

      <p className="text-sm text-muted ">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-heading underline ">
          Log in
        </Link>
      </p>
    </main>
  )
}
