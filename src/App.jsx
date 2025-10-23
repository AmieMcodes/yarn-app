import { Outlet } from "react-router-dom";
import MainNav from "./components/MainNav.jsx";

export default function App() {
  return (
    <div className="min-h-screen bg-[color:var(--color-soft-white)] text-neutral-800">
      <MainNav />
      <div className="mx-auto max-w-6xl px-6 py-6">
        <Outlet />
      </div>
    </div>
  );
}

