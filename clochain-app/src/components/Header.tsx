import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { shortenAddress } from '../utils/address'

interface HeaderProps {
  title?: string
  showBack?: boolean
}

const routeTitleMap: Record<string, string> = {
  '/scan': 'QR 스캔',
  '/wardrobe': '나의 옷장',
}

const resolveTitle = (pathname: string, fallback?: string) => {
  if (fallback) return fallback
  const base = pathname.split('?')[0]
  if (base.startsWith('/wardrobe/') && !routeTitleMap[base]) {
    return 'NFT 상세'
  }
  if (base.startsWith('/transfer/')) {
    return '소유권 이전'
  }
  return routeTitleMap[base] ?? 'CloChain'
}

const Header = ({ title, showBack }: HeaderProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { walletAddress, logout } = useAuth()

  const computedTitle = useMemo(() => resolveTitle(location.pathname, title), [location.pathname, title])

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/wardrobe')
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-white/5 bg-[#030712]/90 px-4 py-3 backdrop-blur">
      <div className="flex flex-1 items-center gap-3">
        {(showBack ?? location.pathname !== '/wardrobe') && (
          <button
            type="button"
            onClick={handleBack}
            className="rounded-full border border-white/10 px-3 py-1 text-sm font-medium text-slate-200 transition hover:border-white/40 hover:text-white"
          >
            뒤로
          </button>
        )}
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">CloChain</p>
          <p className="truncate text-lg font-semibold text-white">{computedTitle}</p>
        </div>
      </div>
      {walletAddress ? (
        <div className="ml-4 flex items-center gap-3">
          <div className="hidden flex-col text-right text-xs text-slate-400 sm:flex">
            <span className="uppercase tracking-widest text-[10px] text-slate-500">Wallet</span>
            <span className="font-mono text-sm text-white">{shortenAddress(walletAddress)}</span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/5"
          >
            로그아웃
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="ml-4 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/5"
        >
          로그인
        </button>
      )}
    </header>
  )
}

export default Header
