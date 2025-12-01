import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { useAuth } from '../context/AuthContext'

const NotFoundPage = () => {
  const { walletAddress } = useAuth()
  const navigate = useNavigate()
  const buttonLabel = useMemo(() => (walletAddress ? '옷장으로 돌아가기' : '로그인 페이지로 이동'), [walletAddress])
  const targetPath = walletAddress ? '/wardrobe' : '/login'

  return (
    <div className="flex min-h-screen flex-col bg-[#020617] text-slate-50">
      <Header title="페이지를 찾을 수 없습니다" />
      <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <p className="text-6xl font-bold text-slate-700">404</p>
        <p className="mt-4 text-lg text-slate-300">
          요청하신 페이지를 찾지 못했습니다. 링크가 올바른지 확인해주세요.
        </p>
        <button
          type="button"
          className="mt-8 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:scale-[1.02]"
          onClick={() => navigate(targetPath, { replace: true })}
        >
          {buttonLabel}
        </button>
      </main>
    </div>
  )
}

export default NotFoundPage
