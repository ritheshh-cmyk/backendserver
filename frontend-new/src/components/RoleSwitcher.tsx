import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRole } from "@/hooks/use-role";
import { User, Shield } from "lucide-react";

export function RoleSwitcher() {
  const { role } = useRole();

  const switchRole = (newRole: "admin" | "worker") => {
    localStorage.setItem("role", newRole);
    window.location.reload();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {role === "admin" ? <Shield className="h-4 w-4" /> : <User className="h-4 w-4" />}
          <Badge variant={role === "admin" ? "default" : "secondary"}>
            {role === "admin" ? "Admin" : "Worker"}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Switch Role (Testing)</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => switchRole("admin")} disabled={role === "admin"}>
          <Shield className="mr-2 h-4 w-4" />
          Admin (Full Access)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => switchRole("worker")} disabled={role === "worker"}>
          <User className="mr-2 h-4 w-4" />
          Worker (Limited Access)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 