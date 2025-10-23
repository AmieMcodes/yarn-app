// src/utils/storageUpload.js
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { auth } from "../utils/firebaseClient";

/**
 * Upload a File to `uploads/{uid}/{projectId}/{uuid-filename}`
 * Emits progress (0–100) and resolves with { downloadURL, storagePath }.
 */
export function uploadProjectFile(file, projectId, onProgress = () => {}) {
  const user = auth.currentUser;
  if (!user) return Promise.reject(new Error("Not signed in"));

  const storage = getStorage();
  const safeName = (file?.name || "file").replace(/\s+/g, "-").toLowerCase();

  // Use built-in uuid if available, else a tiny fallback
  const unique =
    (typeof crypto !== "undefined" && crypto.randomUUID)
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  const storagePath = `uploads/${user.uid}/${projectId}/${unique}-${safeName}`;
  const storageRef = ref(storage, storagePath);
  const metadata = { contentType: file.type || "application/octet-stream" };

  const task = uploadBytesResumable(storageRef, file, metadata);

  return new Promise((resolve, reject) => {
    task.on(
      "state_changed",
      (snap) => {
        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        onProgress(pct);
      },
      (err) => reject(err),
      async () => {
        const downloadURL = await getDownloadURL(task.snapshot.ref);
        resolve({ downloadURL, storagePath });
      }
    );
  });
}

