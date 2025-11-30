import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

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
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-black/5 bg-[#f7f7f7]/95 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-3">
        {(showBack ?? location.pathname !== '/wardrobe') && (
          <button
            type="button"
            onClick={handleBack}
            className="rounded-full border border-black/10 px-3 py-1 text-sm font-medium text-[#111]"
          >
            뒤로
          </button>
        )}
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-black/60">CloChain</p>
          <p className="text-lg font-semibold text-[#111]">{computedTitle}</p>
        </div>
      </div>
      {walletAddress && (
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-full bg-[#111] px-4 py-2 text-sm font-semibold text-white"
        >
          로그아웃
        </button>
      )}
    </header>
  )
}

export default Header
