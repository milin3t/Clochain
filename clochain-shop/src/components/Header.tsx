import { NavLink, useNavigate } from 'react-router-dom'
import { shortenAddress } from '../api/auth'
import { useAuth } from '../auth/useAuth'

const navItems: Array<{ to: string; label: string }> = [
  { to: '/shop', label: 'Maison' },
  { to: '/shop/verify', label: 'Verify' },
]

const Header = () => {
  const navigate = useNavigate()
  const { walletAddress, isAuthenticated, isInitializing, disconnect } = useAuth()

  const handleLogout = async () => {
    await disconnect()
  }

  return (
    <header className="sticky top-0 z-20 border-b border-white/20 bg-pearl/80 backdrop-blur">
      <div className="page-shell flex flex-col gap-3 py-6 text-center sm:flex-row sm:items-center sm:justify-between">
        <NavLink
          to="/shop"
          className="text-lg uppercase tracking-[0.6em] text-ink"
        >
          CloChain Shop
        </NavLink>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-6">
          <nav className="flex items-center gap-3 text-xs tracking-[0.3em] uppercase text-gray-500">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-full px-3 py-2 transition hover:text-ink ${
                    isActive ? 'text-ink' : ''
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2 rounded-full border border-ink/10 bg-white/60 px-4 py-2 text-left text-xs uppercase tracking-[0.2em] text-gray-600">
            {isAuthenticated && walletAddress ? (
              <>
                <span className="font-medium text-gray-500">Wallet</span>
                <span className="font-mono text-sm text-ink">{shortenAddress(walletAddress)}</span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-full border border-transparent px-3 py-1 text-[10px] tracking-[0.2em] text-ink transition hover:border-ink/40"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/shop/login')}
                className="rounded-full bg-ink px-4 py-2 text-[10px] tracking-[0.3em] text-pearl transition hover:bg-dusk"
                disabled={isInitializing}
              >
                {isInitializing ? 'Loading...' : 'Wallet Login'}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
