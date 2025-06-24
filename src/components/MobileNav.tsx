
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
      <div className={`mobile-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />
      <nav className={`mobile-menu ${isOpen ? 'open' : ''}`}>
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
