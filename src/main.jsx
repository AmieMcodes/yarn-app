import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";

import "./index.css";

import { auth } from "./utils/firebaseClient";
import MainNav from "./components/MainNav";

// Screens
import Login from "./screens/Login.jsx";
import Projects from "./screens/Projects.jsx";
import Stash from "./screens/Stash.jsx";
import Dashboard from "./screens/Dashboard.jsx";
import Admin from "./screens/AdminRoute.jsx";
import AdminRoute from "./routes/AdminRoute.jsx";
import AdminDashboard from "./screens/AdminDashboard.jsx";

/** ---------- Small route guards ---------- */

// Wait for auth; if no user → /login
function Protected() {
  const [ready, setReady] = React.useState(false);
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    const off = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setReady(true);
    });
    return () => off();
  }, []);

  if (!ready) return null; // or a spinner
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet context={{ user }} />;
}

// Only allow admins
function AdminOnly() {
  const [role, setRole] = React.useState("");
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const off = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setRole("");
        setReady(true);
        return;
      }
      // lazy import to avoid circulars
      const { db } = await import("./utils/firebaseClient");
      const { doc, getDoc } = await import("firebase/firestore");
      const snap = await getDoc(doc(db, "users", u.uid));
      setRole(snap.exists() ? snap.data()?.role || "" : "");
      setReady(true);
    });
    return () => off();
  }, []);

  if (!ready) return null;
  if (role !== "admin") return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

/** ---------- App shell with top nav ---------- */
function Shell() {
  return (
    <div className="min-h-screen bg-brand-cream">
      <MainNav />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Authed app */}
        <Route element={<Protected />}>
          <Route element={<Shell />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/stash" element={<Stash />} />

<Route element={<AdminRoute />}>
  <Route path="/admin" element={<AdminDashboard />} />
</Route>
            {/* Admin section */}
            <Route element={<AdminOnly />}>
              <Route path="/admin" element={<Admin />} />
            </Route>
          </Route>
        </Route>

        {/* Default: send people somewhere sensible */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

