import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import axios from 'axios'
import Button from '../components/Button'
import Input from '../components/Input'
import { verifyProduct } from '../api/verify'
import type { VerifyResponse } from '../types/verify'

const VerifyPage = () => {
  const [searchParams] = useSearchParams()
  const initialToken = useMemo(
    () => searchParams.get('q') ?? searchParams.get('token') ?? '',
    [searchParams],
  )

  const [token, setToken] = useState(initialToken)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<VerifyResponse | null>(null)

  useEffect(() => {
    if (initialToken) {
      void handleVerify(initialToken, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialToken])

  const handleVerify = async (tokenValue?: string, auto = false) => {
    const trimmedToken = (tokenValue ?? token).trim()
    if (!trimmedToken) {
      setError('short token을 입력해주세요.')
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const response = await verifyProduct({ token: trimmedToken })
      setResult(response)
      if (!response.ok) {
        setError(response.reason || '정품 정보를 확인할 수 없습니다.')
      }
      if (!auto) {
        const nextUrl = `/shop/verify?q=${encodeURIComponent(trimmedToken)}`
        window.history.replaceState(null, '', nextUrl)
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const detail =
          (err.response?.data as { detail?: string; message?: string })?.detail ||
          err.message ||
          '검증 요청 실패'
        setError(detail)
      } else {
        setError('알 수 없는 오류가 발생했습니다.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="space-y-8">
      <div className="space-y-2 text-center">
        <p className="text-xs uppercase tracking-[0.5em] text-gray-500">Verification</p>
        <h1 className="text-4xl tracking-[0.3em]">정품 인증 검증</h1>
        <p className="text-sm text-gray-600">
          QR을 스캔하면 short token(q)이 자동으로 채워집니다. 값이 없으면 수동으로 입력해 검증하세요.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-6 rounded-[32px] border border-white/40 bg-white/80 p-8">
          <Input
            label="token"
            placeholder="short token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          <Button type="button" onClick={() => handleVerify()} disabled={loading}>
            {loading ? '검증 중...' : '검증하기'}
          </Button>
          {error && <p className="rounded-3xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}
        </div>

        <div className="rounded-[32px] border border-dashed border-ink/10 bg-pearl/60 p-8 text-sm text-gray-600">
          <p className="text-xs uppercase tracking-[0.5em] text-gray-500">Result</p>
          {loading && <p className="mt-4 text-sm text-gray-500">검증 중...</p>}
          {!loading && result?.ok && result.payload ? (
            <div className="mt-4 space-y-3">
              {result.signature && (
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-gray-500">Signature</p>
                  <p className="text-sm text-ink break-words">{result.signature}</p>
                </div>
              )}
              {typeof result.registered === 'boolean' && (
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-gray-500">Registered</p>
                  <p className="text-sm text-ink">{result.registered ? 'YES' : 'NO'}</p>
                </div>
              )}
              {Object.entries(result.payload).map(([key, value]) => (
                <div key={key}>
                  <p className="text-xs uppercase tracking-[0.4em] text-gray-500">{key}</p>
                  <p className="text-sm text-ink break-words">{String(value)}</p>
                </div>
              ))}
            </div>
          ) : (
            !loading && !error && <p className="mt-4 text-sm text-gray-500">검증 결과가 여기에 표시됩니다.</p>
          )}
          {!loading && !result?.ok && error && (
            <p className="mt-4 text-sm text-red-600">Reason: {error}</p>
          )}
        </div>
      </div>
    </section>
  )
}

export default VerifyPage
