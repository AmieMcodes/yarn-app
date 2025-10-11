import React, { useEffect, useState } from "react";
import { auth, googleProvider } from "./firebase";
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";

export default function App() {
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState("sign-in"); // "sign-in" | "sign-up"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  async function handleEmailAuth(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      if (mode === "sign-up") {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
        setMsg("Account created. You are signed in.");
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        setMsg("Welcome back!");
      }
      setEmail("");
      setPassword("");
    } catch (e) {
      setErr(e.message || "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    setErr("");
    setMsg("");
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
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      await signOut(auth);
      setMsg("Signed out.");
    } catch (e) {
      setErr(e.message || "Sign out failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">Yarn App</h1>
          <span className="text-sm text-gray-500">Milestone 1 · Setup & Login Shell</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10">
        {!user ? (
          <div className="mx-auto max-w-lg rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 p-6">
            <h2 className="text-lg font-medium mb-2">Welcome 👋</h2>
            <p className="text-gray-600 mb-6">
              Create a test account and sign in. This is the “empty house” we’ll furnish with features next.
            </p>

            <div className="mb-4 inline-flex rounded-xl border border-gray-200 bg-gray-100 p-1">
              <button
                className={`px-4 py-1 rounded-lg text-sm ${mode === "sign-in" ? "bg-white shadow ring-1 ring-gray-200" : "text-gray-600"}`}
                onClick={() => setMode("sign-in")}
                type="button"
              >
                Sign in
              </button>
              <button
                className={`px-4 py-1 rounded-lg text-sm ${mode === "sign-up" ? "bg-white shadow ring-1 ring-gray-200" : "text-gray-600"}`}
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
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-300"
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
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-300"
                  placeholder="******"
                />
              </label>

              <button
                type="submit"
                disabled={busy}
                className="mt-1 w-full rounded-xl bg-sky-600 px-4 py-2 font-medium text-white disabled:opacity-60"
              >
                {busy ? "Working…" : mode === "sign-in" ? "Sign in" : "Create account"}
              </button>
            </form>

            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-xs text-gray-500">or</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              disabled={busy}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 font-medium hover:bg-gray-50 disabled:opacity-60"
              title="Sign in with Google"
            >
              Continue with Google
            </button>

            {err && <p className="mt-4 text-sm text-red-600">{err}</p>}
            {msg && !err && <p className="mt-4 text-sm text-green-700">{msg}</p>}

            <p className="text-xs text-gray-400 mt-6">
              Tip: Firebase Auth providers are enabled for Email/Password and Google. localhost is allowed by default.
            </p>
          </div>
        ) : (
          <div className="mx-auto max-w-lg rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 p-6">
            <h2 className="text-lg font-medium mb-2">You’re signed in ✅</h2>
            <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
              <p className="text-sm text-gray-700"><span className="font-medium">UID:</span> {user.uid}</p>
              <p className="text-sm text-gray-700"><span className="font-medium">Email:</span> {user.email}</p>
              {user.displayName && (
                <p className="text-sm text-gray-700"><span className="font-medium">Name:</span> {user.displayName}</p>
              )}
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              disabled={busy}
              className="mt-6 w-full rounded-xl bg-gray-900 px-4 py-2 font-medium text-white disabled:opacity-60"
            >
              {busy ? "Working…" : "Sign out"}
            </button>

            <p className="text-xs text-gray-400 mt-6">
              This is your live login shell. Next milestones will add roles, routes, and real data.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
