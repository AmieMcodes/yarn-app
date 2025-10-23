import { useState } from "react";
import { db } from "../utils/firebaseClient";
import {
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  collection,
  query,
  where,
  limit,
} from "firebase/firestore";

/**
 * AdminRoleTools
 * - Promote/Demote by UID (always works)
 * - Optional: Promote by Email if you have a "users" collection with { email } fields
 */
export default function AdminRoleTools() {
  const [uid, setUid] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function promoteByUid() {
    if (!uid.trim()) return;
    setBusy(true); setStatus("Promoting…");
    try {
      await setDoc(doc(db, "roles", uid.trim()), { role: "admin", updatedAt: Date.now() });
      setStatus(`✅ Promoted UID ${uid.trim()} to admin.`);
    } catch (e) {
      setStatus(`❌ ${String(e?.message || e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function demoteByUid() {
    if (!uid.trim()) return;
    setBusy(true); setStatus("Demoting…");
    try {
      await deleteDoc(doc(db, "roles", uid.trim()));
      setStatus(`✅ Demoted UID ${uid.trim()} (roles doc removed).`);
    } catch (e) {
      setStatus(`❌ ${String(e?.message || e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function promoteByEmail() {
    if (!email.trim()) return;
    setBusy(true); setStatus("Looking up email…");
    try {
      const q = query(
        collection(db, "users"),
        where("email", "==", email.trim().toLowerCase()),
        limit(1)
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        setStatus("❌ No user found in Firestore/users with that email. Paste a UID instead.");
        setBusy(false);
        return;
      }
      const docSnap = snap.docs[0];
      const foundUid = docSnap.id;
      await setDoc(doc(db, "roles", foundUid), { role: "admin", updatedAt: Date.now() });
      setStatus(`✅ Promoted ${email.trim()} (UID ${foundUid}) to admin.`);
    } catch (e) {
      setStatus(`❌ ${String(e?.message || e)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border p-4 space-y-4 bg-white/70">
      <h3 className="text-lg font-semibold">Admin Role Tools</h3>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-sm">Promote/Demote by UID</label>
          <input
            value={uid}
            onChange={(e) => setUid(e.target.value)}
            placeholder="Paste user UID"
            className="w-full rounded-2xl border p-2"
          />
          <div className="flex gap-2">
            <button
              className="rounded-2xl border px-3 py-1 disabled:opacity-50"
              onClick={promoteByUid}
              disabled={busy || !uid.trim()}
            >
              Promote to Admin
            </button>
            <button
              className="rounded-2xl border px-3 py-1 disabled:opacity-50"
              onClick={demoteByUid}
              disabled={busy || !uid.trim()}
            >
              Demote (Remove Role)
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm">Promote by Email (optional)</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="w-full rounded-2xl border p-2"
          />
          <button
            className="rounded-2xl border px-3 py-1 disabled:opacity-50"
            onClick={promoteByEmail}
            disabled={busy || !email.trim()}
          >
            Promote by Email
          </button>
          <p className="text-xs text-neutral-500">
            Requires a <code>users</code> collection with docs keyed by UID that include an <code>email</code> field.
          </p>
        </div>
      </div>

      {status && <div className="text-sm">{status}</div>}
    </div>
  );
}

