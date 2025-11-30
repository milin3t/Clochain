import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import axios from 'axios'
import Button from '../components/Button'
import QRPlaceholder from '../components/QRPlaceholder'
import { issueProduct } from '../api/issue'
import { useAuth } from '../context/AuthContext'
import { findBrand, findProduct } from '../data/brands'
import type { IssueResponse } from '../types/issue'

const ProductPage = () => {
  const { brand: brandSlug, productId } = useParams<{ brand?: string; productId?: string }>()
  const brand = brandSlug ? findBrand(brandSlug) : undefined
  const product = brand && productId ? findProduct(brand.slug, productId) : null
  const { walletAddress, login, sessionToken, ensureSession } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [result, setResult] = useState<IssueResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  if (!walletAddress) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-gray-500">지갑 DID 로그인이 필요합니다.</p>
        <Button type="button" onClick={login}>
          Wallet Login
        </Button>
      </div>
    )
  }

  if (!brand || !product) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-gray-500">상품을 찾을 수 없습니다.</p>
        <Button as={Link} to={`/shop/${brandSlug || ''}`} variant="muted">
          Back to collection
        </Button>
      </div>
    )
  }

  function closeModal() {
    setIsModalOpen(false)
    setError(null)
    setLoading(false)
    setResult(null)
    setCopied(false)
  }

  function handlePurchase() {
    setIsModalOpen(true)
    void issueForProduct()
  }

  async function issueForProduct() {
    if (!walletAddress || !brand || !product) return
    setLoading(true)
    setError(null)
    setResult(null)
    setCopied(false)
    try {
      const token = sessionToken ?? (await ensureSession())
      const response = await issueProduct(
        {
          brand: brand.slug,
          productId: product.id,
          purchaseAt: new Date().toISOString(),
        },
        token,
      )
      setResult(response)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const detail =
          (err.response?.data as { detail?: string })?.detail ||
          'QR 발급 중 문제가 발생했습니다.'
        setError(detail)
      } else if (err instanceof Error) {
        if (err.message === 'WALLET_REQUIRED') {
          setError('지갑 세션을 확인할 수 없습니다. 다시 로그인해주세요.')
        } else if (err.message === 'SIGNING_UNAVAILABLE') {
          setError('지갑 서명이 지원되지 않습니다. 연결을 재설정한 뒤 다시 시도해주세요.')
        } else {
          setError(err.message || '알 수 없는 오류로 실패했습니다.')
        }
      } else {
        setError('알 수 없는 오류로 실패했습니다.')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    if (!result?.short_token) return
    try {
      await navigator.clipboard.writeText(result.short_token)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('클립보드에 복사할 수 없습니다.')
    }
  }

  return (
    <>
      <section className="grid gap-10 md:grid-cols-2">
        <div className="flex min-h-[360px] items-center justify-center rounded-[32px] border border-white/40 bg-gradient-to-br from-beige to-sand text-sm uppercase tracking-[0.6em] text-gray-500">
          NO IMAGE
        </div>
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.5em] text-gray-500">{brand.name}</p>
            <h2 className="text-4xl tracking-[0.3em]">{product.name}</h2>
            <p className="text-sm text-gray-600">{product.description}</p>
          </div>
          <div className="text-sm uppercase tracking-[0.5em] text-ink">{product.price}</div>
          <div className="rounded-[24px] border border-ink/10 bg-white/60 p-6 text-sm text-gray-600">
            Self-registration ready. QR issuance will mint proof-of-origin NFT once linked to the
            CloChain server.
          </div>
          <Button type="button" className="w-full md:w-auto" onClick={handlePurchase}>
            PURCHASE
          </Button>
          <Button as={Link} to={`/shop/${brand.slug}`} variant="muted">
            Back to {brand.name}
          </Button>
        </div>
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-4 py-10">
          <div className="relative w-full max-w-4xl rounded-[32px] border border-white/40 bg-white/95 p-8 shadow-2xl">
            <button
              type="button"
              onClick={closeModal}
              className="absolute right-6 top-6 text-2xl text-gray-400 transition hover:text-ink"
              aria-label="Close issuance modal"
            >
              ×
            </button>
            <div className="space-y-2 text-center">
              <p className="text-xs uppercase tracking-[0.5em] text-gray-500">
                {brand.name} · {product.code}
              </p>
              <h3 className="text-2xl tracking-[0.3em]">Wallet DID 인증</h3>
              <p className="text-sm text-gray-600">
                PURCHASE 요청에 따라 {product.name} 정품 QR을 발급합니다.
              </p>
            </div>
            <div className="mt-6">
              {loading && (
                <div className="flex flex-col items-center gap-4 rounded-[24px] border border-dashed border-ink/30 bg-white/80 p-10 text-center">
                  <div className="h-16 w-16 animate-spin rounded-full border-[3px] border-ink border-r-transparent" />
                  <p className="text-xs uppercase tracking-[0.4em] text-gray-500">
                    DID 세션 검증 중
                  </p>
                  <p className="text-sm text-gray-600">
                    지갑 서명을 확인하고 CloChain 서버에서 short token을 생성하고 있습니다.
                  </p>
                </div>
              )}
              {!loading && error && (
                <div className="space-y-4 rounded-[24px] border border-red-200 bg-red-50/80 p-8 text-center text-red-700">
                  <p className="text-lg tracking-[0.3em]">발급 실패</p>
                  <p className="text-sm">{error}</p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <Button variant="muted" onClick={() => void issueForProduct()}>
                      다시 시도
                    </Button>
                    <Button onClick={closeModal}>닫기</Button>
                  </div>
                </div>
              )}
              {!loading && result && (
                <div className="space-y-6">
                  <div className="flex items-center justify-center gap-3 rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-emerald-700">
                    <span className="text-xl">✓</span>
                    <p className="text-xs uppercase tracking-[0.4em]">DID 인증 완료</p>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="rounded-[24px] border border-ink/10 bg-white/80 p-6 text-center">
                      {result.qr_base64 ? (
                        <img
                          src={result.qr_base64}
                          alt="Issued QR"
                          className="mx-auto h-64 w-64 rounded-[24px] border border-ink/10 bg-white object-contain p-4 shadow-subtle"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-4">
                          <QRPlaceholder />
                          <p className="text-sm text-gray-500">QR 이미지를 불러오는 중입니다.</p>
                        </div>
                      )}
                      <p className="mt-4 text-xs uppercase tracking-[0.4em] text-gray-500">
                        Scan to register on CloChain App
                      </p>
                    </div>
                    <div className="space-y-4 rounded-[24px] border border-ink/10 bg-white/85 p-6 text-sm">
                      <div>
                        <p className="text-xs uppercase tracking-[0.4em] text-gray-500">Product</p>
                        <p className="text-base font-medium">{product.name}</p>
                        <p className="text-xs text-gray-500">{result.payload.productId}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.4em] text-gray-500">Brand</p>
                        <p className="text-base font-medium">{brand.name}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.4em] text-gray-500">Owner DID</p>
                        <p className="font-mono text-xs text-gray-700">{result.payload.did}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.4em] text-gray-500">
                          Purchase At
                        </p>
                        <p>{new Date(result.payload.purchaseAt).toLocaleString()}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.4em] text-gray-500">
                          Short Token
                        </p>
                        <p className="break-words font-mono text-xs">{result.short_token}</p>
                        <Button variant="muted" onClick={handleCopy}>
                          {copied ? '복사됨' : '토큰 복사'}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="muted" onClick={() => void issueForProduct()}>
                      새 QR 발급
                    </Button>
                    <Button onClick={closeModal}>닫기</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ProductPage
