import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../utils/firebaseClient";
import { doc, getDoc } from "firebase/firestore";

export default function MainNav() {
  const nav = useNavigate();
  const [role, setRole] = useState("");

  useEffect(() => {
    const off = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setRole("");
        return;
      }
      try {
        const r = await getDoc(doc(db, "users", u.uid));
        setRole(r.exists() ? r.data()?.role || "" : "");
      } catch {
        setRole("");
      }
    });
    return () => off();
  }, []);

  const item =
    "px-3 py-2 rounded-lg text-sm font-medium text-brand-navy/80 hover:text-brand-navy hover:bg-white/60";
  const active = " !text-brand-navy bg-white ";

  return (
    <header className="w-full bg-brand-cream border-b border-black/5">
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        <NavLink to="/" className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-brand-navy" />
          <span className="text-xl font-semibold text-brand-navy">Yarn App</span>
        </NavLink>

        <div className="flex items-center gap-1">
          <NavLink
            to="/projects"
            className={({ isActive }) => `${item} ${isActive ? active : ""}`}
          >
            Projects
          </NavLink>
          <NavLink
            to="/stash"
            className={({ isActive }) => `${item} ${isActive ? active : ""}`}
          >
            Stash
          </NavLink>
          {role === "admin" && (
            <NavLink
              to="/admin"
              className={({ isActive }) => `${item} ${isActive ? active : ""}`}
            >
              Admin
            </NavLink>
          )}
          <button
            onClick={async () => {
              await signOut(auth);
              nav("/login", { replace: true });
            }}
            className="ml-2 px-3 py-2 rounded-lg text-sm font-medium text-brand-navy/80 hover:text-brand-navy hover:bg-white/60"
          >
            Logout
          </button>
        </div>
      </nav>
    </header>
  );
}

