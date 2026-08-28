'use client'

import Link from 'next/link'
import { use, useActionState } from 'react'
import { login, type LoginState } from './actions'

const initialState: LoginState = {}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error: linkError } = use(searchParams)
  const [state, formAction, pending] = useActionState(login, initialState)

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 px-4">
      <h1 className="text-2xl font-semibold text-accent">
        Log in
      </h1>

      {linkError === 'confirmation_failed' && (
        <p role="alert" className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger-text">
          That confirmation link is invalid or has expired. Please try logging in, or sign up again.
        </p>
      )}

      <form action={formAction} className="flex flex-col gap-4">
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
            autoComplete="current-password"
            className="rounded-md border border-edge-strong bg-surface-raised px-3 py-2 text-sm text-heading focus:border-accent focus:outline-none   "
          />
        </div>

        {state.error && (
          <p
            role="alert"
            className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger-text"
          >
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-accent-strong px-3 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent disabled:opacity-50"
        >
          {pending ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p className="text-sm text-muted ">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="font-medium text-heading underline ">
          Sign up
        </Link>
      </p>
    </main>
  )
}
