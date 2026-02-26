import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

export default function Hero() {
  const videoRef = useRef(null);

  const readerRef = useRef(null);
  const controlsRef = useRef(null);
  const streamRef = useRef(null);

  const [isActive, setIsActive] = useState(false);
  const [scanned, setScanned] = useState("");

  const stopCamera = () => {
    try {
      // 1) Stop ZXing decoding loop (MOST IMPORTANT)
      if (controlsRef.current) {
        controlsRef.current.stop();
        controlsRef.current = null;
      }

      // 2) Stop media tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      // 3) Clear video element
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      // 4) Reset reader
      if (readerRef.current) {
        readerRef.current.reset();
        readerRef.current = null;
      }

      setIsActive(false);
    } catch (e) {
      console.error("Stop camera error:", e);
    }
  };

  const activateCamera = async () => {
    try {
      // If already active, do nothing
      if (isActive) return;

      // 1) Get camera stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;

      // 2) Attach to <video>
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // 3) Start ZXing
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      setIsActive(true);

      // decodeFromVideoElement gives us "controls" that we can stop cleanly
      const controls = reader.decodeFromVideoElement(videoRef.current, (result, err) => {
        if (result) {
          const code = result.getText();
          setScanned(code);

          // Auto-stop after first successful scan
          stopCamera();
        }
      });

      controlsRef.current = controls;
    } catch (error) {
      alert("Camera error: " + error.message);
      console.error(error);
      stopCamera();
    }
  };

  // Cleanup if user navigates away / refresh
  useEffect(() => {
    return () => stopCamera();
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
            GreenScan analyzes everyday consumer products and provides environmental impact scores
            along with sustainable alternatives for conscious Indian buyers.
          </p>

          {scanned && (
            <div className="mt-8 p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-gray-400 text-sm">Last scanned barcode</p>
              <p className="text-emerald-400 text-2xl font-semibold mt-1">{scanned}</p>
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