import { Navigate, Outlet, useLocation, useRoutes } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoginPage from '../pages/LoginPage'
import ScanPage from '../pages/ScanPage'
import WardrobePage from '../pages/WardrobePage'
import NFTDetailPage from '../pages/NFTDetailPage'
import TransferPage from '../pages/TransferPage'
import NotFoundPage from '../pages/NotFoundPage'

const RequireAuth = () => {
  const { walletAddress } = useAuth()
  const location = useLocation()
  if (!walletAddress) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return <Outlet />
}

export const AppRouter = () => {
  const { walletAddress } = useAuth()
  const element = useRoutes([
    {
      path: '/',
      element: walletAddress ? <Navigate to="/wardrobe" replace /> : <Navigate to="/login" replace />,
    },
    {
      path: '/login',
      element: <LoginPage />,
    },
    {
      element: <RequireAuth />, // protected routes
      children: [
        { path: '/scan', element: <ScanPage /> },
        { path: '/wardrobe', element: <WardrobePage /> },
        { path: '/wardrobe/:tokenId', element: <NFTDetailPage /> },
        { path: '/transfer/:tokenId', element: <TransferPage /> },
      ],
    },
    { path: '*', element: <NotFoundPage /> },
  ])

  return element
}
