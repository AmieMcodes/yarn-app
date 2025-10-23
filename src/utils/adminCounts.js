// src/utils/adminCounts.js
import {
  collection, query, where, getCountFromServer,
} from "firebase/firestore";
import { db } from "./firebaseClient";

/**
 * Returns count totals for Users, Projects, Yarns (stash), and Uploads (optional).
 * If isAdmin === true, counts are global; otherwise counts are per current user.
 * Uploads requires a Firestore "uploads" collection to be tracked; we leave it as null for now.
 */
export async function fetchTotals({ uid, isAdmin }) {
  const out = { users: null, projects: null, yarns: null, uploads: null };

  // Users
  try {
    if (isAdmin) {
      const snap = await getCountFromServer(collection(db, "users"));
      out.users = snap.data().count || 0;
    } else {
      // non-admins don’t need a users count
      out.users = 0;
    }
  } catch (e) { out.users = null; }

  // Projects
  try {
    const col = collection(db, "projects");
    const q = isAdmin ? col : query(col, where("ownerId", "==", uid));
    const snap = await getCountFromServer(q);
    out.projects = snap.data().count || 0;
  } catch (e) { out.projects = null; }

  // Yarns (stash items)
  try {
    const col = collection(db, "yarns");
    const q = isAdmin ? col : query(col, where("ownerId", "==", uid));
    const snap = await getCountFromServer(q);
    out.yarns = snap.data().count || 0;
  } catch (e) { out.yarns = null; }

  // Uploads (optional) — populate later if we add a Firestore "uploads" collection
  // out.uploads = null;

  return out;
}

