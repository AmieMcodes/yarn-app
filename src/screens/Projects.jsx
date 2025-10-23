// src/screens/Projects.jsx
import { useEffect, useState, useRef } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../utils/firebaseClient";

function ProjectDetailsModal({ project, onClose, onSave, focusNotes }) {
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

  const openFile = async (fileLike, idx) => {
    try {
      setOpeningKey(idx);
      let url = null;

      if (typeof fileLike === "string") {
        if (fileLike.startsWith("http")) url = fileLike;
        else url = await getDownloadURL(ref(storage, fileLike));
      } else if (typeof fileLike === "object") {
        const direct = fileLike.url || fileLike.href;
        if (direct && direct.startsWith("http")) url = direct;
        else {
          const path = fileLike.path || fileLike.storagePath;
          if (path) url = await getDownloadURL(ref(storage, path));
        }
      }

      if (!url) {
        alert("Sorry, I couldn’t find the file URL.");
        return;
      }
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error(err);
      alert("Could not open that file. Please check permissions.");
    } finally {
      setOpeningKey(null);
    }
  };

  const handleSave = async () => {
    await onSave({ ...project, notes });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{project.name || "Project"}</h2>
          <button
            onClick={onClose}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Close
          </button>
        </header>

        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium">Notes</span>
            <textarea
              ref={notesRef}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
              className="mt-1 w-full rounded-xl border p-3 outline-none focus:ring-2"
              placeholder="Add or update notes about this project..."
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
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg border p-2"
                    >
                      <span className="truncate text-sm">{label}</span>
                      <button
                        onClick={() => openFile(f, idx)}
                        className="rounded-xl border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-60"
                        disabled={openingKey === idx}
                      >
                        {openingKey === idx ? "Opening…" : "View PDF"}
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
          <button
            onClick={handleSave}
            className="rounded-xl bg-black px-4 py-2 text-white hover:opacity-90"
          >
            Save Notes
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

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [newProject, setNewProject] = useState({ name: "", notes: "" });
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [focusNotes, setFocusNotes] = useState(false);

  // Fetch all projects
  useEffect(() => {
    const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setProjects(list);
    });
    return () => unsub();
  }, []);

  const addProject = async () => {
    if (!newProject.name.trim()) return alert("Please enter a name.");
    await addDoc(collection(db, "projects"), {
      name: newProject.name.trim(),
      notes: newProject.notes.trim(),
      createdAt: serverTimestamp(),
      files: [],
    });
    setNewProject({ name: "", notes: "" });
  };

  const deleteProject = async (id) => {
    if (!confirm("Delete this project?")) return;
    await deleteDoc(doc(db, "projects", id));
  };

  const uploadFile = async (id, file) => {
    if (!file) return;
    setUploading(true);
    try {
      const storagePath = `projects/${id}/${file.name}`;
      const fileRef = ref(storage, storagePath);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      await updateDoc(doc(db, "projects", id), {
        files: [
          ...(projects.find((p) => p.id === id)?.files || []),
          { name: file.name, path: storagePath, url },
        ],
      });
    } catch (err) {
      console.error(err);
      alert("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveNotes = async (updated) => {
    const refDoc = doc(db, "projects", updated.id);
    await updateDoc(refDoc, { notes: updated.notes || "" });
    setSelected((prev) => (prev ? { ...prev, notes: updated.notes } : prev));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-2">Projects</h1>
      <p className="text-sm text-gray-600 mb-6">
        Use <span className="font-medium">Add more notes</span> anytime to update project info or files.
      </p>

      {/* Create Project */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <input
          type="text"
          placeholder="Name"
          className="flex-1 rounded-xl border p-3"
          value={newProject.name}
          onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
        />
        <input
          type="text"
          placeholder="Notes"
          className="flex-1 rounded-xl border p-3"
          value={newProject.notes}
          onChange={(e) => setNewProject({ ...newProject, notes: e.target.value })}
        />
        <button
          onClick={addProject}
          className="rounded-xl bg-black text-white px-4 py-2 hover:opacity-90"
        >
          Add Project
        </button>
      </div>

      {/* List Projects */}
      <div className="grid gap-4 sm:grid-cols-2">
        {projects.map((p) => (
          <article key={p.id} className="rounded-2xl border bg-white p-4 shadow-sm">
            <h2 className="text-lg font-medium">{p.name || "Untitled project"}</h2>
            {p.notes && <p className="text-sm text-gray-600 mt-1">{p.notes}</p>}

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setSelected(p);
                  setFocusNotes(false);
                }}
                className="rounded-xl border px-3 py-1.5 text-sm hover:bg-gray-50"
              >
                View details
              </button>

              <button
                onClick={() => {
                  setSelected(p);
                  setFocusNotes(true);
                }}
                className="rounded-xl bg-blue-600 px-3 py-1.5 text-sm text-white hover:opacity-90"
              >
                Add more notes
              </button>

              <label className="rounded-xl border px-3 py-1.5 text-sm hover:bg-gray-50 cursor-pointer">
                {uploading ? "Uploading..." : "Upload file"}
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => uploadFile(p.id, e.target.files[0])}
                  disabled={uploading}
                />
              </label>

              <button
                onClick={() => deleteProject(p.id)}
                className="rounded-xl border border-red-400 text-red-600 px-3 py-1.5 text-sm hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>

      <ProjectDetailsModal
        project={selected}
        onClose={() => setSelected(null)}
        onSave={handleSaveNotes}
        focusNotes={focusNotes}
      />
    </div>
  );
}

