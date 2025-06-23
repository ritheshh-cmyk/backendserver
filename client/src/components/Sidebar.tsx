import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  PlusCircle, 
  History, 
  Users, 
  BarChart3, 
  Download,
  Smartphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface SidebarProps {
  onExport?: () => void;
}

export default function Sidebar({ onExport }: SidebarProps) {
  const [location] = useLocation();
  const { t } = useLanguage();

  const navigation = [
    { name: t('newTransaction'), href: "/", icon: PlusCircle, current: location === "/" },
    { name: t('transactionHistory'), href: "/history", icon: History, current: location === "/history" },
    { name: t('customers'), href: "/customers", icon: Users, current: location === "/customers" },
    { name: t('reports'), href: "/reports", icon: BarChart3, current: location === "/reports" },
  ];

  return (
    <aside className="hidden lg:flex fixed lg:relative inset-y-0 left-0 z-50 w-64 bg-white shadow-lg flex-col border-r border-gray-200">
      <div className="flex items-center px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Smartphone className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">{t('appTitle')}</h1>
            <p className="text-xs text-business-neutral">{t('businessManagement')}</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.name} href={item.href}>
              <div className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer",
                item.current
                  ? "text-primary bg-blue-50"
                  : "text-business-neutral hover:text-foreground hover:bg-gray-50"
              )}>
                <Icon className="w-4 h-4 mr-3" />
                {item.name}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-gray-200">
        <Button 
          onClick={onExport}
          className="w-full bg-primary text-white hover:bg-blue-700"
        >
          <Download className="w-4 h-4 mr-2" />
          {t('exportToExcel')}
        </Button>
      </div>
    </aside>
  );
}
