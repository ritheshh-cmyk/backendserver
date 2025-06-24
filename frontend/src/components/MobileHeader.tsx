import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { 
  Menu, 
  X
} from "lucide-react";

interface MobileHeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export default function MobileHeader({ isSidebarOpen, onToggleSidebar }: MobileHeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage } = useLanguage();
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

  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b border-border lg:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo */}
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

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="h-8 w-8 p-0 transition-all duration-200 hover:scale-105"
          >
            {theme === 'dark' ? '🌞' : '🌙'}
              </Button>

          {/* Language Toggle */}
                <Button 
                  variant="ghost" 
                  size="sm" 
            onClick={toggleLanguage}
            className="h-8 px-2 text-xs transition-all duration-200 hover:scale-105"
                >
            {language === 'en' ? 'EN' : 'తె'}
                </Button>

          {/* Menu Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className="h-8 w-8 p-0 transition-all duration-200 hover:scale-105"
          >
            {isSidebarOpen ? (
              <X className="w-4 h-4" />
            ) : (
              <Menu className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
