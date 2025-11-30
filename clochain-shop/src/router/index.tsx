import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import Header from '../components/Header'
import ShopHome from '../pages/ShopHome'
import LoginPage from '../pages/LoginPage'
import ShopBrand from '../pages/ShopBrand'
import ProductPage from '../pages/ProductPage'
import IssuePage from '../pages/IssuePage'
import VerifyPage from '../pages/VerifyPage'

const AppLayout = () => (
  <div className="min-h-screen bg-pearl text-ink">
    <Header />
    <main className="page-shell py-10 md:py-14">
      <Outlet />
    </main>
    <footer className="page-shell pb-10 text-xs uppercase tracking-wider text-gray-500">
      CloChain Authenticity Platform · Crafted for maison partners
    </footer>
  </div>
)

const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const { walletAddress } = useAuth()
  const location = useLocation()

  if (!walletAddress) {
    return <Navigate to="/shop/login" replace state={{ from: location.pathname }} />
  }

  return children
}

const AppRouter = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/shop" replace />} />
    <Route path="/shop" element={<AppLayout />}>
      <Route index element={<ShopHome />} />
      <Route path="login" element={<LoginPage />} />
      <Route path="verify" element={<VerifyPage />} />
      <Route path=":brand" element={<ShopBrand />} />
      <Route
        path=":brand/issue"
        element={
          <RequireAuth>
            <IssuePage />
          </RequireAuth>
        }
      />
      <Route path=":brand/:productId" element={<ProductPage />} />
    </Route>
    <Route path="*" element={<Navigate to="/shop" replace />} />
  </Routes>
)

export default AppRouter
