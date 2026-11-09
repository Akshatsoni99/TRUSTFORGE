import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { StatusBanner } from './components/common/StatusBanner';
import { LandingPage } from './pages/LandingPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { QRSuccessPage } from './pages/QRSuccessPage';
import { PublicQRScanPage } from './pages/PublicQRScanPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';

const AppLayout: React.FC = () => {
  const location = useLocation();
  // On public scanner page /v/:token, provide a focused mobile experience without main navbar/footer
  const isPublicScanner = location.pathname.startsWith('/v/');

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {!isPublicScanner && <StatusBanner />}
      {!isPublicScanner && <Navbar />}

      <div className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<OnboardingPage />} />
          <Route path="/qr-success/:vehicleId" element={<QRSuccessPage />} />
          <Route path="/v/:token" element={<PublicQRScanPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </div>

      {!isPublicScanner && <Footer />}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
};

export default App;

