"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "ANALYST" | "ADMIN";
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string, userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function buildUserFromStorage(): User | null {
  const accessToken =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const userRole =
    typeof window !== "undefined" ? localStorage.getItem("userRole") : null;
  const userFirstName =
    typeof window !== "undefined"
      ? localStorage.getItem("userFirstName")
      : null;
  const userLastName =
    typeof window !== "undefined" ? localStorage.getItem("userLastName") : null;
  const userEmail =
    typeof window !== "undefined" ? localStorage.getItem("userEmail") : null;

  if (!accessToken || !userRole) return null;

  return {
    id: "",
    email: userEmail || "",
    firstName: userFirstName || "",
    lastName: userLastName || "",
    role: userRole as "ANALYST" | "ADMIN",
    isActive: true,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = buildUserFromStorage();
    setUser(stored);
    setIsLoading(false);
  }, []);

  const login = useCallback(
    (accessToken: string, refreshToken: string, userData: User) => {
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("userRole", userData.role);
      localStorage.setItem("userFirstName", userData.firstName);
      localStorage.setItem("userLastName", userData.lastName);
      localStorage.setItem("userEmail", userData.email);
      setUser(userData);
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (token) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {
      // Continue with local logout even if backend call fails
    }
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userFirstName");
    localStorage.removeItem("userLastName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userProfile");
    setUser(null);
    window.location.href = "/";
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
