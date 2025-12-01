import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { useAuth } from '../context/AuthContext'

const NotFoundPage = () => {
  const { walletAddress } = useAuth()
  const navigate = useNavigate()
  const buttonLabel = useMemo(() => (walletAddress ? '브랜드 대시보드로 이동' : 'Shop 홈으로 이동'), [walletAddress])

  return (
    <div className="min-h-screen bg-pearl text-ink">
      <Header />
      <main className="page-shell flex flex-1 flex-col items-center justify-center py-24 text-center">
        <p className="text-7xl font-serif italic text-gray-300">404</p>
        <h1 className="mt-6 text-3xl font-semibold">페이지를 찾을 수 없습니다</h1>
        <p className="mt-3 max-w-xl text-base text-gray-500">
          요청하신 URL이 존재하지 않거나 이동되었습니다. 올바른 링크인지 확인하거나 아래 버튼으로 돌아가세요.
        </p>
        <button
          type="button"
          className="mt-8 rounded-full border border-ink px-8 py-3 text-sm font-semibold uppercase tracking-widest text-ink transition hover:bg-ink hover:text-pearl"
          onClick={() => navigate(walletAddress ? '/shop' : '/', { replace: true })}
        >
          {buttonLabel}
        </button>
      </main>
    </div>
  )
}

export default NotFoundPage
