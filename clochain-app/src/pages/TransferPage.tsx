import { type FormEvent, useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useActiveAccount } from 'thirdweb/react'
import Header from '../components/Header'
import { recordNFTTransfer } from '../api/nft'
import { transferAuthenticityNFT } from '../lib/nftActions'
import { useAuth } from '../context/AuthContext'

const normalizeWalletInput = (value: string) => {
  const trimmed = value.trim()
  if (trimmed.startsWith('did:ethr:')) {
    return trimmed.slice('did:ethr:'.length).toLowerCase()
  }
  return trimmed.toLowerCase()
}

const TransferPage = () => {
  const { tokenId = '' } = useParams()
  const { walletAddress, ensureSession } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const account = useActiveAccount()
  const [recipient, setRecipient] = useState('')
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [toast, setToast] = useState<{ type: 'info' | 'error'; text: string } | null>(null)
  const nftName = (location.state as { nft?: { brand?: string; productId?: string } } | undefined)?.nft
  const label = nftName ? `${nftName.brand ?? ''} ${nftName.productId ?? ''}`.trim() : `Token #${tokenId}`

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(timer)
  }, [toast])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!walletAddress) return
    if (!recipient) {
      setStatus('error')
      setMessage('받는 지갑 주소 또는 이메일을 입력하세요.')
      return
    }
    const normalized = normalizeWalletInput(recipient)
    if (!/^0x[a-fA-F0-9]{40}$/.test(normalized)) {
      setStatus('error')
      setMessage('0x로 시작하는 지갑 주소 또는 did:ethr: 형식만 지원합니다.')
      return
    }
    setStatus('pending')
    setMessage('소유권 이전을 진행합니다...')
    try {
      const sessionToken = await ensureSession()
      if (!account) {
        throw new Error('WALLET_REQUIRED')
      }
      const { txHash, blockNumber } = await transferAuthenticityNFT({
        tokenId,
        fromWallet: walletAddress,
        toWallet: normalized,
        account,
      })
      await recordNFTTransfer(
        {
          tokenId,
          fromWallet: walletAddress,
          toWallet: normalized,
          txHash,
          blockNumber,
        },
        sessionToken,
      )
      setStatus('success')
      setMessage('이전 요청을 완료했습니다. 블록체인 트랜잭션을 확인하세요.')
      setRecipient('')
      setTimeout(() => navigate(`/wardrobe/${tokenId}`), 1200)
    } catch (error) {
      console.error(error)
      setStatus('error')
      const messageText = error instanceof Error ? error.message.toLowerCase() : ''
      let detail = '이전에 실패했습니다. 지갑 주소를 확인하고 다시 시도하세요.'
      if (error instanceof Error) {
        if (error.message === 'WALLET_REQUIRED') {
          detail = '지갑 연결이 필요합니다. 로그인 후 다시 시도하세요.'
        } else if (error.message === 'WALLET_MISMATCH') {
          detail = '현재 로그인한 지갑이 NFT 소유자와 다릅니다.'
        } else if (error.message === 'INVALID_TOKEN_ID') {
          detail = '잘못된 토큰 ID입니다. 다시 시도하세요.'
        } else if (messageText.includes('insufficient funds')) {
          detail = '가스비가 부족합니다. Polygon Amoy MATIC을 지갑에 충전한 뒤 다시 시도하세요.'
          setToast({ type: 'error', text: '가스비 잔고가 부족합니다.' })
        }
      }
      setMessage(detail)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#020617] text-slate-50">
      <Header title="소유권 이전" />
      <main className="flex-1 px-4 py-6">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_25px_60px_rgba(0,0,0,0.45)] backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">이전할 NFT</p>
          <p className="mt-1 text-xl font-semibold text-white">{label}</p>
          <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
            <label className="text-sm font-medium text-slate-300">
              받는 지갑 주소 또는 이메일(추후 DID)
              <input
                type="text"
                value={recipient}
                onChange={(event) => setRecipient(event.target.value)}
                placeholder="0x... 또는 user@example.com"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-base text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-white/40"
              />
            </label>
            <button
              type="submit"
              disabled={status === 'pending'}
              className="rounded-2xl bg-gradient-to-r from-purple-500 to-blue-500 py-4 text-base font-semibold text-white shadow-lg shadow-purple-500/25 disabled:opacity-60"
            >
              {status === 'pending' ? '이전 중...' : '이전하기'}
            </button>
          </form>
          {status !== 'idle' && (
            <p
              className={`mt-4 text-sm ${
                status === 'success'
                  ? 'text-emerald-300'
                  : status === 'error'
                    ? 'text-rose-300'
                    : 'text-slate-300'
              }`}
            >
              {message}
            </p>
          )}
        </section>
      </main>
      {toast && (
        <div
          className={`pointer-events-none fixed inset-x-0 bottom-6 mx-auto w-[90%] max-w-sm rounded-2xl px-4 py-3 text-center text-sm font-semibold transition ${
            toast.type === 'error'
              ? 'bg-rose-500/90 text-white shadow-[0_10px_30px_rgba(244,63,94,0.4)]'
              : 'bg-slate-700/90 text-white'
          }`}
        >
          {toast.text}
        </div>
      )}
    </div>
  )
}

export default TransferPage
