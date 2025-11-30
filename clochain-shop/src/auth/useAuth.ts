import { useContext } from 'react'
import { getWalletAddress as getStoredWalletAddress } from '../api/auth'
import { AuthContext } from './AuthProvider'

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const getWalletAddress = () => getStoredWalletAddress()
