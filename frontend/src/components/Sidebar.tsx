import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Receipt, 
  BarChart3, 
  Settings, 
  Menu,
  X,
  ChevronRight,
  Store,
  CreditCard,
  Calendar,
  Eye,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage } = useLanguage();
  const [location] = useLocation();
  const [lastClickTime, setLastClickTime] = useState(0);

  const handleLogoClick = () => {
    const currentTime = new Date().getTime();
    const timeDiff = currentTime - lastClickTime;
    
    if (timeDiff < 300) { // Double click detected (within 300ms)
      // Navigate to dashboard
      window.location.href = "/";
    }
    
    setLastClickTime(currentTime);
  };

  const navigationItems = [
    {
      name: language === 'en' ? 'Dashboard' : 'డాష్‌బోర్డ్',
      href: '/',
      icon: Home,
      current: location === '/'
    },
    {
      name: language === 'en' ? 'E-Bills' : 'ఇ-బిల్లులు',
      href: '/ebills',
      icon: FileText,
      current: location === '/ebills'
    },
    {
      name: language === 'en' ? 'Expenditure' : 'ఖర్చులు',
      href: '/expenditure',
      icon: CreditCard,
      current: location === '/expenditure'
    },
    {
      name: language === 'en' ? 'Suppliers' : 'సరఫరాదారులు',
      href: '/suppliers',
      icon: Store,
      current: location === '/suppliers'
    },
    {
      name: language === 'en' ? 'Transaction History' : 'లావాదేవీ చరిత్ర',
      href: '/transaction-history',
      icon: Eye,
      current: location === '/transaction-history'
    },
    {
      name: language === 'en' ? 'Reports' : 'నివేదికలు',
      href: '/reports',
      icon: BarChart3,
      current: location === '/reports'
    },
    {
      name: language === 'en' ? 'Settings' : 'సెట్టింగ్‌లు',
      href: '/settings',
      icon: Settings,
      current: location === '/settings'
    }
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed top-0 left-0 z-50 h-full w-64 bg-background border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div 
              className="flex items-center space-x-2 cursor-pointer transition-all duration-200 hover:scale-105"
              onClick={handleLogoClick}
              title="Double-click to go to Dashboard"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                CM
              </div>
              <div>
                <div className="font-bold text-foreground">Call Me Mobiles</div>
                <div className="text-xs text-muted-foreground">Expense Tracker</div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="lg:hidden transition-all duration-200 hover:scale-105"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105",
                    item.current
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                  {item.current && (
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {language === 'en' ? 'Theme' : 'థీమ్'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="h-8 w-8 p-0 transition-all duration-200 hover:scale-105"
              >
                {theme === 'dark' ? '🌞' : '🌙'}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {language === 'en' ? 'Language' : 'భాష'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleLanguage}
                className="h-8 px-2 text-xs transition-all duration-200 hover:scale-105"
              >
                {language === 'en' ? 'EN' : 'తె'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
