import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import Button from '../components/Button'
import QRPlaceholder from '../components/QRPlaceholder'
import { issueProduct } from '../api/issue'
import { findBrand } from '../data/brands'
import type { IssueResponse } from '../types/issue'

const IssuePage = () => {
  const { brand } = useParams<{ brand?: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [result, setResult] = useState<IssueResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const brandInfo = useMemo(() => (brand ? findBrand(brand) : null), [brand])
  const productType = brand ?? ''

  useEffect(() => {
    if (!localStorage.getItem('access_token')) {
      navigate('/shop/login', { replace: true, state: { from: location.pathname } })
    }
  }, [location.pathname, navigate])

  if (!brand) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-gray-500">브랜드 정보가 필요합니다.</p>
        <Button variant="muted" onClick={() => navigate('/shop')}>
          Back to shop
        </Button>
      </div>
    )
  }

  const handleIssue = async () => {
    setLoading(true)
    setError(null)
    setCopied(false)
    try {
      const response = await issueProduct(productType)
      setResult(response)
    } catch (err) {
      if (err instanceof Error && err.message === 'AUTH_REQUIRED') {
        navigate('/shop/login', { replace: true })
        return
      }
      if (axios.isAxiosError(err)) {
        const detail =
          (err.response?.data as { detail?: string })?.detail || 'QR 발급에 실패했습니다.'
        setError(detail)
      } else {
        setError('알 수 없는 오류로 실패했습니다.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
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
    <section className="space-y-10">
      <div className="space-y-2 text-center">
        <p className="text-xs uppercase tracking-[0.5em] text-gray-500">
          Issue · {brandInfo?.name ?? brand}
        </p>
        <h1 className="text-4xl tracking-[0.3em]">정품 QR 발급</h1>
        <p className="text-sm text-gray-600">
          DID 세션으로 서명된 short token만 생성됩니다. 발급 후 QR을 스캔하면 서버에서 정품 여부를
          검증합니다.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="rounded-[32px] border border-white/50 bg-white/80 p-10 text-center">
          {result?.qr_base64 ? (
            <img
              src={result.qr_base64}
              alt="Issued QR"
              className="mx-auto h-72 w-72 rounded-3xl border border-ink/10 bg-white object-contain p-3 shadow-subtle"
            />
          ) : (
            <div className="flex flex-col items-center gap-6">
              <QRPlaceholder />
              <p className="text-sm text-gray-600">발급 버튼을 누르면 QR이 표시됩니다.</p>
            </div>
          )}
        </div>

        <div className="space-y-5 rounded-[32px] border border-white/40 bg-pearl/80 p-8">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.5em] text-gray-500">Product Type</p>
            <p className="text-lg tracking-[0.3em]">{productType}</p>
          </div>
          {error && <p className="rounded-2xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}
          <Button type="button" onClick={handleIssue} disabled={loading}>
            {loading ? '발급 중...' : 'QR 발급하기'}
          </Button>
          {result && (
            <div className="space-y-3 rounded-3xl border border-ink/10 bg-white/80 p-5 text-left">
              <p className="text-xs uppercase tracking-[0.4em] text-gray-500">short token</p>
              <p className="break-words text-sm text-ink">{result.short_token}</p>
              <div className="flex gap-3">
                <Button type="button" variant="muted" onClick={handleCopy}>
                  {copied ? '복사됨' : '토큰 복사'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default IssuePage
