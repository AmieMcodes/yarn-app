// src/screens/Projects.jsx
import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";
import { Link } from "react-router-dom";
import { auth, db, storage } from "../utils/firebaseClient";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [newProject, setNewProject] = useState({ name: "", notes: "" });
  const [uploadingId, setUploadingId] = useState(null);

  const uid = auth.currentUser?.uid || null;

  // Live list
  useEffect(() => {
    const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const out = [];
      snap.forEach((d) => out.push({ id: d.id, ...d.data() }));
      setProjects(out);
    });
    return () => unsub();
  }, []);

  async function addProject() {
    if (!newProject.name.trim()) return alert("Please enter a name.");
    await addDoc(collection(db, "projects"), {
      name: newProject.name.trim(),
      notes: newProject.notes.trim(),
      status: "in progress",
      createdAt: serverTimestamp(),
    });
    setNewProject({ name: "", notes: "" });
  }

  async function deleteProject(id) {
    if (!confirm("Delete this project?")) return;
    await deleteDoc(doc(db, "projects", id));
  }

  // IMPORTANT: store uploads under uploads/<uid>/<projectId>/ to match Details page
  async function uploadFile(projectId, file) {
    if (!file) return;
    if (!uid) {
      alert("You must be logged in to upload.");
      return;
    }
    setUploadingId(projectId);
    try {
      const storagePath = `uploads/${uid}/${projectId}/${file.name}`;
      const fileRef = ref(storage, storagePath);
      await uploadBytes(fileRef, file);
      // We don’t need to write to Firestore here; Details page lists from Storage.
    } catch (e) {
      console.error(e);
      alert("Upload failed.");
    } finally {
      setUploadingId(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-2">Projects</h1>
      <p className="text-sm text-gray-600 mb-6">
        Create projects and upload PDFs or images. Open a project to add notes, status, and view files.
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

      {/* List */}
      <div className="grid gap-4 sm:grid-cols-2">
        {projects.map((p) => (
          <article key={p.id} className="rounded-2xl border bg-white p-4 shadow-sm">
            <h2 className="text-lg font-medium">{p.name || "Untitled project"}</h2>
            {p.notes && <p className="text-sm text-gray-600 mt-1">{p.notes}</p>}

            <div className="mt-4 flex flex-wrap gap-2">
              {/* View details (route) */}
              <Link
                to={`/projects/${p.id}`}
                className="rounded-xl border px-3 py-1.5 text-sm hover:bg-gray-50"
              >
                View details
              </Link>

              {/* Add more notes = also route to details, lands at notes form */}
              <Link
                to={`/projects/${p.id}`}
                className="rounded-xl bg-blue-600 px-3 py-1.5 text-sm text-white hover:opacity-90"
              >
                Add more notes
              </Link>

              {/* Upload file → saves to uploads/<uid>/<projectId>/* so Details will list it */}
              <label className="rounded-xl border px-3 py-1.5 text-sm hover:bg-gray-50 cursor-pointer">
                {uploadingId === p.id ? "Uploading..." : "Upload file"}
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => uploadFile(p.id, e.target.files[0])}
                  disabled={uploadingId === p.id}
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
    </div>
  );
}

