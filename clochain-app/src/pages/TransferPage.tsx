import { type FormEvent, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import Header from '../components/Header'
import { transferNFT } from '../api/nft'
import { useAuth } from '../context/AuthContext'

const TransferPage = () => {
  const { tokenId = '' } = useParams()
  const { walletAddress } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [recipient, setRecipient] = useState('')
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const nftName = (location.state as { nft?: { brand?: string; productId?: string } } | undefined)?.nft
  const label = nftName ? `${nftName.brand ?? ''} ${nftName.productId ?? ''}`.trim() : `Token #${tokenId}`

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!walletAddress) return
    if (!recipient) {
      setStatus('error')
      setMessage('받는 지갑 주소 또는 이메일을 입력하세요.')
      return
    }
    setStatus('pending')
    setMessage('소유권 이전을 진행합니다...')
    try {
      await transferNFT(tokenId, recipient, walletAddress)
      setStatus('success')
      setMessage('이전 요청을 완료했습니다. 블록체인 트랜잭션을 확인하세요.')
      setRecipient('')
      setTimeout(() => navigate(`/wardrobe/${tokenId}`), 1200)
    } catch (error) {
      console.error(error)
      setStatus('error')
      setMessage('이전에 실패했습니다. 지갑 주소를 확인하고 다시 시도하세요.')
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f7f7]">
      <Header title="소유권 이전" />
      <main className="flex-1 px-4 py-6">
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-black/50">이전할 NFT</p>
          <p className="mt-1 text-xl font-semibold text-[#111]">{label}</p>
          <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
            <label className="text-sm font-medium text-black/60">
              받는 지갑 주소 또는 이메일(추후 DID)
              <input
                type="text"
                value={recipient}
                onChange={(event) => setRecipient(event.target.value)}
                placeholder="0x... 또는 user@example.com"
                className="mt-2 w-full rounded-2xl border border-black/10 bg-[#f7f7f7] px-4 py-3 text-base text-[#111] focus:outline-none focus:ring-2 focus:ring-black/20"
              />
            </label>
            <button
              type="submit"
              disabled={status === 'pending'}
              className="rounded-2xl bg-[#111] py-4 text-base font-semibold text-white disabled:opacity-60"
            >
              {status === 'pending' ? '이전 중...' : '이전하기'}
            </button>
          </form>
          {status !== 'idle' && (
            <p
              className={`mt-4 text-sm ${
                status === 'success' ? 'text-green-600' : status === 'error' ? 'text-red-600' : 'text-black/60'
              }`}
            >
              {message}
            </p>
          )}
        </section>
      </main>
    </div>
  )
}

export default TransferPage
