import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems: Array<{ to: string; label: string }> = [
  { to: '/shop', label: '매장' },
  { to: '/shop/verify', label: 'Verify' },
]

const Header = () => {
  const { walletAddress, login, logout } = useAuth()
  const displayAddress = walletAddress ? walletAddress.slice(0, 6) : ''

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
          {walletAddress ? (
            <div className="flex items-center gap-3 rounded-full bg-ink px-4 py-2 text-[10px] uppercase tracking-[0.3em] text-pearl shadow-sm">
              <span className="font-medium text-pearl/70">지갑</span>
              <span className="font-mono text-sm text-white">{displayAddress}</span>
              <button
                type="button"
                onClick={logout}
                className="rounded-full border border-white/30 px-3 py-1 text-[10px] tracking-[0.2em] text-white transition hover:bg-white/10"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={login}
              className="rounded-full border border-ink/60 px-6 py-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-ink transition hover:bg-ink hover:text-pearl"
            >
              이메일로 지갑 로그인
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
