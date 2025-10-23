/**
 * AdminRoute
 * - Waits for Firebase Auth to report the current user
 * - Loads Firestore: users/{uid}
 * - Allows access only if role === "admin"
 *
 * Router usage:
 * <Route element={<AdminRoute />}>
 *   <Route path="/admin" element={<AdminDashboard />} />
 * </Route>
 */

import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { auth, db } from "../utils/firebaseClient";
import { doc, getDoc } from "firebase/firestore";

export default function AdminRoute() {
  const location = useLocation();
  const [role, setRole] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      try {
        if (!user) {
          setRole(null);
          setReady(true);
          return;
        }
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        const data = snap.exists() ? snap.data() : {};
        setRole(data.role ?? null);
      } catch (e) {
        console.error("AdminRoute error:", e);
        setRole(null);
      } finally {
        setReady(true);
      }
    });
    return () => unsub();
  }, []);

  // *** your must-keep logic ***
  if (!ready) return null;
  if (role !== "admin") return <Navigate to="/dashboard" replace state={{ from: location }} />;
  return <Outlet />;
}

