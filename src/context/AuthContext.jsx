import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { ref, get } from "firebase/database";
import { auth, rtdb } from "../router/Firebase"; // adjust path kung iba sayo

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // { uid, email, role }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // ✅ Check sessionStorage para iwas flicker
          const cachedRole = sessionStorage.getItem("userRole");

          if (cachedRole) {
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: cachedRole,
            });
          } else {
            // ✅ Fetch role from DB kung wala sa session
            const roleRef = ref(rtdb, `users/${firebaseUser.uid}/role`);
            const snapshot = await get(roleRef);

            if (snapshot.exists()) {
              const role = snapshot.val();
              sessionStorage.setItem("userRole", role); // cache per session

              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                role,
              });
            } else {
              console.warn("⚠️ No role found for user:", firebaseUser.email);
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                role: null,
              });
            }
          }
        } catch (error) {
          console.error("❌ Error fetching role:", error);
          setUser(null);
        }
      } else {
        setUser(null);
        sessionStorage.removeItem("userRole"); // clear on logout
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ✅ Logout function
  const logout = async () => {
    await signOut(auth);
    setUser(null);
    sessionStorage.removeItem("userRole");
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// ✅ Custom hook
export const useAuth = () => useContext(AuthContext);

export default AuthContext;
