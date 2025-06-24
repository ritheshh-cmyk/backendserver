import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
}

export default function StatsCard({ title, value, subtitle, icon, className }: StatsCardProps) {
  const displayValue = typeof value === 'number' ? formatCurrency(value) : value;

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-business-neutral">{title}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{displayValue}</p>
            {subtitle && (
              <p className="text-xs text-business-neutral mt-1">{subtitle}</p>
            )}
          </div>
          {icon && (
            <div className="text-primary">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
