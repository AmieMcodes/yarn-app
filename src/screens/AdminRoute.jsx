import { useEffect, useState } from "react";
import { auth, db } from "../utils/firebaseClient";
import { doc, getDoc } from "firebase/firestore";

export default function AdminRoute() {
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkRole() {
      const user = auth.currentUser;
      if (!user) {
        setRole("");
        setLoading(false);
        return;
      }
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        setRole(snap.exists() ? (snap.data().role || "") : "");
      } catch (err) {
        console.error("Error checking role:", err);
        setRole("");
      } finally {
        setLoading(false);
      }
    }
    checkRole();
  }, []);

  if (loading) return <div className="p-6">Loading admin dashboard…</div>;
  if (role !== "admin") return <div className="p-6 text-red-600">Access denied. Admins only.</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-semibold text-brand-navy mb-4">Admin Dashboard</h1>
      <p className="text-brand-navy/80">Welcome, admin! You now have tools to manage users and content.</p>
      {/* Add your real admin widgets/components here */}
    </div>
  );
}


