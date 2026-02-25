import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, login, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="fixed w-full top-0 z-50 backdrop-blur-xl bg-[#0b0f19]/80 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

        {/* Logo */}
        <div className="flex items-center gap-2 font-semibold text-lg">
          <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
          GreenScan India
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
          <a href="#how" className="hover:text-white transition">How it Works</a>
          <a href="#database" className="hover:text-white transition">Database</a>
          <a href="#about" className="hover:text-white transition">Creator</a>
          <a href="/scan" className="hover:text-white transition">Scan</a>

          {user ? (
            <button
              onClick={logout}
              className="bg-white text-black px-4 py-2 rounded-md font-medium"
            >
              Logout
            </button>
          ) : (
            <button
              onClick={login}
              className="bg-white text-black px-4 py-2 rounded-md font-medium"
            >
              Sign In
            </button>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden text-white text-2xl"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>
      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-[#0b0f19] px-6 pb-6 flex flex-col gap-4 text-gray-300">
          <a href="#how">How it Works</a>
          <a href="#database">Database</a>
          <a href="#about">Creator</a>
          <a href="/scan">Scan</a>

          {user ? (
            <button
              onClick={logout}
              className="bg-white text-black px-4 py-2 rounded-md font-medium"
            >
              Logout
            </button>
          ) : (
            <button
              onClick={login}
              className="bg-white text-black px-4 py-2 rounded-md font-medium"
            >
              Sign In
            </button>
          )}
        </div>
      )}
    </nav>
  );
}