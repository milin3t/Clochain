import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { shortenAddress } from '../api/auth'
import { useAuth } from '../auth/useAuth'
import Button from '../components/Button'

const LoginPage = () => {
  const { connect, disconnect, walletAddress, isAuthenticated, isInitializing } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const redirectPath = (location.state as { from?: string })?.from ?? '/shop'

  const handleConnect = async () => {
    setSubmitting(true)
    setError(null)
    try {
      await connect()
      navigate(redirectPath, { replace: true })
    } catch (err) {
      console.error(err)
      setError('Web3Auth 로그인에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDisconnect = async () => {
    setSubmitting(true)
    try {
      await disconnect()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="rounded-[32px] border border-white/30 bg-dusk text-white shadow-subtle">
      <div className="grid gap-10 p-8 md:grid-cols-2 md:p-12">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.6em] text-white/50">Secure Access</p>
          <h2 className="text-3xl leading-tight">Wallet Login</h2>
          <p className="text-sm text-white/70">
            CloChain Shop은 Web3Auth(OpenLogin) 기반으로 파트너 지갑을 생성하고 Polygon Amoy에 DID를
            연결합니다. 로그인하면 지갑 주소가 곧 did:ethr가 되며 QR 발급 시 ownerWallet 필드로 사용됩니다.
          </p>
          <ul className="space-y-1 text-xs text-white/60">
            <li>· chain: eip155:80002 (Polygon Amoy)</li>
            <li>· session: Web3Auth Modal Pack</li>
            <li>· DID: did:ethr:&lt;walletAddress&gt;</li>
          </ul>
        </div>
        <div className="space-y-6">
          <div className="rounded-[24px] border border-white/30 bg-white/10 p-6">
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">Status</p>
            <p className="mt-2 text-sm text-white">
              {isInitializing
                ? 'Web3Auth 세션을 불러오는 중입니다...'
                : isAuthenticated && walletAddress
                  ? `지갑 연결됨: ${shortenAddress(walletAddress)}`
                  : '지갑에 로그인하면 QR 발급이 활성화됩니다.'}
            </p>
          </div>
          {error && <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}
          <Button
            type="button"
            fullWidth
            variant="light"
            onClick={isAuthenticated ? handleDisconnect : handleConnect}
            disabled={submitting || isInitializing}
          >
            {isAuthenticated ? '로그아웃' : '지갑으로 로그인하기'}
          </Button>
          <p className="text-xs text-white/50">
            로그인 후에는 이전 페이지로 돌아가거나 /shop으로 이동합니다.
          </p>
        </div>
      </div>
    </section>
  )
}

export default LoginPage
