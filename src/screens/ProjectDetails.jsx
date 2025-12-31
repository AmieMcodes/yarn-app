// src/screens/ProjectDetails.jsx
import { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { auth, db, storage } from "../utils/firebaseClient";
import {
  doc, onSnapshot, updateDoc, serverTimestamp,
} from "firebase/firestore";
import { ref, getDownloadURL, listAll } from "firebase/storage";
import YourUploadComponent from "../components/YourUploadComponent";

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const uid = auth.currentUser?.uid || null;

  // Redirect if not logged in
  useEffect(() => {
    if (!uid) navigate("/login");
  }, [uid, navigate]);

  // Load project live
  useEffect(() => {
    if (!uid || !id) return;
    const refDoc = doc(db, "projects", id);
    const unsub = onSnapshot(refDoc, (snap) => {
      if (snap.exists()) {
        setProject({ id: snap.id, ...snap.data() });
      } else {
        setProject(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [uid, id]);

  // List uploaded files under uploads/<uid>/<projectId>/*
  const uploadsPrefix = useMemo(() => `uploads/${uid}/${id}`, [uid, id]);
  useEffect(() => {
    if (!uid || !id) return;
    const r = ref(storage, uploadsPrefix);
    listAll(r)
      .then(async (res) => {
        const rows = await Promise.all(
          res.items.map(async (itemRef) => ({
            name: itemRef.name,
            url: await getDownloadURL(itemRef),
          }))
        );
        setFiles(rows);
      })
      .catch(() => setFiles([]));
  }, [uid, id, uploadsPrefix]);

  async function handleSave(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const notes = form.get("notes")?.toString() || "";
    const status = form.get("status")?.toString() || "in progress";

    await updateDoc(doc(db, "projects", id), {
      notes,
      status,
      updatedAt: serverTimestamp(),
    });
  }

  async function refreshFiles() {
    const r = ref(storage, uploadsPrefix);
    listAll(r).then(async (res) => {
      const rows = await Promise.all(
        res.items.map(async (itemRef) => ({
          name: itemRef.name,
          url: await getDownloadURL(itemRef),
        }))
      );
      setFiles(rows);
    });
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="rounded-xl border p-6 bg-white/60">Loading…</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="rounded-xl border p-6 bg-white/60">
          Project not found or you don’t have permission.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/projects" className="underline text-sm text-neutral-700">
          &larr; Back to Projects
        </Link>
        <h1 className="text-2xl font-semibold">
          {project.name || "Untitled Project"}
        </h1>
        <div />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* LEFT: Notes + status */}
        <div className="rounded-2xl border bg-white/60 p-5">
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm text-neutral-600">Notes</label>
              <textarea
                name="notes"
                defaultValue={project.notes || ""}
                rows={6}
                className="w-full rounded-xl border p-3"
                placeholder="Yarn, pattern links, progress notes..."
              />
            </div>

            <div>
              <label className="block text-sm text-neutral-600">Status</label>
              <select
                name="status"
                defaultValue={project.status || "in progress"}
                className="w-full rounded-xl border p-2"
              >
                <option value="in progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="paused">Paused</option>
                <option value="planned">Planned</option>
              </select>
            </div>

            <button
              type="submit"
              className="rounded-xl border bg-neutral-900 text-white px-4 py-2"
            >
              Save
            </button>
          </form>
        </div>

        {/* RIGHT: Attachments */}
        <div className="rounded-2xl border bg-white/60 p-5">
          <h2 className="text-lg font-medium mb-3">Attachments</h2>
          <YourUploadComponent
            projectId={id}
            label="Upload file"
            onUploaded={async () => {
              await updateDoc(doc(db, "projects", id), {
                updatedAt: serverTimestamp(),
              });
              refreshFiles();
            }}
          />

          <div className="mt-4 space-y-2">
            {files.length === 0 && (
              <div className="text-sm text-neutral-500">No files yet.</div>
            )}
            {files.map((f) => (
              <div
                key={f.url}
                className="flex items-center justify-between rounded-xl border p-3"
              >
                <div className="truncate">{f.name}</div>
                <a
                  href={f.url}
                  target="_blank"
                  rel="noreferrer"
                  className="underline text-sm"
                >
                  Open
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

