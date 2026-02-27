import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { curatedProducts } from "../data/curatedProducts";

export default function Hero() {
  const { user } = useAuth();

  const videoRef = useRef(null);

  const readerRef = useRef(null);
  const controlsRef = useRef(null);
  const streamRef = useRef(null);

  const startingRef = useRef(false);
  const stoppingRef = useRef(false);
  const savingRef = useRef(false);

  const [isActive, setIsActive] = useState(false);
  const [lastScan, setLastScan] = useState(null);
  const [saveStatus, setSaveStatus] = useState("");

  const cleanStr = (v) => (typeof v === "string" ? v.trim() : "");
  const firstNonEmpty = (...vals) => vals.map(cleanStr).find((v) => v) || "";

  const stopCamera = async () => {
    if (stoppingRef.current) return;
    stoppingRef.current = true;

    try {
      if (controlsRef.current && typeof controlsRef.current.stop === "function") {
        controlsRef.current.stop();
        controlsRef.current = null;
      }

      if (readerRef.current && typeof readerRef.current.reset === "function") {
        readerRef.current.reset();
        readerRef.current = null;
      }

      if (streamRef.current && typeof streamRef.current.getTracks === "function") {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      const videoEl = videoRef.current;
      const srcStream = videoEl?.srcObject;
      if (srcStream && typeof srcStream.getTracks === "function") {
        srcStream.getTracks().forEach((t) => t.stop());
      }

      if (videoEl) {
        try {
          videoEl.pause();
        } catch {}
        videoEl.srcObject = null;
      }
    } catch (e) {
      console.error("Stop camera error:", e);
    } finally {
      setIsActive(false);
      stoppingRef.current = false;
      startingRef.current = false;
    }
  };

  // ---------- Multi-source product lookup (Free + cached) ----------

  const fetchFromOpenFacts = async (host, barcode) => {
    try {
      const url = `https://${host}/api/v0/product/${encodeURIComponent(barcode)}.json`;
      const res = await fetch(url);
      const data = await res.json();

      if (data?.status === 1 && data?.product) {
        const p = data.product;

        const name = firstNonEmpty(
          p.product_name,
          p.product_name_en,
          p.generic_name,
          p.abbreviated_product_name
        );

        const brand = firstNonEmpty(p.brands);

        const image = firstNonEmpty(
          p.image_front_url,
          p.image_url,
          p.selected_images?.front?.display?.en
        );

        // Useful fields for scoring later (when available)
        const categories = firstNonEmpty(p.categories, p.categories_tags?.join(", "));
        const packaging = firstNonEmpty(p.packaging, p.packaging_text);
        const ecoscoreGrade = firstNonEmpty(p.ecoscore_grade);
        const nutriscoreGrade = firstNonEmpty(p.nutriscore_grade);

        return {
          name,
          brand,
          image,
          categories,
          packaging,
          ecoscoreGrade,
          nutriscoreGrade,
          source: host,
        };
      }
    } catch {
      // ignore
    }
    return null;
  };

  const lookupProductInfo = async (barcode) => {
    // 0) Firestore cache first (scans/{barcode})
    try {
      const cachedRef = doc(db, "scans", barcode);
      const cachedSnap = await getDoc(cachedRef);
      if (cachedSnap.exists()) {
        const d = cachedSnap.data();
        if (d?.name || d?.brand || d?.image || d?.categories) {
          return {
            name: cleanStr(d.name),
            brand: cleanStr(d.brand),
            image: cleanStr(d.image),
            categories: cleanStr(d.categories),
            packaging: cleanStr(d.packaging),
            ecoscoreGrade: cleanStr(d.ecoscoreGrade),
            nutriscoreGrade: cleanStr(d.nutriscoreGrade),
            source: cleanStr(d.source) || "firestore-cache",
            fromCache: true,
          };
        }
      }
    } catch {
      // ignore
    }

    // 1) Your curated DB
    const curated = curatedProducts?.[barcode];
    if (curated) {
      return {
        name: cleanStr(curated.name),
        brand: cleanStr(curated.brand),
        image: cleanStr(curated.image),
        categories: cleanStr(curated.categories),
        packaging: cleanStr(curated.packaging),
        source: curated.source || "curated",
        fromCache: false,
      };
    }

    // 2) Free public sources fallback chain
    const sources = [
      "in.openfoodfacts.org",
      "world.openfoodfacts.org",
      "world.openproductsfacts.org",
      "world.openbeautyfacts.org",
    ];

    for (const host of sources) {
      const hit = await fetchFromOpenFacts(host, barcode);
      if (hit && (hit.name || hit.brand || hit.image || hit.categories)) {
        return { ...hit, fromCache: false };
      }
    }

    return {
      name: "",
      brand: "",
      image: "",
      categories: "",
      packaging: "",
      ecoscoreGrade: "",
      nutriscoreGrade: "",
      source: "unknown",
      fromCache: false,
    };
  };

  // ---------- Save scan + enrich global doc ----------
  const saveScanToFirestore = async (barcode) => {
    if (!user?.uid) return;
    if (savingRef.current) return;

    savingRef.current = true;
    setSaveStatus("saving");

    try {
      const info = await lookupProductInfo(barcode);

      setLastScan({
        barcode,
        name: info.name,
        brand: info.brand,
        image: info.image,
        categories: info.categories,
        source: info.source,
      });

      // A) Save to user scan history
      await addDoc(collection(db, "users", user.uid, "scans"), {
        barcode,
        name: info.name || null,
        brand: info.brand || null,
        image: info.image || null,
        categories: info.categories || null,
        packaging: info.packaging || null,
        ecoscoreGrade: info.ecoscoreGrade || null,
        nutriscoreGrade: info.nutriscoreGrade || null,
        source: info.source || null,
        createdAt: serverTimestamp(),
      });

      // B) Global scans doc: count + best-known metadata
      const globalRef = doc(db, "scans", barcode);

      await runTransaction(db, async (tx) => {
        const snap = await tx.get(globalRef);
        const current = snap.exists() ? snap.data() : {};
        const currentCount = current?.count || 0;

        const next = {
          barcode,
          count: currentCount + 1,
          lastSeen: serverTimestamp(),
          lastByUid: user.uid,

          // Only set if we have something (or current is empty)
          name: current?.name || info.name || null,
          brand: current?.brand || info.brand || null,
          image: current?.image || info.image || null,
          categories: current?.categories || info.categories || null,
          packaging: current?.packaging || info.packaging || null,
          ecoscoreGrade: current?.ecoscoreGrade || info.ecoscoreGrade || null,
          nutriscoreGrade: current?.nutriscoreGrade || info.nutriscoreGrade || null,
          source: current?.source || info.source || null,
        };

        tx.set(globalRef, next, { merge: true });
      });

      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(""), 1200);
    } catch (err) {
      console.error("Firestore save error:", err);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus(""), 2000);
    } finally {
      savingRef.current = false;
    }
  };

  const activateCamera = async () => {
    if (!user) {
      alert("Please sign in to scan products.");
      return;
    }

    if (startingRef.current || isActive) return;
    startingRef.current = true;

    try {
      await stopCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;

      const videoEl = videoRef.current;
      if (!videoEl) throw new Error("Video element not ready");

      videoEl.srcObject = stream;
      await videoEl.play();

      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      setIsActive(true);

      const maybeControls = reader.decodeFromVideoElement(videoEl, (result) => {
        if (result) {
          const code = result.getText();
          saveScanToFirestore(code);
          stopCamera();
        }
      });

      controlsRef.current =
        typeof maybeControls?.then === "function" ? await maybeControls : maybeControls;
    } catch (error) {
      console.error("Activate camera error:", error);
      alert("Camera/Scanner error: " + (error?.message || String(error)));
      await stopCamera();
    } finally {
      startingRef.current = false;
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="pt-40 pb-32 px-10 bg-[#0b0f19]">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-24 items-center">
        {/* LEFT SIDE */}
        <div>
          <p className="text-emerald-400 text-sm mb-6 tracking-wide uppercase">
            Sustainable Intelligence Platform
          </p>

          <h1 className="text-7xl font-bold tracking-tight leading-[1.05]">
            Make Better
            <br />
            Product Choices.
          </h1>

          <p className="mt-8 text-gray-400 text-xl max-w-xl leading-relaxed">
            Scan a product to get its sustainability score and better alternatives.
          </p>

          {lastScan && (
            <div className="mt-8 p-5 rounded-2xl bg-white/5 border border-white/10 flex gap-4 items-center">
              {lastScan.image ? (
                <img
                  src={lastScan.image}
                  alt=""
                  className="w-16 h-16 rounded-xl object-cover border border-white/10"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10" />
              )}

              <div className="min-w-0">
                <p className="text-gray-400 text-sm">Last scanned</p>
                <p className="text-white font-semibold truncate">
                  {lastScan.name || "Unknown product"}
                </p>
                <p className="text-gray-400 text-sm truncate">
                  {lastScan.brand ? `${lastScan.brand} • ` : ""}
                  {lastScan.barcode}
                </p>
                {lastScan.categories && (
                  <p className="text-gray-500 text-xs mt-1 truncate">
                    Category: {lastScan.categories}
                  </p>
                )}
                <p className="text-gray-500 text-xs mt-1 truncate">
                  Source: {lastScan.source || "unknown"}
                </p>

                <div className="mt-2 text-sm">
                  {saveStatus === "saving" && <span className="text-gray-400">Saving…</span>}
                  {saveStatus === "saved" && <span className="text-emerald-400">Saved ✅</span>}
                  {saveStatus === "error" && <span className="text-red-400">Save failed ❌</span>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDE */}
        <div
          id="scan"
          className="bg-[#111827] border border-white/10 rounded-2xl p-10 shadow-[0_0_40px_rgba(0,0,0,0.5)]"
        >
          <p className="text-gray-500 text-sm mb-6">Barcode Scanner</p>

          <video
            ref={videoRef}
            className="h-56 w-full bg-black rounded-xl border border-white/5 object-cover"
            autoPlay
            playsInline
            muted
          />

          <div className="mt-8 flex gap-4">
            {!isActive ? (
              <button
                onClick={activateCamera}
                className="flex-1 bg-emerald-500 text-black py-4 rounded-lg font-semibold text-lg hover:opacity-90 transition"
              >
                Activate Camera
              </button>
            ) : (
              <button
                onClick={stopCamera}
                className="flex-1 border border-white/15 text-white py-4 rounded-lg font-semibold text-lg hover:border-white/30 transition"
              >
                Stop
              </button>
            )}
          </div>

          <p className="mt-4 text-gray-500 text-sm">
            Tip: keep the barcode well-lit and centered.
          </p>
        </div>
      </div>
    </section>
  );
}