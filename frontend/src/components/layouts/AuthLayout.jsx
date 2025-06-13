import { Link, Outlet } from 'react-router'

function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-muted/30 via-background to-muted px-4 py-8">
      <div className="w-full max-w-md bg-background border border-border rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">
        <header className="text-center">
          <Link to="/" className="text-3xl font-bold tracking-tight text-primary hover:opacity-90 transition">
            Your Logo
          </Link>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back! Please sign in or create an account.
          </p>
        </header>

        <main>
          <Outlet />
        </main>

        <footer className="text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Your Company. All rights reserved.
        </footer>
      </div>
    </div>
  )
}

export default AuthLayout