import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../utils/firebaseClient";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

/**
 * Non-admin dashboard with hero + stat cards
 * (matches “Sample B – Hero” visual).
 */
export default function Dashboard() {
  const nav = useNavigate();

  const [uid, setUid] = useState(null);
  const [skeins, setSkeins] = useState(0);     // stash item count
  const [projects, setProjects] = useState(0); // projects count
  const [totalYards, setTotalYards] = useState(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        nav("/login", { replace: true });
      } else {
        setUid(u.uid);
      }
    });
    return unsub;
  }, [nav]);

  // live counts
  useEffect(() => {
    if (!uid) return;

    // stash count + total yards
    const stashQ = query(collection(db, "stash"), where("ownerId", "==", uid));
    const unsubStash = onSnapshot(stashQ, (snap) => {
      setSkeins(snap.size);
      let total = 0;
      snap.forEach((d) => {
        const x = d.data() || {};
        // be forgiving about field names
        const qty = Number(x.qty ?? x.quantity ?? 1);
        const yardsPer = Number(x.yardsPerSkein ?? x.yards ?? 0);
        total += qty * yardsPer;
      });
      setTotalYards(Number.isFinite(total) ? Math.round(total) : 0);
    });

    // projects count
    const projQ = query(collection(db, "projects"), where("ownerId", "==", uid));
    const unsubProjects = onSnapshot(projQ, (snap) => {
      setProjects(snap.size);
    });

    return () => {
      unsubStash();
      unsubProjects();
    };
  }, [uid]);

  async function handleSignOut() {
    await signOut(auth);
    nav("/login", { replace: true });
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="hero-panel mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/70 border border-white/60 px-3 py-1 text-sm">
              <span className="h-2 w-2 rounded-full bg-brand-navy" />
              <span className="text-brand-text/80">Yarn App</span>
            </span>
            <h1 className="mt-3 text-3xl md:text-4xl font-serif text-brand-navy">
              Welcome to Yarn App
            </h1>
            <p className="mt-1 text-brand-text/80">
              Track your yarn stash and projects — all in one place.
            </p>
          </div>

          <button
            onClick={handleSignOut}
            className="rounded-lg bg-white text-brand-text border border-gray-300 px-4 py-2 hover:bg-gray-50"
          >
            Sign out
          </button>
        </div>

        {/* stat cards */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card p-5">
            <div className="text-sm text-brand-text/70 mb-1">Yarn Skeins</div>
            <div className="text-2xl font-semibold text-brand-navy">{skeins}</div>
          </div>
          <div className="card p-5">
            <div className="text-sm text-brand-text/70 mb-1">Projects</div>
            <div className="text-2xl font-semibold text-brand-navy">{projects}</div>
          </div>
          <div className="card p-5">
            <div className="text-sm text-brand-text/70 mb-1">Total yards (form)</div>
            <div className="text-2xl font-semibold text-brand-navy">{totalYards}</div>
          </div>
        </div>
      </div>

      {/* Below the hero you can render recent sections */}
      {/* <RecentYarn />  <RecentProjects /> etc. */}
    </div>
  );
}

