import Button from '../components/Button'
import Input from '../components/Input'

const LoginPage = () => {
  return (
    <section className="rounded-[32px] border border-white/30 bg-dusk text-white shadow-subtle">
      <div className="grid gap-10 p-8 md:grid-cols-2 md:p-12">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.6em] text-white/50">Secure Access</p>
          <h2 className="text-3xl leading-tight">Partner Login</h2>
          <p className="text-sm text-white/70">
            이메일 DID를 입력하면 서명된 세션을 발급해드립니다. 지금 단계에서는 UI만 제공하며
            서버 연동 없이 스타일만 확인 가능합니다.
          </p>
        </div>
        <form className="space-y-6">
          <Input
            label="이메일 주소"
            type="email"
            placeholder="maison-ops@clochain.com"
            className="text-white"
            inputClassName="text-white placeholder:text-white/60 border-white/30 focus:border-white focus:ring-white/40"
          />
          <Button type="button" fullWidth variant="light">
            로그인
          </Button>
          <p className="text-xs text-white/50">
            CloChain은 relay 없이 자체 DID 서명으로 인증합니다.
          </p>
        </form>
      </div>
    </section>
  )
}

export default LoginPage
