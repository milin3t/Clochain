import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createThirdwebClient } from 'thirdweb'
import { polygonAmoy } from 'thirdweb/chains'
import { useActiveAccount, useActiveWallet, useConnectModal, useDisconnect } from 'thirdweb/react'
import { inAppWallet } from 'thirdweb/wallets'
import { requestWalletNonce, verifyWalletSignature } from '../api/auth'

const STORAGE_KEY = 'clochain_wallet'
const SESSION_TOKEN_KEY = 'clochain_session_token'
const SESSION_WALLET_KEY = 'clochain_session_wallet'

export interface AuthContextValue {
  walletAddress: string | null
  login: () => Promise<void>
  logout: () => Promise<void>
  isConnecting: boolean
  sessionToken: string | null
  ensureSession: () => Promise<string>
  isAuthorizing: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const getInitialWallet = () => {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(STORAGE_KEY)
}

const getInitialSessionToken = () => {
  if (typeof window === 'undefined') return null
  return window.sessionStorage.getItem(SESSION_TOKEN_KEY)
}

const getInitialSessionWallet = () => {
  if (typeof window === 'undefined') return null
  const value = window.sessionStorage.getItem(SESSION_WALLET_KEY)
  return value ? value.toLowerCase() : null
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { connect, isConnecting } = useConnectModal()
  const { disconnect } = useDisconnect()
  const activeWallet = useActiveWallet()
  const activeAccount = useActiveAccount()
  const [cachedWallet, setCachedWallet] = useState<string | null>(getInitialWallet)
  const [sessionToken, setSessionToken] = useState<string | null>(getInitialSessionToken)
  const [sessionWallet, setSessionWallet] = useState<string | null>(getInitialSessionWallet)
  const [isAuthorizing, setIsAuthorizing] = useState(false)
  const pendingSessionRef = useRef<Promise<string> | null>(null)
  const client = useMemo(() => {
    const clientId = import.meta.env.VITE_TW_CLIENT_ID
    if (!clientId) {
      console.warn('VITE_TW_CLIENT_ID is not defined')
    }
    return createThirdwebClient({ clientId: clientId ?? '' })
  }, [])

  const storeSession = useCallback((token: string, wallet: string) => {
    const normalized = wallet.toLowerCase()
    setSessionToken(token)
    setSessionWallet(normalized)
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(SESSION_TOKEN_KEY, token)
      window.sessionStorage.setItem(SESSION_WALLET_KEY, normalized)
    }
  }, [])

  const resetSession = useCallback(() => {
    setSessionToken(null)
    setSessionWallet(null)
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(SESSION_TOKEN_KEY)
      window.sessionStorage.removeItem(SESSION_WALLET_KEY)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (activeAccount?.address) {
      window.localStorage.setItem(STORAGE_KEY, activeAccount.address)
      setCachedWallet(activeAccount.address)
    } else {
      window.localStorage.removeItem(STORAGE_KEY)
      setCachedWallet(null)
    }
  }, [activeAccount?.address])

  useEffect(() => {
    if (!activeAccount?.address) {
      resetSession()
      return
    }
    const normalized = activeAccount.address.toLowerCase()
    if (sessionWallet && sessionWallet !== normalized) {
      resetSession()
    }
  }, [activeAccount?.address, resetSession, sessionWallet])

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
    resetSession()
  }, [activeWallet, disconnect, resetSession])

  const ensureSession = useCallback(async () => {
    const account = activeAccount
    const address = account?.address?.toLowerCase()
    if (!address) {
      throw new Error('WALLET_REQUIRED')
    }
    if (sessionToken && sessionWallet === address) {
      return sessionToken
    }
    if (!account?.signMessage) {
      throw new Error('SIGNING_UNAVAILABLE')
    }
    if (pendingSessionRef.current) {
      return pendingSessionRef.current
    }

    const sessionPromise = (async () => {
      setIsAuthorizing(true)
      try {
        const { nonce } = await requestWalletNonce(address)
        const signature = await account.signMessage({ message: nonce })
        const { access_token } = await verifyWalletSignature(address, signature)
        storeSession(access_token, address)
        return access_token
      } catch (error) {
        resetSession()
        throw error
      } finally {
        setIsAuthorizing(false)
      }
    })()

    pendingSessionRef.current = sessionPromise
    try {
      return await sessionPromise
    } finally {
      pendingSessionRef.current = null
    }
  }, [activeAccount, resetSession, sessionToken, sessionWallet, storeSession])

  const value = useMemo<AuthContextValue>(
    () => ({
      walletAddress: activeAccount?.address ?? cachedWallet,
      login,
      logout,
      isConnecting,
      sessionToken: sessionToken && sessionWallet === activeAccount?.address?.toLowerCase() ? sessionToken : null,
      ensureSession,
      isAuthorizing,
    }),
    [activeAccount?.address, cachedWallet, ensureSession, isAuthorizing, isConnecting, login, logout, sessionToken, sessionWallet],
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
