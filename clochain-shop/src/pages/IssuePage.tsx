import QRPlaceholder from '../components/QRPlaceholder'
import Button from '../components/Button'
import Input from '../components/Input'

const IssuePage = () => {
  return (
    <section className="grid gap-10 md:grid-cols-[2fr,1fr]">
      <div className="rounded-[32px] border border-white/50 bg-white/70 p-10 text-center">
        <div className="flex flex-col items-center gap-6">
          <QRPlaceholder />
          <p className="text-sm text-gray-600">여기에 정품 QR이 표시됩니다</p>
        </div>
      </div>
      <div className="space-y-6 rounded-[32px] border border-white/40 bg-pearl/80 p-8">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.5em] text-gray-500">Issue Desk</p>
          <h3 className="text-2xl tracking-[0.3em]">QR 발급 프로토타입</h3>
          <p className="text-sm text-gray-600">
            브랜딩과 상품 정보를 입력하고 발급 버튼을 누르면 위의 공간에 QR이 준비될 예정입니다.
          </p>
        </div>
        <Input label="브랜드" placeholder="Celine" />
        <Input label="Product ID" placeholder="ct-001" />
        <Input label="구매일" placeholder="2024-01-11" />
        <Button type="button" fullWidth>
          QR 발급 준비
        </Button>
      </div>
    </section>
  )
}

export default IssuePage
