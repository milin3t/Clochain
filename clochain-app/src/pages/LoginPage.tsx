import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { useAuth } from '../context/AuthContext'

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
    <div className="flex min-h-screen flex-col bg-[#f7f7f7] text-[#111]">
      <Header title="Welcome" showBack={false} />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-4 py-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-black/50">CloChain App</p>
          <h1 className="mt-3 text-3xl font-semibold leading-snug">옷장의 모든 정품 NFT를 모바일에서 관리하세요.</h1>
          <p className="mt-4 text-base text-black/60">
            thirdweb Email OTP Embedded Wallet을 사용하여 clochain-shop과 동일한 DID로 로그인합니다.
          </p>
        </div>
        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-black/60">연결된 지갑</p>
          <p className="mt-2 text-xl font-semibold">{walletAddress ?? '연결되지 않음'}</p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={primaryAction}
              disabled={isConnecting}
              className="w-full rounded-2xl bg-[#111] py-4 text-base font-semibold text-white disabled:opacity-60"
            >
              {isLoggedIn ? '나의 옷장으로 이동' : isConnecting ? '로그인 중...' : '이메일로 로그인하기'}
            </button>
            {isLoggedIn && (
              <button
                type="button"
                onClick={secondaryAction}
                className="w-full rounded-2xl border border-black/10 py-4 text-base font-semibold"
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
