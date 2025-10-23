// Create/update the user's profile doc on first sign-in
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebaseClient";

export async function ensureUserDoc(user) {
  if (!user) return;
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  const base = {
    email: user.email || "",
    displayName: user.displayName || "",
    updatedAt: serverTimestamp(),
  };

  if (!snap.exists()) {
    await setDoc(ref, {
      ...base,
      role: "user",
      createdAt: serverTimestamp(),
    });
    console.log("[ensureUserDoc] created doc for", user.email);
  } else {
    await updateDoc(ref, base);
    console.log("[ensureUserDoc] updated info for", user.email);
  }
}

