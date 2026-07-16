import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export function useMockAuth() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  
  // Safely initialize from localStorage only on client
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("crisiseye_session");
      if (stored) {
        setUserId(stored as Id<"users">);
      }
    }
  }, []);

  const registerMut = useMutation(api.mockAuth.register);
  const loginMut = useMutation(api.mockAuth.login);
  const logoutMut = useMutation(api.mockAuth.logout);
  
  // Query for the user document natively, similar to how Convex auth works
  const user = useQuery(api.users.current, { mockUserId: userId ?? undefined });

  const signIn = async (method: string, args: any) => {
    let id: Id<"users">;
    if (args.flow === "signUp") {
      id = await registerMut({
        name: args.name,
        email: args.email,
        password: args.password,
      });
    } else {
      id = await loginMut({
        email: args.email,
        password: args.password,
        isResponderPortal: args.isResponderPortal,
      });
    }
    
    // Create the session
    localStorage.setItem("crisiseye_session", id);
    setUserId(id);
  };

  const signOut = async () => {
    await logoutMut();
    localStorage.removeItem("crisiseye_session");
    setUserId(null);
  };

  return {
    isAuthenticated: !!userId,
    user,
    signIn,
    signOut,
  };
}
