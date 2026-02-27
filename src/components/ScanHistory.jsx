import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

export default function ScanHistory() {
  const { user } = useAuth();
  const [scans, setScans] = useState([]);

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "users", user.uid, "scans"),
      orderBy("createdAt", "desc"),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setScans(data);
    });

    return () => unsubscribe();
  }, [user]);

  if (!user) return null;

  return (
    <section className="px-10 pb-24 bg-[#0b0f19]">
      <div className="max-w-7xl mx-auto">

        <h2 className="text-3xl font-bold mb-10">
          Your Recent Scans
        </h2>

        {scans.length === 0 ? (
          <p className="text-gray-500">
            No scans yet. Start scanning products.
          </p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scans.map((scan) => (
              <div
                key={scan.id}
                className="bg-[#111827] border border-white/10 rounded-xl p-6 hover:border-emerald-400/40 transition"
              >
                <p className="text-gray-400 text-sm mb-2">
                  Barcode
                </p>

                <p className="text-emerald-400 text-xl font-semibold">
                  {scan.barcode}
                </p>

                {scan.createdAt && (
                  <p className="text-gray-500 text-xs mt-4">
                    {new Date(scan.createdAt.seconds * 1000).toLocaleString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}