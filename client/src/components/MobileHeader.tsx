import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  Menu, 
  Download, 
  PlusCircle, 
  History, 
  Users, 
  BarChart3,
  X,
  Package,
  CreditCard,
  Store
} from "lucide-react";

interface MobileHeaderProps {
  onExport?: () => void;
}

export default function MobileHeader({ onExport }: MobileHeaderProps) {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();

  const navigation = [
    { name: t('newTransaction'), href: "/", icon: PlusCircle, current: location === "/" },
    { name: t('transactionHistory'), href: "/history", icon: History, current: location === "/history" },
    { name: t('inventory'), href: "/inventory", icon: Package, current: location === "/inventory" },
    { name: t('expenditure'), href: "/expenditure", icon: CreditCard, current: location === "/expenditure" },
    { name: t('suppliers'), href: "/suppliers", icon: Store, current: location === "/suppliers" },
    { name: t('reports'), href: "/reports", icon: BarChart3, current: location === "/reports" },
  ];

  return (
    <header className="lg:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h1 className="text-lg font-bold text-foreground">{t('appTitle')}</h1>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-2"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <nav className="px-4 py-6 space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.name} href={item.href}>
                      <div 
                        className={cn(
                          "flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors cursor-pointer",
                          item.current
                            ? "text-primary bg-blue-50"
                            : "text-business-neutral hover:text-foreground hover:bg-gray-50"
                        )}
                        onClick={() => setIsOpen(false)}
                      >
                        <Icon className="w-4 h-4 mr-3" />
                        {item.name}
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
          <h1 className="text-lg font-semibold text-foreground">{t('appTitle')}</h1>
        </div>
        <Button 
          onClick={onExport}
          size="sm"
          className="bg-primary text-white px-3 py-2 text-sm font-medium"
        >
          <Download className="w-4 h-4 mr-1" />
          {t('export')}
        </Button>
      </div>
    </header>
  );
}
