import { useRef, useState } from "react";
import { auth, storage } from "../utils/firebaseClient";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

/**
 * YourUploadComponent
 *
 * Props:
 * - projectId (string, required): used to group uploads by project
 * - label (string, optional): button label (default "Upload file")
 * - pathBase (string, optional): "uploads" or "projects" (default "uploads")
 * - onUploaded (fn, optional): callback(url, { fullPath, contentType, size })
 */
export default function YourUploadComponent({
  projectId,
  label = "Upload file",
  pathBase = "uploads",
  onUploaded,
}) {
  const inputRef = useRef(null);
  const [pct, setPct] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  function chooseFile() {
    if (!projectId) {
      alert("No projectId provided to uploader.");
      return;
    }
    inputRef.current?.click();
  }

  async function handleSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const user = auth.currentUser;
    if (!user) {
      setErr("Please sign in first.");
      return;
    }
    setErr("");
    setBusy(true);
    setPct(0);

    const uid = user.uid; // <- CRITICAL: use the *current* signed-in user
    const safeName = file.name.replace(/\s+/g, "_");
    const filePath = `${pathBase}/${uid}/${projectId}/${Date.now()}_${safeName}`;
    const fileRef = ref(storage, filePath);

    // Debug (visible in DevTools console)
    console.log("[upload uid]", uid);
    console.log("[upload path]", fileRef.fullPath);

    const meta = { contentType: file.type || "application/octet-stream" };
    const task = uploadBytesResumable(fileRef, file, meta);

    task.on(
      "state_changed",
      (snap) => {
        if (snap.totalBytes > 0) {
          const next = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
          setPct(next);
        }
      },
      (error) => {
        console.error("[upload error]", error);
        setErr(error?.message || error?.code || String(error));
        setBusy(false);
      },
      async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref);
          onUploaded?.(url, {
            fullPath: task.snapshot.ref.fullPath,
            contentType: meta.contentType,
            size: file.size,
          });
        } finally {
          setBusy(false);
          setPct(0);
          // clear input so same file can be picked again
          if (inputRef.current) inputRef.current.value = "";
        }
      }
    );
  }

  return (
    <div className="flex items-center gap-3">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleSelect}
        // accept both images and PDFs; tweak if you want more types
        accept="image/*,application/pdf"
      />
      <button
        type="button"
        onClick={chooseFile}
        disabled={busy}
        className="rounded-2xl border px-4 py-2 hover:bg-neutral-100 disabled:opacity-50"
      >
        {busy ? `Uploading… ${pct}%` : label}
      </button>

      {busy && (
        <div className="h-2 w-36 rounded bg-neutral-200 overflow-hidden">
          <div
            className="h-2 bg-neutral-600"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {err && <span className="text-sm text-red-600">{err}</span>}
    </div>
  );
}

