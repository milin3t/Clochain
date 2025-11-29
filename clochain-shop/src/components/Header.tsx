import { NavLink } from 'react-router-dom'

const navItems: Array<{ to: string; label: string }> = [
  { to: '/shop', label: 'Maison' },
  { to: '/shop/issue', label: 'Issue' },
  { to: '/shop/verify', label: 'Verify' },
  { to: '/shop/login', label: 'Login' },
]

const Header = () => {
  return (
    <header className="sticky top-0 z-20 border-b border-white/20 bg-pearl/80 backdrop-blur">
      <div className="page-shell flex flex-col items-center gap-3 py-6 text-center sm:flex-row sm:justify-between">
        <NavLink
          to="/shop"
          className="text-lg uppercase tracking-[0.6em] text-ink"
        >
          CloChain Shop
        </NavLink>
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
      </div>
    </header>
  )
}

export default Header
