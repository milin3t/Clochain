import { Scanner, type IDetectedBarcode } from '@yudiel/react-qr-scanner'
import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { registerNFT } from '../api/nft'
import { useAuth } from '../context/AuthContext'

const extractShortToken = (value: string) => {
  if (!value) return null
  try {
    const maybeUrl = new URL(value)
    const token = maybeUrl.searchParams.get('q') || maybeUrl.searchParams.get('token')
    if (token) return token
  } catch (error) {
    // ignore non-url payloads
  }
  const match = value.match(/q=([^&]+)/)
  if (match) return match[1]
  return value
}

const ScanPage = () => {
  const { walletAddress, ensureSession } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const processingRef = useRef(false)

  const handleScan = useCallback(
    async (scanResult: IDetectedBarcode[]) => {
      if (!scanResult?.length) return
      if (!walletAddress || processingRef.current) return
      const rawValue = scanResult[0]?.rawValue
      const token = extractShortToken(rawValue)
      if (!token) return
      processingRef.current = true
      setStatus('pending')
      setMessage('QR 정보를 확인하는 중입니다...')
      try {
        const sessionToken = await ensureSession()
        const result = await registerNFT(token, sessionToken)
        const previewHash = result.txHash ? `${result.txHash.slice(0, 10)}...` : '체인 확인 필요'
        setStatus('success')
        setMessage(`NFT 등록이 완료되었습니다! 트랜잭션: ${previewHash}`)
        setTimeout(() => {
          navigate('/wardrobe')
        }, 1200)
      } catch (error) {
        console.error(error)
        setStatus('error')
        setMessage('등록에 실패했습니다. 토큰을 다시 스캔하거나 새 QR을 요청해주세요.')
      } finally {
        processingRef.current = false
      }
    },
    [ensureSession, navigate, walletAddress],
  )

  return (
    <div className="flex min-h-screen flex-col bg-[#020617] text-slate-50">
      <Header title="QR 스캔" />
      <main className="flex flex-1 flex-col gap-6 px-4 py-6">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_25px_60px_rgba(0,0,0,0.45)] backdrop-blur">
          <p className="text-lg font-semibold text-white">정품 QR 코드를 스캔하세요</p>
          <p className="mt-2 text-sm text-slate-300">
            카메라 접근을 허용하면 short_token이 추출되고 즉시 NFT 등록 프로세스가 실행됩니다.
          </p>
          <div className="mt-5 flex justify-center">
            <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-black/40">
              <Scanner
                onScan={handleScan}
                onError={(error) => console.error('Scanner error', error)}
                styles={{
                  container: { width: '100%', height: '360px' },
                }}
              />
            </div>
          </div>
          {status !== 'idle' && (
            <p
              className={`mt-4 text-sm font-medium ${
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
    </div>
  )
}

export default ScanPage
