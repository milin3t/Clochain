import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import NFTCard from '../components/NFTCard'
import { fetchMyNFTs, type NFTItem } from '../api/nft'
import { useAuth } from '../context/AuthContext'
import { shortenAddress } from '../utils/address'

const WardrobePage = () => {
  const { walletAddress, ensureSession } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState<NFTItem[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')

  useEffect(() => {
    if (!walletAddress) return
    let mounted = true
    const load = async () => {
      setStatus('loading')
      try {
        const sessionToken = await ensureSession()
        const data = await fetchMyNFTs(sessionToken)
        if (mounted) {
          setItems(data)
          setStatus('ready')
        }
      } catch (error) {
        console.error(error)
        if (mounted) {
          setStatus('error')
        }
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [ensureSession, walletAddress])

  const emptyStateText = useMemo(() => {
    if (status === 'loading') return '내 NFT 옷장을 불러오는 중입니다...'
    if (status === 'error') return '목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'
    return '아직 등록된 NFT가 없습니다. QR을 스캔해 첫 정품을 등록하세요.'
  }, [status])

  const handleCardClick = (nft: NFTItem) => {
    navigate(`/wardrobe/${nft.tokenId}`, { state: { nft } })
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#020617] text-slate-50">
      <Header title="Wardrobe" />
      <main className="flex-1 px-4 py-6">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">내 지갑</p>
              <p className="mt-1 text-xl font-semibold text-white">
                {walletAddress ? shortenAddress(walletAddress, 5) : '지갑 연결 필요'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/scan')}
              className="rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:scale-[1.02]"
            >
              QR 스캔
            </button>
          </div>
        </section>
        <section className="mt-6">
          <h2 className="text-lg font-semibold text-white">나의 옷장</h2>
          {items.length === 0 && (
            <p className="mt-4 rounded-2xl border border-dashed border-white/15 bg-white/5 p-5 text-sm text-slate-300">
              {emptyStateText}
            </p>
          )}
          {items.length > 0 && (
            <div className="mt-4 grid grid-cols-1 gap-4">
              {items.map((nft) => (
                <NFTCard key={nft.tokenId} nft={nft} onClick={() => handleCardClick(nft)} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default WardrobePage
