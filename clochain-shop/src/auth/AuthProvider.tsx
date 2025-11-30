import { OpenloginAdapter } from '@web3auth/openlogin-adapter'
import { CHAIN_NAMESPACES, type SafeEventEmitterProvider } from '@web3auth/base'
import { Web3Auth } from '@web3auth/modal'
import {
  createContext,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { authSession } from '../api/auth'
import type { AuthContextValue } from '../types/auth'

const RPC_TARGET = 'https://rpc.ankr.com/polygon_amoy'

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: '0x13882',
  rpcTarget: RPC_TARGET,
  displayName: 'Polygon Amoy',
  blockExplorer: 'https://www.oklink.com/amoy',
  ticker: 'POL',
  tickerName: 'Polygon POL',
}

type Web3AuthInstance = Web3Auth | null

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const readAccounts = async (provider: SafeEventEmitterProvider | null) => {
  if (!provider) return undefined
  try {
    const accounts = (await provider.request({ method: 'eth_accounts' })) as string[]
    return accounts?.[0]?.toLowerCase()
  } catch (err) {
    console.error('Failed to read wallet address', err)
    return undefined
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [walletAddress, setWalletAddress] = useState<string | undefined>(undefined)
  const [provider, setProvider] = useState<SafeEventEmitterProvider | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const web3authRef = useRef<Web3AuthInstance>(null)

  const syncWalletAddress = useCallback((address?: string | null) => {
    const normalized = address ? address.toLowerCase() : undefined
    setWalletAddress(normalized)
    authSession.setWalletAddress(normalized)
  }, [])

  useEffect(() => {
    const init = async () => {
      const clientId = import.meta.env.VITE_WEB3AUTH_CLIENT_ID
      if (!clientId) {
        console.error('VITE_WEB3AUTH_CLIENT_ID is missing. Web3Auth login is disabled.')
        setIsInitializing(false)
        return
      }

      try {
        const web3auth = new Web3Auth({
          clientId,
          chainConfig,
          web3AuthNetwork: 'sapphire_devnet',
          uiConfig: {
            appName: 'CloChain Shop',
            mode: 'light',
            loginMethodsOrder: ['google', 'twitter', 'email_passwordless'],
          },
        })

        const openloginAdapter = new OpenloginAdapter({
          loginSettings: {
            mfaLevel: 'optional',
          },
          adapterSettings: {
            uxMode: 'popup',
            whiteLabel: {
              name: 'CloChain Shop',
              defaultLanguage: 'ko',
            },
          },
        })

        web3auth.configureAdapter(openloginAdapter)
        web3authRef.current = web3auth
        await web3auth.initModal()

        if (web3auth.provider) {
          setProvider(web3auth.provider)
          const address = await readAccounts(web3auth.provider)
          syncWalletAddress(address)
        }
      } catch (error) {
        console.error('Failed to initialize Web3Auth modal', error)
      } finally {
        setIsInitializing(false)
      }
    }

    void init()
  }, [syncWalletAddress])

  const connect = useCallback(async () => {
    if (!web3authRef.current) {
      console.error('Web3Auth is not initialized yet')
      return undefined
    }
    try {
      const nextProvider = await web3authRef.current.connect()
      if (!nextProvider) return undefined
      setProvider(nextProvider)
      const address = await readAccounts(nextProvider)
      syncWalletAddress(address)
      return address
    } catch (error) {
      console.error('Web3Auth connection failed', error)
      throw error
    }
  }, [syncWalletAddress])

  const disconnect = useCallback(async () => {
    if (!web3authRef.current) return
    try {
      await web3authRef.current.logout()
    } finally {
      setProvider(null)
      syncWalletAddress(undefined)
    }
  }, [syncWalletAddress])

  const value = useMemo<AuthContextValue>(
    () => ({
      walletAddress,
      provider,
      isAuthenticated: Boolean(walletAddress),
      isInitializing,
      connect,
      disconnect,
    }),
    [walletAddress, provider, isInitializing, connect, disconnect],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export { AuthContext }
