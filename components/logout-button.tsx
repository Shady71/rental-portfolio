import { logout } from '@/app/logout/actions'

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="rounded-md border border-edge-strong px-3 py-1.5 text-sm font-medium text-body transition-colors hover:bg-surface-raised hover:text-heading"
      >
        Log out
      </button>
    </form>
  )
}
