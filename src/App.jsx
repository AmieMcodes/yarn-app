import React, { useEffect, useState } from "react";
import { auth, googleProvider, db } from "./firebase";
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";

export default function App() {
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const [samples, setSamples] = useState([]);
  const [adding, setAdding] = useState(false);
  const [dataErr, setDataErr] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    setSamples([]); setDataErr("");
    if (!user) return;
    const q = query(collection(db, "samples"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => setSamples(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (e) => setDataErr(e.message || "Data error")
    );
    return () => unsub();
  }, [user]);

  async function handleEmailAuth(e) {
    e.preventDefault();
    setBusy(true); setErr(""); setMsg("");
    try {
      if (mode === "sign-up") {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
        setMsg("Account created. You are signed in.");
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        setMsg("Welcome back!");
      }
      setEmail(""); setPassword("");
    } catch (e) {
      setErr(e.message || "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true); setErr(""); setMsg("");
    try {
      await signInWithPopup(auth, googleProvider);
      setMsg("Signed in with Google.");
    } catch (e) {
      setErr(e.message || "Google sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    setBusy(true); setErr(""); setMsg("");
    try {
      await signOut(auth);
      setMsg("Signed out.");
    } catch (e) {
      setErr(e.message || "Sign out failed");
    } finally {
      setBusy(false);
    }
  }

  async function addSample() {
    if (!user) return;
    setAdding(true); setDataErr("");
    try {
      await addDoc(collection(db, "samples"), {
        note: "Hello from Milestone 2 bonus 🌟",
        uid: user.uid,
        email: user.email || null,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      setDataErr(e.message || "Add failed");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="min-h-screen">
      <header className="surface-warm border-b"><div className="mx-auto max-w-5xl px-4 py-6 flex items-center justify-between"><h1 className="text-2xl font-semibold tracking-tight display-font heading-navy">Yarn Over Needles</h1><span className="text-sm muted">Craft Management</span></div></header>

      <main className="mx-auto max-w-5xl px-4 py-10 surface-soft">
        {!user ? (
          <div className="mx-auto max-w-lg card p-6">
            <h2 className="text-lg font-medium mb-2">Welcome 👋</h2>
            <p className="text-gray-600 mb-6">
              Create a test account and sign in. This is the “empty house” we’ll furnish with features next.
            </p>

            <div className="mb-4 inline-flex rounded-2xl border p-1" style={{ borderColor: "var(--card-ring)" }}>
              <button
                className={`px-4 py-1 rounded-xl text-sm ${mode === "sign-in" ? "bg-white shadow ring-1" : "muted"}`}
                style={mode === "sign-in" ? { borderColor: "var(--card-ring)" } : {}}
                onClick={() => setMode("sign-in")}
                type="button"
              >
                Sign in
              </button>
              <button
                className={`px-4 py-1 rounded-xl text-sm ${mode === "sign-up" ? "bg-white shadow ring-1" : "muted"}`}
                style={mode === "sign-up" ? { borderColor: "var(--card-ring)" } : {}}
                onClick={() => setMode("sign-up")}
                type="button"
              >
                Create account
              </button>
            </div>

            <form onSubmit={handleEmailAuth} className="grid gap-3">
              <label className="grid gap-1">
                <span className="text-sm text-gray-700">Email</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="field"
                  placeholder="you@example.com"
                />
              </label>

              <label className="grid gap-1">
                <span className="text-sm text-gray-700">Password</span>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="field"
                  placeholder="******"
                />
              </label>

              <button type="submit" disabled={busy} className="btn btn-primary w-full mt-1">
                {busy ? "Working…" : mode === "sign-in" ? "Sign in" : "Create account"}
              </button>
            </form>

            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1" style={{ background: "var(--card-ring)" }} />
              <span className="text-xs muted">or</span>
              <div className="h-px flex-1" style={{ background: "var(--card-ring)" }} />
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              disabled={busy}
              className="btn btn-outline w-full"
              title="Sign in with Google"
            >
              Continue with Google
            </button>

            {err && <p className="mt-4 text-sm text-red-600">{err}</p>}
            {msg && !err && <p className="mt-4 text-sm text-green-700">{msg}</p>}

            <p className="caption mt-6">
              Tip: Firebase Auth providers are enabled for Email/Password and Google. localhost is allowed by default.
            </p>
          </div>
        ) : (
          <div className="mx-auto max-w-lg card p-6">
            <h2 className="text-lg font-medium mb-2">You’re signed in ✅</h2>

            <div className="rounded-2xl border p-4 bg-gray-50" style={{ borderColor: "var(--card-ring)" }}>
              <p className="text-sm text-gray-700"><span className="font-medium">UID:</span> {user.uid}</p>
              <p className="text-sm text-gray-700"><span className="font-medium">Email:</span> {user.email}</p>
              {user.displayName && (
                <p className="text-sm text-gray-700"><span className="font-medium">Name:</span> {user.displayName}</p>
              )}
            </div>

            <div className="mt-6 rounded-2xl border p-4" style={{ borderColor: "var(--brand-ring)", background: "#eef6ff" }}>
              <h3 className="font-medium mb-2">Live data layer (Firestore) 🌟</h3>
              <p className="text-sm text-gray-700 mb-3">
                Below is a live list from the <code>samples</code> collection.
              </p>

              <button
                type="button"
                onClick={addSample}
                disabled={adding}
                className="btn btn-primary"
              >
                {adding ? "Adding…" : "Add a sample row"}
              </button>

              {dataErr && <p className="mt-3 text-sm text-red-600">{dataErr}</p>}

              <ul className="mt-4 space-y-2">
                {samples.length === 0 ? (
                  <li className="text-sm muted">No rows yet. Click “Add a sample row”.</li>
                ) : (
                  samples.map((s) => (
                    <li key={s.id} className="rounded-xl bg-white border p-3" style={{ borderColor: "var(--card-ring)" }}>
                      <p className="text-sm"><span className="font-medium">note:</span> {s.note}</p>
                      <p className="text-xs muted mt-1">id: {s.id}</p>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              disabled={busy}
              className="btn w-full mt-6"
              style={{ background: "#111827", color: "white" }}
            >
              {busy ? "Working…" : "Sign out"}
            </button>

            <p className="caption mt-6">
              This is your live login shell + a small data stub. Next milestones will add roles, routes, and real data.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
