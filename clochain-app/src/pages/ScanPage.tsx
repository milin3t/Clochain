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
  const { walletAddress } = useAuth()
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
        await registerNFT(token, walletAddress)
        setStatus('success')
        setMessage('NFT 등록이 완료되었습니다! 내 옷장에서 확인하세요.')
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
    [navigate, walletAddress],
  )

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f7f7]">
      <Header title="QR 스캔" />
      <main className="flex flex-1 flex-col gap-6 px-4 py-6">
        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-lg font-semibold">정품 QR 코드를 스캔하세요</p>
          <p className="mt-2 text-sm text-black/60">카메라 접근을 허용하면 자동으로 short_token이 추출되어 NFT가 등록됩니다.</p>
          <div className="mt-4 overflow-hidden rounded-2xl border border-black/10">
            <Scanner onScan={handleScan} onError={(error) => console.error('Scanner error', error)} />
          </div>
          {status !== 'idle' && (
            <p
              className={`mt-4 text-sm font-medium ${
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

export default ScanPage
