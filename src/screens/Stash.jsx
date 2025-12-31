import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../utils/firebaseClient";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

/**
 * Stash (minimal)
 * - Only the main content: Add form → Add more details (post-save) → Your Stash list
 * - No extra top bar or sidebar; matches the rest of your pages
 * - Uses Firestore collection: 'stash'
 */

export default function Stash() {
  const navigate = useNavigate();
  const uid = auth.currentUser?.uid || null;

  // Form fields
  const [yarnName, setYarnName] = useState("");
  const [brand, setBrand] = useState("");
  const [weight, setWeight] = useState("");
  const [fiberContent, setFiberContent] = useState("");
  const [color, setColor] = useState("");
  const [purchasedFrom, setPurchasedFrom] = useState("");
  const [qty, setQty] = useState(1);
  const [yardagePerSkein, setYardagePerSkein] = useState(0);
  const [notes, setNotes] = useState("");

  // Enrichment (post-save)
  const [dyeLot, setDyeLot] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [care, setCare] = useState("");
  const [tags, setTags] = useState("");

  // UI state
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [savedId, setSavedId] = useState(null);
  const [moreOpen, setMoreOpen] = useState(true);

  // List
  const [items, setItems] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  useEffect(() => {
    if (!uid) navigate("/login");
  }, [uid, navigate]);

  // Live subscription to this user's stash
  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, "stash"),
      where("uid", "==", uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setItems(rows);
        setLoadingList(false);
      },
      () => setLoadingList(false)
    );
    return () => unsub();
  }, [uid]);

  const weightOptions = useMemo(
    () => ["Lace", "Fingering", "Sport", "DK", "Worsted", "Aran", "Bulky", "Super Bulky"],
    []
  );

  function resetForm() {
    setYarnName("");
    setBrand("");
    setWeight("");
    setFiberContent("");
    setColor("");
    setPurchasedFrom("");
    setQty(1);
    setYardagePerSkein(0);
    setNotes("");
  }

  async function handleAddYarn(e) {
    e.preventDefault();
    setError("");
    if (!uid) return setError("Please sign in to add yarn.");
    if (!yarnName.trim()) return setError("Yarn name is required.");
    if (!weight) return setError("Please select a weight.");
    if (!fiberContent.trim()) return setError("Fiber content is required.");

    setBusy(true);
    try {
      const payload = {
        uid,
        name: yarnName.trim(),
        brand: brand.trim() || null,
        weight,
        fiberContent: fiberContent.trim(),
        color: color.trim() || null,
        purchasedFrom: purchasedFrom.trim() || null,
        quantity: Number(qty) || 1,
        yardagePerSkein: Number(yardagePerSkein) || 0,
        notes: notes.trim() || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      const ref = await addDoc(collection(db, "stash"), payload);
      setSavedId(ref.id);
      setMoreOpen(true);
      resetForm();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Could not save yarn. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleQuickEnrich() {
    if (!savedId) return;
    setBusy(true);
    setError("");
    try {
      const ref = doc(db, "stash", savedId);
      const patch = { updatedAt: serverTimestamp() };
      if (dyeLot.trim()) patch.dyeLot = dyeLot.trim();
      if (price !== "") patch.price = Number(price);
      if (location.trim()) patch.location = location.trim();
      if (care.trim()) patch.care = care.trim();
      if (tags.trim())
        patch.tags = tags.split(",").map((t) => t.trim()).filter(Boolean);
      await updateDoc(ref, patch);
      setDyeLot(""); setPrice(""); setLocation(""); setCare(""); setTags("");
    } catch {
      setError("Could not add details. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F2ED]">
      {/* Main column only */}
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        {/* Add New Yarn */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h2 className="text-xl font-semibold text-slate-800">Add New Yarn</h2>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <form onSubmit={handleAddYarn} className="mt-6 space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Yarn Name *" placeholder="e.g., Merino Sock" value={yarnName} onChange={setYarnName} />
              <Field label="Brand" placeholder="e.g., Malabrigo" value={brand} onChange={setBrand} />
              <SelectField label="Weight *" value={weight} onChange={setWeight} options={weightOptions} placeholder="Select weight" />
              <Field label="Fiber Content *" placeholder="e.g., 100% Merino Wool" value={fiberContent} onChange={setFiberContent} />
              <Field label="Color" placeholder="e.g., Forest Green" value={color} onChange={setColor} />
              <Field label="Purchased From" placeholder="e.g., Local Yarn Shop" value={purchasedFrom} onChange={setPurchasedFrom} />
              <NumberField label="Quantity (skeins)" value={qty} onChange={setQty} min={1} />
              <NumberField label="Yardage per Skein" value={yardagePerSkein} onChange={setYardagePerSkein} min={0} />
            </div>

            <TextArea label="Notes" placeholder="Any additional notes about this yarn…" value={notes} onChange={setNotes} />

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="rounded-lg border px-4 py-2 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-lg bg-[#1B365D] px-4 py-2 font-medium text-white hover:opacity-95 disabled:opacity-60"
              >
                {busy ? "Saving…" : "Add Yarn"}
              </button>
            </div>
          </form>
        </div>

        {/* Add more details (only after save) */}
        {savedId && (
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">Add more details</h3>
              <button
                type="button"
                className="text-sm text-slate-600 underline-offset-4 hover:underline"
                onClick={() => setMoreOpen((s) => !s)}
              >
                {moreOpen ? "Hide" : "Show"}
              </button>
            </div>

            {moreOpen && (
              <div className="mt-4 space-y-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Dye Lot" placeholder="e.g., 7A" value={dyeLot} onChange={setDyeLot} />
                  <Field label="Price (total for this yarn)" placeholder="e.g., 24.99" value={price} onChange={setPrice} inputMode="decimal" />
                  <Field label="Storage Location" placeholder="e.g., Bin B – Closet" value={location} onChange={setLocation} />
                  <Field label="Care" placeholder="e.g., Hand wash, lay flat" value={care} onChange={setCare} />
                  <Field label="Tags" placeholder="comma-separated, e.g., sweater, gift" value={tags} onChange={setTags} />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleQuickEnrich}
                    className="rounded-lg bg-[#8C857B] px-4 py-2 text-white hover:opacity-95 disabled:opacity-60"
                  >
                    {busy ? "Updating…" : "Save Details"}
                  </button>

                  {/* Keep details link for later if you add a details page */}
                  <Link to={`/yarn/${savedId}`} className="text-sm text-[#1B365D] underline underline-offset-4">
                    Open full details →
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Your Stash list */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800">Your Stash</h3>
            <div className="text-xs text-slate-500">
              {loadingList ? "Loading…" : `${items.length} items`}
            </div>
          </div>

          {loadingList ? (
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : items.length === 0 ? (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              No yarn saved yet. Add your first skein above.
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {items.map((y) => (
                <YarnCard key={y.id} yarn={y} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Small UI helpers ---------- */

function Field({ label, value, onChange, placeholder = "", inputMode = "text" }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-slate-600">{label}</span>
      <input
        type="text"
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#1B365D]"
      />
    </label>
  );
}

function NumberField({ label, value, onChange, min = 0, step = "1" }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-slate-600">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        step={step}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-[#1B365D]"
      />
    </label>
  );
}

function SelectField({ label, value, onChange, options, placeholder }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-slate-600">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-[#1B365D]"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextArea({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-slate-600">{label}</span>
      <textarea
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-[#1B365D]"
      />
    </label>
  );
}

function YarnCard({ yarn }) {
  const chips = [
    yarn.weight,
    yarn.color,
    yarn.dyeLot ? `dye ${yarn.dyeLot}` : null,
    yarn.quantity != null ? `${yarn.quantity} skein${Number(yarn.quantity) === 1 ? "" : "s"}` : null,
  ].filter(Boolean);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-base font-semibold text-slate-900">
        {yarn.name || "Untitled Yarn"}
      </div>
      <div className="text-sm text-slate-600">
        {yarn.brand || "—"} · {yarn.fiberContent || "—"}
      </div>

      {chips.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {chips.map((c) => (
            <span
              key={c}
              className="rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-700"
            >
              {c}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 text-xs text-slate-500">
        Yardage/Sk: {yarn.yardagePerSkein ?? 0} • From: {yarn.purchasedFrom || "—"}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 animate-pulse">
      <div className="h-4 w-2/5 rounded bg-slate-200" />
      <div className="mt-2 h-3 w-3/5 rounded bg-slate-200" />
      <div className="mt-4 flex gap-2">
        <div className="h-5 w-14 rounded-full bg-slate-200" />
        <div className="h-5 w-16 rounded-full bg-slate-200" />
        <div className="h-5 w-12 rounded-full bg-slate-200" />
      </div>
    </div>
  );
}

