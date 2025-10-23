// src/components/ProjectDetailsModal.jsx
import { useEffect, useRef, useState } from "react";
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "../utils/firebaseClient";

async function resolveUrl(input) {
  if (!input) return null;
  if (typeof input === "string") {
    if (input.startsWith("http")) return input;
    return await getDownloadURL(ref(storage, input));
  }
  if (typeof input === "object") {
    const direct = input.url || input.href;
    if (direct && direct.startsWith("http")) return direct;
    const p = input.path || input.storagePath;
    if (p) return await getDownloadURL(ref(storage, p));
  }
  return null;
}

export default function ProjectDetailsModal({ project, onClose, onSave, focusNotes }) {
  const [notes, setNotes] = useState(project?.notes || "");
  const [openingKey, setOpeningKey] = useState(null);
  const notesRef = useRef(null);

  useEffect(() => setNotes(project?.notes || ""), [project?.id]);

  useEffect(() => {
    if (focusNotes && notesRef.current) {
      const el = notesRef.current;
      el.focus();
      const len = el.value.length;
      el.setSelectionRange(len, len);
    }
  }, [focusNotes]);

  if (!project) return null;

  const viewFile = async (fileLike, idx) => {
    try {
      setOpeningKey(idx);
      const url = await resolveUrl(fileLike);
      if (!url) return alert("File URL not found.");
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      console.error(e);
      alert("Could not open that PDF yet.");
    } finally {
      setOpeningKey(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
         onClick={onClose} role="dialog" aria-modal="true">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl"
           onClick={(e) => e.stopPropagation()}>
        <header className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{project.name || "Project"}</h2>
          <button onClick={onClose}
                  className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">Close</button>
        </header>

        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium">Notes</span>
            <textarea
              ref={notesRef}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              className="mt-1 w-full rounded-xl border p-3 outline-none focus:ring-2"
              placeholder="Add any notes about this project…"
            />
          </label>

          <div>
            <h3 className="text-sm font-medium mb-2">Files</h3>
            {Array.isArray(project.files) && project.files.length > 0 ? (
              <div className="space-y-2">
                {project.files.map((f, idx) => {
                  const label =
                    (typeof f === "object" && (f.name || f.filename)) ||
                    (typeof f === "string" && f.split("/").pop()) ||
                    `File ${idx + 1}`;
                  return (
                    <div key={idx} className="flex items-center justify-between rounded-lg border p-2">
                      <span className="truncate text-sm">{label}</span>
                      <button
                        onClick={() => viewFile(f, idx)}
                        className="rounded-xl border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-60"
                        disabled={openingKey === idx}
                      >
                        {openingKey === idx ? "Opening…" : "View"}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No files uploaded yet.</p>
            )}
          </div>
        </div>

        <footer className="mt-5 flex gap-2">
          <button onClick={() => onSave({ ...project, notes })}
                  className="rounded-xl bg-black px-4 py-2 text-white hover:opacity-90">
            Save
          </button>
          <button onClick={onClose}
                  className="rounded-xl border px-4 py-2 hover:bg-gray-50">
            Done
          </button>
        </footer>
      </div>
    </div>
  );
}

