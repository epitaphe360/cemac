import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'
import { AppLayout } from '@/components/layout/AppLayout'
import { LandingLayout } from '@/components/landing/LandingLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { PageLoader } from '@/components/shared/LoadingSpinner'

// Auth
const LoginPage                  = lazy(() => import('@/pages/auth/LoginPage').then(m => ({ default: m.LoginPage })))
const RegisterPage                = lazy(() => import('@/pages/auth/RegisterPage').then(m => ({ default: m.RegisterPage })))
const ForgotPasswordPage          = lazy(() => import('@/pages/auth/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })))
const ResetPasswordPage           = lazy(() => import('@/pages/auth/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })))
// Landing / vitrine
const LandingPage                 = lazy(() => import('@/pages/landing/LandingPage').then(m => ({ default: m.LandingPage })))
const PricingPage                 = lazy(() => import('@/pages/landing/PricingPage').then(m => ({ default: m.PricingPage })))
const AboutPage                   = lazy(() => import('@/pages/landing/AboutPage').then(m => ({ default: m.AboutPage })))
const ContactPage                 = lazy(() => import('@/pages/landing/ContactPage').then(m => ({ default: m.ContactPage })))
const TermsPage                   = lazy(() => import('@/pages/landing/LegalPage').then(m => ({ default: m.TermsPage })))
const PrivacyPage                 = lazy(() => import('@/pages/landing/LegalPage').then(m => ({ default: m.PrivacyPage })))
const CookiesPage                 = lazy(() => import('@/pages/landing/LegalPage').then(m => ({ default: m.CookiesPage })))
const LegalNoticePage             = lazy(() => import('@/pages/landing/LegalPage').then(m => ({ default: m.LegalNoticePage })))
// App
const DashboardPage               = lazy(() => import('@/pages/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })))
const CertificationListPage       = lazy(() => import('@/pages/certification/CertificationListPage').then(m => ({ default: m.CertificationListPage })))
const CertificationDetailPage     = lazy(() => import('@/pages/certification/CertificationDetailPage').then(m => ({ default: m.CertificationDetailPage })))
const NewCertificationPage        = lazy(() => import('@/pages/certification/NewCertificationPage').then(m => ({ default: m.NewCertificationPage })))
const MarketplacePage             = lazy(() => import('@/pages/marketplace/MarketplacePage').then(m => ({ default: m.MarketplacePage })))
const MarketplaceProductDetailPage = lazy(() => import('@/pages/marketplace/MarketplaceProductDetailPage').then(m => ({ default: m.MarketplaceProductDetailPage })))
const LogisticsPage               = lazy(() => import('@/pages/logistics/LogisticsPage').then(m => ({ default: m.LogisticsPage })))
const MarketIntelligencePage      = lazy(() => import('@/pages/market-intelligence/MarketIntelligencePage').then(m => ({ default: m.MarketIntelligencePage })))
const AdminPage                   = lazy(() => import('@/pages/admin/AdminPage').then(m => ({ default: m.AdminPage })))
const SettingsPage                = lazy(() => import('@/pages/settings/SettingsPage').then(m => ({ default: m.SettingsPage })))
const BillingPage                 = lazy(() => import('@/pages/billing/BillingPage').then(m => ({ default: m.BillingPage })))
const ProductsPage                = lazy(() => import('@/pages/products/ProductsPage').then(m => ({ default: m.ProductsPage })))
const VerifyCertificationPage     = lazy(() => import('@/pages/verify/VerifyCertificationPage').then(m => ({ default: m.VerifyCertificationPage })))
const PlaceholderPage             = lazy(() => import('@/pages/PlaceholderPage').then(m => ({ default: m.PlaceholderPage })))

export default function App() {
  const { initialize, isInitialized, setSession, setUser } = useAuthStore()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        // INITIAL_SESSION fires on page load (existing session or null),
        // SIGNED_IN fires after login — both require loading the user profile.
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
          await initialize()
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [initialize, setSession, setUser])

  if (!isInitialized) return <PageLoader />

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ── Page de vérification QR Code (publique, sans layout) ── */}
        <Route path="/verify/:id" element={<VerifyCertificationPage />} />

        {/* ── Pages publiques / vitrine ── */}
        <Route element={<LandingLayout />}>
          <Route path="/"                  element={<LandingPage />} />
          <Route path="/tarifs"            element={<PricingPage />} />
          <Route path="/a-propos"          element={<AboutPage />} />
          <Route path="/contact"           element={<ContactPage />} />
          <Route path="/cgu"               element={<TermsPage />} />
          <Route path="/confidentialite"   element={<PrivacyPage />} />
          <Route path="/cookies"           element={<CookiesPage />} />
          <Route path="/mentions-legales"  element={<LegalNoticePage />} />
          <Route path="/marketplace-public" element={<MarketplacePage />} />
        </Route>

        {/* ── Auth (sans layout) ── */}
        <Route path="/auth/login"           element={<LoginPage />} />
        <Route path="/auth/register"        element={<RegisterPage />} />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/reset-password"  element={<ResetPasswordPage />} />

        {/* ── Application (protégée) ── */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/dashboard"          element={<DashboardPage />} />
          <Route path="/certifications"     element={<CertificationListPage />} />
          <Route path="/certifications/new" element={
            <ProtectedRoute requiredRoles={['company_admin']}>
              <NewCertificationPage />
            </ProtectedRoute>
          } />
          <Route path="/certifications/:id" element={<CertificationDetailPage />} />
          <Route path="/marketplace"        element={<MarketplacePage />} />
          <Route path="/marketplace/:id"    element={<MarketplaceProductDetailPage />} />
          <Route path="/products" element={
            <ProtectedRoute requiredRoles={['company_admin']}>
              <ProductsPage />
            </ProtectedRoute>
          } />
          <Route path="/logistics"          element={<LogisticsPage />} />
          <Route path="/market-intelligence" element={<MarketIntelligencePage />} />
          <Route path="/admin" element={
            <ProtectedRoute requiredRoles={['super_admin', 'cemac_officer', 'chamber_agent']}>
              <AdminPage />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/billing" element={<BillingPage />} />
        </Route>

        {/* ── Fallback ── */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
      </Suspense>
      <Toaster position="top-right" toastOptions={{
        duration: 4000,
        style: { fontSize: '14px', borderRadius: '10px', padding: '14px 18px' },
        success: { iconTheme: { primary: '#15803d', secondary: '#fff' } },
      }} />
    </BrowserRouter>
  )
}

