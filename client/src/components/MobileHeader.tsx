import { useState } from "react";
import { Link, useLocation } from "wouter";
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
  X
} from "lucide-react";

interface MobileHeaderProps {
  onExport?: () => void;
}

export default function MobileHeader({ onExport }: MobileHeaderProps) {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navigation = [
    { name: "New Transaction", href: "/", icon: PlusCircle, current: location === "/" },
    { name: "Transaction History", href: "/history", icon: History, current: location === "/history" },
    { name: "Customers", href: "/customers", icon: Users, current: location === "/customers" },
    { name: "Reports", href: "/reports", icon: BarChart3, current: location === "/reports" },
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
                <h1 className="text-lg font-bold text-foreground">PhoneRepair Pro</h1>
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
          <h1 className="text-lg font-semibold text-foreground">PhoneRepair Pro</h1>
        </div>
        <Button 
          onClick={onExport}
          size="sm"
          className="bg-primary text-white px-3 py-2 text-sm font-medium"
        >
          <Download className="w-4 h-4 mr-1" />
          Export
        </Button>
      </div>
    </header>
  );
}
