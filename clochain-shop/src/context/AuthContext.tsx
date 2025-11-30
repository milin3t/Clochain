import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { createThirdwebClient } from 'thirdweb'
import { polygonAmoy } from 'thirdweb/chains'
import { useActiveAccount, useActiveWallet, useConnectModal, useDisconnect } from 'thirdweb/react'
import { inAppWallet } from 'thirdweb/wallets'

const STORAGE_KEY = 'clochain_wallet'

export interface AuthContextValue {
  walletAddress: string | null
  login: () => Promise<void>
  logout: () => Promise<void>
  isConnecting: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const getInitialWallet = () => {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(STORAGE_KEY)
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { connect, isConnecting } = useConnectModal()
  const { disconnect } = useDisconnect()
  const activeWallet = useActiveWallet()
  const activeAccount = useActiveAccount()
  const [cachedWallet, setCachedWallet] = useState<string | null>(getInitialWallet)
  const client = useMemo(() => {
    const clientId = import.meta.env.VITE_TW_CLIENT_ID
    if (!clientId) {
      console.warn('VITE_TW_CLIENT_ID is not defined')
    }
    return createThirdwebClient({ clientId: clientId ?? '' })
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (activeAccount?.address) {
      window.localStorage.setItem(STORAGE_KEY, activeAccount.address)
      setCachedWallet(activeAccount.address)
    }
  }, [activeAccount?.address])

  const login = useCallback(async () => {
    try {
      await connect({
        client,
        chain: polygonAmoy,
        wallets: [
          inAppWallet({
            auth: {
              options: ['email'],
            },
          }),
        ],
      })
    } catch (error) {
      console.warn('Wallet connection was canceled or failed.', error)
    }
  }, [client, connect])

  const logout = useCallback(async () => {
    if (activeWallet) {
      disconnect(activeWallet as never)
    }
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY)
    }
    setCachedWallet(null)
  }, [activeWallet, disconnect])

  const value = useMemo<AuthContextValue>(
    () => ({
      walletAddress: activeAccount?.address ?? cachedWallet,
      login,
      logout,
      isConnecting,
    }),
    [activeAccount?.address, cachedWallet, isConnecting, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
