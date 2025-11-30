import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { useAuth } from '../context/AuthContext'
import { shortenAddress } from '../utils/address'

const LoginPage = () => {
  const { walletAddress, login, logout, isConnecting } = useAuth()
  const navigate = useNavigate()
  const isLoggedIn = Boolean(walletAddress)

  const primaryAction = async () => {
    if (isLoggedIn) {
      navigate('/wardrobe')
      return
    }
    await login()
  }

  const secondaryAction = async () => {
    if (isLoggedIn) {
      await logout()
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#020617] text-slate-50">
      <Header title="Welcome" showBack={false} />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-4 py-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">CloChain App</p>
          <h1 className="mt-3 text-3xl font-semibold leading-snug text-white">
            옷장의 모든 정품 NFT를 모바일에서 관리하세요.
          </h1>
          <p className="mt-4 text-base text-slate-300">
            thirdweb In-App Wallet로 clochain-shop과 동일한 DID를 유지하고 QR을 스캔해 즉시 NFT를 등록합니다.
          </p>
        </div>
        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_25px_60px_rgba(0,0,0,0.45)] backdrop-blur">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">연결된 지갑</p>
          <p className="mt-2 text-xl font-semibold text-white">
            {walletAddress ? shortenAddress(walletAddress, 5) : '연결되지 않음'}
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={primaryAction}
              disabled={isConnecting}
              className="w-full rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 py-4 text-base font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:scale-[1.01] disabled:opacity-60"
            >
              {isLoggedIn ? '나의 옷장으로 이동' : isConnecting ? '로그인 중...' : '이메일로 로그인하기'}
            </button>
            {isLoggedIn && (
              <button
                type="button"
                onClick={secondaryAction}
                className="w-full rounded-2xl border border-white/10 py-4 text-base font-semibold text-white transition hover:border-white/40 hover:bg-white/5"
              >
                로그아웃
              </button>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

export default LoginPage
