
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
