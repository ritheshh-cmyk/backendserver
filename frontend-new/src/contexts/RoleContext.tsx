import { createContext, useContext, ReactNode } from "react";

// You can expand this with real logic later
const RoleContext = createContext<{ role: string }>({ role: "admin" });

export function RoleProvider({ children }: { children: ReactNode }) {
  // You can fetch/set role from auth/user data here
  return (
    <RoleContext.Provider value={{ role: "admin" }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
} 