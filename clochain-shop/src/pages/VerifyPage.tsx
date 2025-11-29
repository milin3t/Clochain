import Button from '../components/Button'
import Input from '../components/Input'

const VerifyPage = () => {
  return (
    <section className="grid gap-8 md:grid-cols-2">
      <div className="space-y-6 rounded-[32px] border border-white/40 bg-white/70 p-8">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.5em] text-gray-500">Verify</p>
          <h3 className="text-2xl tracking-[0.3em]">정품 여부 확인</h3>
          <p className="text-sm text-gray-600">
            QR에서 받은 short token 값을 입력하면 인증 결과가 아래 카드에 표시될 예정입니다.
          </p>
        </div>
        <Input label="short token (q)" placeholder="ex. ct-001-9fd20" />
        <Button type="button">정품 여부 확인</Button>
      </div>
      <div className="rounded-[32px] border border-dashed border-ink/10 bg-pearl/60 p-8 text-sm text-gray-600">
        <p className="text-xs uppercase tracking-[0.5em] text-gray-500">Result</p>
        <h4 className="text-xl tracking-[0.3em]">CloChain Authentic</h4>
        <ul className="mt-4 space-y-2">
          <li>브랜드: Celine</li>
          <li>Product ID: ct-001</li>
          <li>소유자 DID: did:email:celine.client@example.com</li>
          <li>상태: Authentic / Transferable</li>
        </ul>
      </div>
    </section>
  )
}

export default VerifyPage
