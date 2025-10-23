// src/screens/Stash.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { db } from "../utils/firebaseClient";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";

function YarnDetailModal({ yarn, onClose, onSave, autoFocusNotes }) {
  const [notes, setNotes] = useState(yarn?.notes || "");
  const notesRef = useRef(null);

  useEffect(() => {
    setNotes(yarn?.notes || "");
  }, [yarn?.id]);

  useEffect(() => {
    if (autoFocusNotes && notesRef.current) {
      const el = notesRef.current;
      el.focus();
      const len = el.value.length;
      el.setSelectionRange(len, len);
    }
  }, [autoFocusNotes]);

  if (!yarn) return null;

  const handleSave = async () => {
    await onSave({ ...yarn, notes: notes?.trim() || "" });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{yarn.name || "Yarn"}</h2>
          <button
            onClick={onClose}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Close
          </button>
        </header>

        <div className="space-y-3">
          <div className="text-sm text-gray-600">
            <div><span className="font-medium">Brand:</span> {yarn.brand || "—"}</div>
            <div><span className="font-medium">Color:</span> {yarn.color || "—"}</div>
            <div><span className="font-medium">Weight:</span> {yarn.weight || "—"}</div>
            <div><span className="font-medium">Quantity:</span> {yarn.quantity ?? "—"}</div>
          </div>

          <label className="block">
            <span className="text-sm font-medium">Notes</span>
            <textarea
              ref={notesRef}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
              className="mt-1 w-full rounded-xl border p-3 outline-none focus:ring-2"
              placeholder="Add any notes about this yarn…"
            />
          </label>
        </div>

        <footer className="mt-5 flex gap-2">
          <button
            onClick={handleSave}
            className="rounded-xl bg-black px-4 py-2 text-white hover:opacity-90"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="rounded-xl border px-4 py-2 hover:bg-gray-50"
          >
            Done
          </button>
        </footer>
      </div>
    </div>
  );
}

export default function Stash() {
  const [yarns, setYarns] = useState([]);
  const [selectedYarn, setSelectedYarn] = useState(null);
  const [focusNotes, setFocusNotes] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "yarns"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setYarns(list);
    });
    return () => unsub();
  }, []);

  const openDetails = (y, { focus = false } = {}) => {
    setSelectedYarn({ ...y });
    setFocusNotes(Boolean(focus));
  };

  const closeDetails = () => {
    setSelectedYarn(null);
    setFocusNotes(false);
  };

  const saveNotes = async (updated) => {
    const ref = doc(db, "yarns", updated.id);
    await updateDoc(ref, { notes: updated.notes || "" });
    setSelectedYarn((prev) => (prev ? { ...prev, notes: updated.notes || "" } : prev));
  };

  const empty = useMemo(() => yarns.length === 0, [yarns]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-semibold">Yarn Stash</h1>
      <p className="mb-6 text-sm text-gray-600">
        Click <span className="font-medium">Add more notes</span> anytime to append thoughts about a yarn.
      </p>

      {empty ? (
        <p className="text-sm text-gray-600">No yarns yet. Add your first yarn to get started.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {yarns.map((y) => (
            <li key={y.id} className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-base font-medium truncate">{y.name || "Untitled Yarn"}</div>
                  <div className="text-xs text-gray-600">{y.brand || "—"} · {y.color || "—"}</div>
                  {y.notes ? (
                    <p className="mt-2 line-clamp-2 text-sm text-gray-700">{y.notes}</p>
                  ) : (
                    <p className="mt-2 text-sm text-gray-400 italic">No notes yet.</p>
                  )}
                </div>
                <div className="shrink-0 flex flex-col gap-2">
                  <button
                    onClick={() => openDetails(y)}
                    className="rounded-xl border px-3 py-1.5 text-sm hover:bg-gray-50"
                    aria-label="View details"
                    title="View details"
                  >
                    Details
                  </button>
                  <button
                    onClick={() => openDetails(y, { focus: true })}
                    className="rounded-xl bg-blue-600 px-3 py-1.5 text-sm text-white hover:opacity-90"
                    aria-label="Add more notes"
                    title="Add more notes"
                  >
                    Add more notes
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <YarnDetailModal
        key={selectedYarn?.id || "closed"}
        yarn={selectedYarn}
        onClose={closeDetails}
        onSave={saveNotes}
        autoFocusNotes={focusNotes}
      />
    </div>
  );
}

