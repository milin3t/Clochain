import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Web3Auth } from '@web3auth/single-factor-auth'
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider'
import { ethers } from 'ethers'
import { authSession } from '../api/auth'

const STORAGE_KEY = 'clochain_wallet_address'

const chainConfig = {
  chainId: '0x13882',
  rpcTarget: 'https://rpc-amoy.polygon.technology',
  chainNamespace: 'eip155',
  displayName: 'Polygon Amoy',
  blockExplorer: 'https://www.oklink.com/amoy',
  ticker: 'POL',
  tickerName: 'Polygon POL',
}

export interface AuthContextValue {
  walletAddress: string | null
  provider: any | null
  login: () => Promise<void>
  logout: () => void
}

const getInitialWallet = (): string | null => {
  if (typeof window === 'undefined') return null
  const stored = window.localStorage.getItem(STORAGE_KEY)
  authSession.setWalletAddress(stored)
  return stored
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(getInitialWallet)
  const [provider, setProvider] = useState<any | null>(null)
  const web3authRef = useRef<Web3Auth | null>(null)

  const persistWallet = useCallback((address: string | null) => {
    setWalletAddress(address)
    authSession.setWalletAddress(address)
    if (typeof window === 'undefined') return
    if (address) {
      window.localStorage.setItem(STORAGE_KEY, address)
    } else {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  const hydrateProvider = useCallback(
    async (web3authProvider: any | null) => {
      if (!web3authProvider) return
      setProvider(web3authProvider)
      const ethersProvider = new ethers.BrowserProvider(web3authProvider as ethers.Eip1193Provider)
      const signer = await ethersProvider.getSigner()
      const address = (await signer.getAddress()).toLowerCase()
      persistWallet(address)
    },
    [persistWallet],
  )

  useEffect(() => {
    const clientId = import.meta.env.VITE_WEB3AUTH_CLIENT_ID
    if (!clientId) {
      console.error('VITE_WEB3AUTH_CLIENT_ID is missing. Web3Auth login disabled.')
      return
    }

    const init = async () => {
      const privateKeyProvider = new EthereumPrivateKeyProvider({ config: { chainConfig } })
      const web3auth = new Web3Auth({
        clientId,
        web3AuthNetwork: 'sapphire_devnet',
        privateKeyProvider,
      })
      web3authRef.current = web3auth
      try {
        await web3auth.init()
        if (web3auth.provider) {
          await hydrateProvider(web3auth.provider)
        }
      } catch (error) {
        console.error('Failed to initialize Web3Auth SFA', error)
      }
    }

    void init()
  }, [hydrateProvider])

  const login = useCallback(async () => {
    if (!web3authRef.current) {
      throw new Error('Web3Auth has not been initialized')
    }
    const email = window.prompt('지갑 생성을 위한 이메일을 입력하세요')?.trim()
    if (!email) return

    const web3authProvider = await web3authRef.current.connect({
      verifier: 'w3a-email-passwordless',
      verifierId: email,
    })
    await hydrateProvider(web3authProvider)
  }, [hydrateProvider])

  const logout = useCallback(() => {
    const run = async () => {
      try {
        await web3authRef.current?.logout()
      } catch (error) {
        console.error('Web3Auth logout failed', error)
      } finally {
        setProvider(null)
        persistWallet(null)
      }
    }

    void run()
  }, [persistWallet])

  const value = useMemo<AuthContextValue>(
    () => ({ walletAddress, provider, login, logout }),
    [walletAddress, provider, login, logout],
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
