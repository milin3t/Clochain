import QRCode from 'qrcode'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import Header from '../components/Header'
import { fetchMyNFTs, type NFTItem } from '../api/nft'
import { useAuth } from '../context/AuthContext'
import { fetchMetadata, type NFTMetadata } from '../utils/metadata'

const NFTDetailPage = () => {
  const { tokenId = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { walletAddress, ensureSession } = useAuth()
  const passedNft = (location.state as { nft?: NFTItem } | undefined)?.nft
  const [nft, setNft] = useState<NFTItem | null>(passedNft ?? null)
  const [metadata, setMetadata] = useState<NFTMetadata | null>(null)
  const [qrImage, setQrImage] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (nft || !walletAddress) return
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const sessionToken = await ensureSession()
        const data = await fetchMyNFTs(sessionToken)
        if (!mounted) return
        const found = data.find((item) => item.tokenId === tokenId)
        if (found) {
          setNft(found)
        }
      } catch (error) {
        console.error(error)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [ensureSession, nft, tokenId, walletAddress])

  useEffect(() => {
    if (!nft?.tokenURI) return
    let cancelled = false
    const loadMetadata = async () => {
      const meta = await fetchMetadata(nft.tokenURI)
      if (!cancelled) {
        setMetadata(meta)
      }
    }
    loadMetadata()
    return () => {
      cancelled = true
    }
  }, [nft?.tokenURI])

  useEffect(() => {
    const payload = metadata?.external_url ?? `https://clochain-shop.vercel.app/shop/verify?q=${tokenId}`
    let cancelled = false
    const generateQR = async () => {
      try {
        const dataUrl = await QRCode.toDataURL(payload, { width: 512, margin: 1 })
        if (!cancelled) {
          setQrImage(dataUrl)
        }
      } catch (error) {
        console.error('QR encode failed', error)
      }
    }
    generateQR()
    return () => {
      cancelled = true
    }
  }, [metadata?.external_url, tokenId])

  const name = useMemo(() => metadata?.name ?? `${nft?.brand ?? ''} ${nft?.productId ?? ''}`.trim(), [metadata?.name, nft?.brand, nft?.productId])

  return (
    <div className="flex min-h-screen flex-col bg-[#020617] text-slate-50">
      <Header title="NFT 상세" />
      <main className="flex-1 px-4 py-6">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_25px_60px_rgba(0,0,0,0.45)] backdrop-blur">
          <p className="text-sm font-semibold text-slate-400">#{tokenId}</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">{name || '로딩 중...'}</h1>
          <div className="mt-6 flex flex-col items-center justify-center gap-4">
            {qrImage ? (
              <img src={qrImage} alt="NFT QR" className="h-64 w-64 rounded-2xl border border-white/10 bg-white/10 p-4" />
            ) : (
              <div className="flex h-64 w-64 items-center justify-center rounded-2xl border border-dashed border-white/20 text-sm text-slate-300">
                QR 생성 중...
              </div>
            )}
            <p className="text-center text-sm text-slate-300">
              이 제품은 블록체인 전자증명으로 인증된 정품입니다.
            </p>
          </div>
          <div className="mt-8 flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-slate-200">
            <p>브랜드: {nft?.brand ?? '알 수 없음'}</p>
            <p>제품코드: {nft?.productId ?? '-'}</p>
            <p className="break-all text-xs text-slate-400">tokenURI: {nft?.tokenURI ?? '-'}</p>
          </div>
        </section>
        <button
          type="button"
          onClick={() => navigate(`/transfer/${tokenId}`, { state: { nft, metadata } })}
          disabled={loading}
          className="mt-6 w-full rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 py-4 text-center text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/30 disabled:opacity-50"
        >
          소유권 이전하기
        </button>
      </main>
    </div>
  )
}

export default NFTDetailPage
