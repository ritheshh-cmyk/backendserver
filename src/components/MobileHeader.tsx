
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
