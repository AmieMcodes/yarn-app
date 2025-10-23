import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../utils/firebaseClient";

/**
 * NOTE (important for delivery):
 * - The AdminRoute gate checks users/{uid}.role === "admin".
 * - New users must SIGN IN once so their users/{uid} doc exists (UID matches Auth).
 * - This UI lets you:
 *    1) Add placeholder records (for tracking) with a chosen role, and
 *    2) Change the role on existing records (the usual way to grant admin).
 * - For granting admin reliably, use the inline Role dropdown on the *existing*
 *   row that corresponds to their UID (after they log in).
 */

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "user" });
  const [loading, setLoading] = useState(false);

  const usersCol = collection(db, "users");

  const fetchUsers = async () => {
    const snap = await getDocs(usersCol);
    setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    fetchUsers().catch((e) => console.error("Error loading users:", e));
  }, []);

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email) {
      alert("Please enter a name and email.");
      return;
    }
    setLoading(true);
    try {
      await addDoc(usersCol, {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role || "user",
        createdAt: new Date(),
      });
      setNewUser({ name: "", email: "", role: "user" });
      await fetchUsers();
      alert("User record added.");
    } catch (err) {
      console.error("Error adding user:", err);
      alert("Failed to add user.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Delete this user document?")) return;
    try {
      await deleteDoc(doc(db, "users", id));
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (e) {
      console.error("Delete error:", e);
      alert("Failed to delete user.");
    }
  };

  const handleRoleChange = async (id, role) => {
    try {
      await updateDoc(doc(db, "users", id), { role });
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, role } : u))
      );
      // Small tip for you during delivery:
      // If this row corresponds to the user's UID, the change takes effect on next auth refresh.
      // Have them sign out/in or reload and the AdminRoute will let them in.
    } catch (e) {
      console.error("Update role error:", e);
      alert("Failed to update role.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* Add New User */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-2">Add New User</h2>
        <div className="flex flex-wrap gap-3 mb-4">
          <input
            className="border rounded px-3 py-2 flex-1 min-w-[180px]"
            placeholder="Name"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
          />
          <input
            className="border rounded px-3 py-2 flex-1 min-w-[220px]"
            placeholder="Email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
          />
          <select
            className="border rounded px-3 py-2"
            value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <button
            onClick={handleAddUser}
            disabled={loading}
            className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700"
          >
            {loading ? "Adding..." : "Add"}
          </button>
        </div>
        <p className="text-sm text-gray-600">
          Tip: To actually grant admin access, the person should sign in first so
          their Firestore user doc (by UID) exists. Then change their role below.
        </p>
      </section>

      {/* Users Table */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Registered Users</h2>
        {users.length === 0 ? (
          <p>No users yet.</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="border px-4 py-2">Name</th>
                <th className="border px-4 py-2">Email</th>
                <th className="border px-4 py-2">Role</th>
                <th className="border px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="odd:bg-white even:bg-[#f7f3ec]">
                  <td className="border px-4 py-2">{u.name || "—"}</td>
                  <td className="border px-4 py-2">{u.email || "—"}</td>
                  <td className="border px-4 py-2">
                    <select
                      className="border rounded px-2 py-1"
                      value={u.role || "user"}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="border px-4 py-2">
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

