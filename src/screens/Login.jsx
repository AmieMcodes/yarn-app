import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { ensureUserDoc } from "../utils/ensureUserDoc";
import { auth } from "../utils/firebaseClient";

export default function Login() {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const nav = useNavigate();

  async function handleEmailSubmit(e) {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      const cred = mode === "signin"
        ? await signInWithEmailAndPassword(auth, email.trim(), pass)
        : await createUserWithEmailAndPassword(auth, email.trim(), pass);
      await ensureUserDoc(cred.user);
      nav("/dashboard", { replace: true });
    } catch (e) {
      setErr(e.message || String(e));
    } finally { setBusy(false); }
  }

  async function handleGoogle() {
    setErr(""); setBusy(true);
    try {
      const cred = await signInWithPopup(auth, new GoogleAuthProvider());
      await ensureUserDoc(cred.user);
      nav("/dashboard", { replace: true });
    } catch (e) {
      setErr(e.message || String(e));
    } finally { setBusy(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-cream px-4">
      <div className="max-w-md w-full bg-white/70 rounded-2xl shadow p-8">
        <div className="text-center mb-6">
          <span className="inline-block text-sm text-brand-navy font-medium">🧶 Yarn App</span>
          <h1 className="text-2xl font-semibold text-brand-navy mt-2">
            {mode === "signin" ? "Welcome back!" : "Create your Yarn App account"}
          </h1>
        </div>

        <button onClick={handleGoogle} disabled={busy}
          className="w-full mb-4 bg-brand-navy text-white py-2 rounded-lg hover:bg-brand-blue transition">
          Continue with Google
        </button>

        <div className="flex items-center mb-4">
          <div className="flex-grow border-t border-gray-300" />
          <span className="mx-2 text-sm text-gray-500">or</span>
          <div className="flex-grow border-t border-gray-300" />
        </div>

        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <input type="email" placeholder="Email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded" required />
          <input type="password" placeholder="Password" value={pass}
            onChange={(e) => setPass(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded" required />
          {err && <p className="text-red-600 text-sm">{err}</p>}
          <button type="submit" disabled={busy}
            className="w-full bg-brand-navy text-white py-2 rounded-lg hover:bg-brand-blue transition">
            {busy ? "Working..." : mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm mt-4">
          {mode === "signin" ? (
            <>New here?{" "}
              <button type="button" onClick={() => setMode("signup")} className="text-brand-navy underline">
                Create an account
              </button></>
          ) : (
            <>Already have an account?{" "}
              <button type="button" onClick={() => setMode("signin")} className="text-brand-navy underline">
                Sign in
              </button></>
          )}
        </p>
      </div>
    </div>
  );
}

