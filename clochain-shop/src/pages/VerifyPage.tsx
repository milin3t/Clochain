import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Scanner, type IDetectedBarcode } from '@yudiel/react-qr-scanner'
import { useSearchParams } from 'react-router-dom'
import axios from 'axios'
import Button from '../components/Button'
import Input from '../components/Input'
import { verifyProduct } from '../api/verify'
import type { VerifyResponse } from '../types/verify'

const extractShortToken = (value: string) => {
  if (!value) return null
  try {
    const maybeUrl = new URL(value)
    const tokenValue = maybeUrl.searchParams.get('q') ?? maybeUrl.searchParams.get('token')
    if (tokenValue) return tokenValue
  } catch {
    // ignore invalid URLs
  }
  const match = value.match(/q=([^&]+)/)
  if (match) return match[1]
  return value
}

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
  const [scanMessage, setScanMessage] = useState('')
  const processingRef = useRef(false)

  const handleVerify = useCallback(async (tokenValue?: string, auto = false) => {
    const value = tokenValue ?? token
    const trimmedToken = value.trim()
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
  }, [token])

  useEffect(() => {
    if (initialToken) {
      void handleVerify(initialToken, true)
    }
  }, [handleVerify, initialToken])

  const handleScan = useCallback(
    async (scanResult: IDetectedBarcode[]) => {
      if (!scanResult?.length || processingRef.current) return
      const rawValue = scanResult[0]?.rawValue
      const scannedToken = rawValue ? extractShortToken(rawValue) : null
      if (!scannedToken) return
      processingRef.current = true
      setScanMessage('QR을 인식했습니다. 검증 중...')
      setToken(scannedToken)
      try {
        await handleVerify(scannedToken, true)
        setScanMessage('검증이 완료되었습니다. 결과를 확인하세요.')
      } catch (err) {
        console.error('QR verify failed', err)
        setScanMessage('QR 검증에 실패했습니다. 다시 스캔해 주세요.')
      } finally {
        processingRef.current = false
      }
    },
    [handleVerify],
  )

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

      <div className="rounded-[32px] border border-white/40 bg-white/70 p-8 text-center">
        <p className="text-xs uppercase tracking-[0.5em] text-gray-500">QR Scan</p>
        <p className="mt-2 text-sm text-gray-600">
          QR 코드를 카메라에 비추면 short token이 자동으로 인식되고 검증이 진행됩니다.
        </p>
        <div className="mt-6 flex justify-center">
          <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-ink/10 bg-black/70">
            <Scanner
              onScan={handleScan}
              onError={(scanError) => console.error('Scanner error', scanError)}
              components={{ torch: true }}
              styles={{
                container: { width: '100%', height: '320px' },
              }}
            />
          </div>
        </div>
        {scanMessage && <p className="mt-4 text-sm text-gray-600">{scanMessage}</p>}
      </div>
    </section>
  )
}

export default VerifyPage
