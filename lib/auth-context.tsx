"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  AuthError,
  IdTokenResult,
} from "firebase/auth";
import { auth } from "./firebase";
import { useRouter } from "next/navigation";

interface CustomClaims {
  isOwner?: boolean;
  [key: string]: unknown;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  customClaims: CustomClaims | null;
  isOwner: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshClaims: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [customClaims, setCustomClaims] = useState<CustomClaims | null>(null);
  const router = useRouter();

  const fetchCustomClaims = async (currentUser: User) => {
    try {
      const tokenResult: IdTokenResult = await currentUser.getIdTokenResult();
      setCustomClaims(tokenResult.claims as CustomClaims);
    } catch (error) {
      console.error("Failed to fetch custom claims:", error);
      setCustomClaims(null);
    }
  };

  const refreshClaims = async () => {
    if (user) {
      // Force refresh the token to get latest claims
      await user.getIdToken(true);
      await fetchCustomClaims(user);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        await fetchCustomClaims(user);
      } else {
        setCustomClaims(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      const authError = error as AuthError;
      throw new Error(authError.message || "Failed to sign in");
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      const authError = error as AuthError;
      throw new Error(authError.message || "Failed to sign out");
    }
  };

  const isOwner = customClaims?.isOwner === true;

  return (
    <AuthContext.Provider value={{ user, loading, customClaims, isOwner, login, logout, refreshClaims }}>
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

