import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
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

const AppRouter = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/shop" replace />} />
    <Route path="/shop" element={<AppLayout />}>
      <Route index element={<ShopHome />} />
      <Route path="login" element={<LoginPage />} />
      <Route path="verify" element={<VerifyPage />} />
      <Route path=":brand" element={<ShopBrand />} />
      <Route path=":brand/issue" element={<IssuePage />} />
      <Route path=":brand/:productId" element={<ProductPage />} />
    </Route>
    <Route path="*" element={<Navigate to="/shop" replace />} />
  </Routes>
)

export default AppRouter
