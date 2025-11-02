import { createContext, useContext } from "react";
import { useAuth as useClerkAuth } from "@clerk/nextjs";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const { isLoaded, userId, sessionId, isSignedIn, getToken } = useClerkAuth();

  return (
    <AuthContext.Provider
      value={{
        isLoaded,
        isSignedIn,
        userId,
        sessionId,
        getToken
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};