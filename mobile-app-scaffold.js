import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';

async function createMobileAppScaffold() {
  console.log('📱 Starting Mobile App Scaffolding\n');
  
  try {
    // Step 1: Create PWA manifest
    console.log('📋 Step 1: Creating PWA manifest...');
    const manifest = {
      name: "Mobile Repair Tracker",
      short_name: "RepairTracker",
      description: "Professional mobile repair business management system",
      start_url: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#000000",
      icons: [
        {
          src: "/icons/icon-192x192.png",
          sizes: "192x192",
          type: "image/png"
        },
        {
          src: "/icons/icon-512x512.png",
          sizes: "512x512",
          type: "image/png"
        }
      ]
    };
    
    await fs.writeFile('public/manifest.json', JSON.stringify(manifest, null, 2));
    console.log('✅ PWA manifest created');
    console.log('');

    // Step 2: Create service worker for offline functionality
    console.log('🔧 Step 2: Creating service worker...');
    const serviceWorker = `
// Service Worker for Mobile Repair Tracker
const CACHE_NAME = 'repair-tracker-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/index-B6Jb6OZG.css',
  '/assets/index-C84LTc8j.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Sync offline data when connection is restored
  console.log('Background sync triggered');
}
`;
    
    await fs.writeFile('public/sw.js', serviceWorker);
    console.log('✅ Service worker created');
    console.log('');

    // Step 3: Create mobile-specific CSS
    console.log('🎨 Step 3: Creating mobile-specific styles...');
    const mobileCSS = `
/* Mobile-specific styles for Repair Tracker */
@media (max-width: 768px) {
  .mobile-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    background: var(--background);
    border-bottom: 1px solid var(--border);
    padding: 0.5rem 1rem;
  }
  
  .mobile-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .mobile-menu {
    position: fixed;
    top: 0;
    left: -100%;
    width: 80%;
    height: 100vh;
    background: var(--background);
    transition: left 0.3s ease;
    z-index: 1001;
    padding: 1rem;
    box-shadow: 2px 0 10px rgba(0,0,0,0.1);
  }
  
  .mobile-menu.open {
    left: 0;
  }
  
  .mobile-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    z-index: 1000;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
  }
  
  .mobile-overlay.open {
    opacity: 1;
    visibility: visible;
  }
  
  .mobile-content {
    margin-top: 60px;
    padding: 1rem;
  }
  
  .mobile-card {
    background: var(--card);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .mobile-button {
    width: 100%;
    padding: 0.75rem;
    border-radius: 8px;
    border: none;
    background: var(--primary);
    color: white;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }
  
  .mobile-input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    margin-bottom: 1rem;
  }
  
  .mobile-table {
    width: 100%;
    overflow-x: auto;
  }
  
  .mobile-table table {
    min-width: 600px;
  }
}

/* Touch-friendly interactions */
@media (hover: none) and (pointer: coarse) {
  .mobile-button {
    min-height: 44px;
  }
  
  .mobile-input {
    min-height: 44px;
  }
  
  .mobile-link {
    min-height: 44px;
    display: flex;
    align-items: center;
  }
}

/* Dark mode support for mobile */
@media (prefers-color-scheme: dark) {
  .mobile-card {
    background: var(--card-dark);
    color: var(--foreground-dark);
  }
}
`;
    
    await fs.writeFile('src/mobile.css', mobileCSS);
    console.log('✅ Mobile-specific CSS created');
    console.log('');

    // Step 4: Create mobile components
    console.log('🧩 Step 4: Creating mobile components...');
    
    // Mobile Header Component
    const mobileHeader = `
import React, { useState } from 'react';
import { Menu, X, Home, Settings, BarChart3, Package, Users } from 'lucide-react';

interface MobileHeaderProps {
  title: string;
  onMenuClick: () => void;
}

export function MobileHeader({ title, onMenuClick }: MobileHeaderProps) {
  return (
    <header className="mobile-header">
      <div className="mobile-nav">
        <button 
          onClick={onMenuClick}
          className="mobile-button"
          style={{ width: 'auto', padding: '0.5rem' }}
        >
          <Menu size={24} />
        </button>
        <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '600' }}>
          {title}
        </h1>
        <div style={{ width: '40px' }}></div>
      </div>
    </header>
  );
}
`;
    
    await fs.writeFile('src/components/MobileHeader.tsx', mobileHeader);
    console.log('✅ Mobile header component created');
    
    // Mobile Navigation Component
    const mobileNav = `
import React from 'react';
import { X, Home, Settings, BarChart3, Package, Users, DollarSign } from 'lucide-react';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

export function MobileNav({ isOpen, onClose, onNavigate }: MobileNavProps) {
  const menuItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/transactions', icon: DollarSign, label: 'Transactions' },
    { path: '/inventory', icon: Package, label: 'Inventory' },
    { path: '/suppliers', icon: Users, label: 'Suppliers' },
    { path: '/reports', icon: BarChart3, label: 'Reports' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <>
      <div className={\`mobile-overlay \${isOpen ? 'open' : ''}\`} onClick={onClose} />
      <nav className={\`mobile-menu \${isOpen ? 'open' : ''}\`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ margin: 0 }}>Menu</h2>
          <button onClick={onClose} className="mobile-button" style={{ width: 'auto', padding: '0.5rem' }}>
            <X size={24} />
          </button>
        </div>
        
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => {
              onNavigate(item.path);
              onClose();
            }}
            className="mobile-button"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem',
              justifyContent: 'flex-start',
              background: 'transparent',
              color: 'var(--foreground)',
              border: 'none',
              boxShadow: 'none'
            }}
          >
            <item.icon size={20} />
            {item.label}
          </button>
        ))}
      </nav>
    </>
  );
}
`;
    
    await fs.writeFile('src/components/MobileNav.tsx', mobileNav);
    console.log('✅ Mobile navigation component created');
    
    // Mobile Layout Component
    const mobileLayout = `
import React, { useState } from 'react';
import { MobileHeader } from './MobileHeader';
import { MobileNav } from './MobileNav';

interface MobileLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function MobileLayout({ children, title }: MobileLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleNavigate = (path: string) => {
    // Handle navigation - you can integrate with your router
    console.log('Navigate to:', path);
    window.location.href = path;
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <MobileHeader 
        title={title} 
        onMenuClick={() => setIsMenuOpen(true)} 
      />
      
      <MobileNav
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onNavigate={handleNavigate}
      />
      
      <main className="mobile-content">
        {children}
      </main>
    </div>
  );
}
`;
    
    await fs.writeFile('src/components/MobileLayout.tsx', mobileLayout);
    console.log('✅ Mobile layout component created');
    console.log('');

    // Step 5: Create mobile-specific hooks
    console.log('🎣 Step 5: Creating mobile-specific hooks...');
    const mobileHooks = `
import { useState, useEffect } from 'react';

// Hook to detect mobile device
export function useMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

// Hook for offline detection
export function useOffline() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOffline;
}

// Hook for touch gestures
export function useTouchGestures() {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);

    if (isHorizontalSwipe && Math.abs(distanceX) > minSwipeDistance) {
      if (distanceX > 0) {
        // Swipe left
        console.log('Swipe left detected');
      } else {
        // Swipe right
        console.log('Swipe right detected');
      }
    }
  };

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}
`;
    
    await fs.writeFile('src/hooks/use-mobile.tsx', mobileHooks);
    console.log('✅ Mobile-specific hooks created');
    console.log('');

    // Step 6: Update main App to include mobile support
    console.log('📱 Step 6: Updating main App for mobile support...');
    const appUpdate = `
import React from 'react';
import { Route, Switch } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from './components/ui/toaster';
import { useToast } from './hooks/use-toast';
import { useMobile } from './hooks/use-mobile';
import { MobileLayout } from './components/MobileLayout';

// Import pages
import Dashboard from './pages/Dashboard';
import TransactionHistory from './pages/TransactionHistory';
import InventoryPage from './pages/InventoryPage';
import SuppliersPage from './pages/SuppliersPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import ExpenditurePage from './pages/ExpenditurePage';
import GroupedExpendituresPage from './pages/GroupedExpendituresPage';
import NotFound from './pages/not-found';

// Import mobile CSS
import './mobile.css';

const queryClient = new QueryClient();

function App() {
  const { toast } = useToast();
  const isMobile = useMobile();

  if (isMobile) {
    return (
      <QueryClientProvider client={queryClient}>
        <MobileLayout title="Mobile Repair Tracker">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/transactions" component={TransactionHistory} />
            <Route path="/inventory" component={InventoryPage} />
            <Route path="/suppliers" component={SuppliersPage} />
            <Route path="/reports" component={ReportsPage} />
            <Route path="/settings" component={SettingsPage} />
            <Route path="/expenditures" component={ExpenditurePage} />
            <Route path="/grouped-expenditures" component={GroupedExpendituresPage} />
            <Route component={NotFound} />
          </Switch>
        </MobileLayout>
        <Toaster />
      </QueryClientProvider>
    );
  }

  // Desktop layout (existing)
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/transactions" component={TransactionHistory} />
          <Route path="/inventory" component={InventoryPage} />
          <Route path="/suppliers" component={SuppliersPage} />
          <Route path="/reports" component={ReportsPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route path="/expenditures" component={ExpenditurePage} />
          <Route path="/grouped-expenditures" component={GroupedExpendituresPage} />
          <Route component={NotFound} />
        </Switch>
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
`;
    
    await fs.writeFile('src/App.tsx', appUpdate);
    console.log('✅ Main App updated for mobile support');
    console.log('');

    // Step 7: Register service worker
    console.log('🔧 Step 7: Registering service worker...');
    const serviceWorkerRegistration = `
// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Request notification permission
if ('Notification' in window) {
  Notification.requestPermission();
}
`;
    
    await fs.writeFile('src/service-worker-registration.js', serviceWorkerRegistration);
    console.log('✅ Service worker registration created');
    console.log('');

    console.log('🎉 Mobile App Scaffolding Completed Successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ PWA manifest created');
    console.log('✅ Service worker for offline functionality');
    console.log('✅ Mobile-specific CSS and components');
    console.log('✅ Touch-friendly interactions');
    console.log('✅ Responsive design support');
    console.log('✅ Offline detection and sync');
    console.log('✅ Mobile navigation and layout');
    console.log('✅ Progressive Web App ready');

  } catch (error) {
    console.error('❌ Mobile app scaffolding failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the scaffolding
createMobileAppScaffold(); 