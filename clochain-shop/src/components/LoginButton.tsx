import { shortenAddress } from '../api/auth'
import { useAuth } from '../auth/useAuth'

const LoginButton = () => {
  const { walletAddress, login, logout } = useAuth()

  return (
    <div className="flex flex-col items-center gap-3">
      {walletAddress ? (
        <>
          <p className="text-sm text-gray-600">Connected wallet: {shortenAddress(walletAddress)}</p>
          <button
            type="button"
            onClick={logout}
            className="rounded-full border border-ink/30 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink"
          >
            Logout
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={login}
          className="rounded-full bg-ink px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-pearl transition hover:bg-dusk"
        >
          Login with Web3Auth
        </button>
      )}
    </div>
  )
}

export default LoginButton
