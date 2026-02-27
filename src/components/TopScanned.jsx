import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

export default function TopScanned() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "scans"), orderBy("count", "desc"), limit(10));

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setItems(data);
    });

    return () => unsub();
  }, []);

  return (
    <section className="px-10 pb-24 bg-[#0b0f19]">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between gap-6 mb-10">
          <div>
            <h2 className="text-3xl font-bold">Most Scanned</h2>
            <p className="text-gray-400 mt-2">
              Live leaderboard from all GreenScan users.
            </p>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="bg-[#111827] border border-white/10 rounded-2xl p-8">
            <p className="text-gray-400">No global scans yet. Be the first one 🔥</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((it, idx) => (
              <div
                key={it.id}
                className="bg-[#111827] border border-white/10 rounded-2xl p-6 hover:border-emerald-400/40 transition"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-500 text-xs uppercase tracking-wider">
                    Rank #{idx + 1}
                  </span>
                  <span className="text-emerald-400 font-semibold">
                    {it.count || 0} scans
                  </span>
                </div>

                <div className="flex gap-4 items-center">
                  {it.image ? (
                    <img
                      src={it.image}
                      alt=""
                      className="w-14 h-14 rounded-xl object-cover border border-white/10"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10" />
                  )}

                  <div className="min-w-0">
                    <p className="text-white font-semibold truncate">
                      {it.name || "Unknown product"}
                    </p>
                    <p className="text-gray-400 text-sm truncate">
                      {it.brand ? `${it.brand} • ` : ""}
                      {it.barcode}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}