import type { SafeEventEmitterProvider } from '@web3auth/base'

export interface AuthContextValue {
  walletAddress?: string
  provider: SafeEventEmitterProvider | null
  isAuthenticated: boolean
  isInitializing: boolean
  connect: () => Promise<string | undefined>
  disconnect: () => Promise<void>
}
