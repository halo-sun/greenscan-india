import { useRef, useState } from "react";

export default function Hero() {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);

  const activateCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }

      setStream(mediaStream);
    } catch (error) {
      alert("Camera error: " + error.message);
      console.error(error);
    }
  };

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
            GreenScan analyzes everyday consumer products and provides
            environmental impact scores along with sustainable
            alternatives for conscious Indian buyers.
          </p>
        </div>

        {/* RIGHT SIDE - REAL SCANNER */}
        <div
          id="scan"
          className="bg-[#111827] border border-white/10 rounded-2xl p-10 shadow-[0_0_40px_rgba(0,0,0,0.5)]"
        >
          <p className="text-gray-500 text-sm mb-6">
            Barcode Scanner
          </p>

          <video
            ref={videoRef}
            className="h-56 w-full bg-black rounded-xl border border-white/5"
            autoPlay
            playsInline
          />

          <button
            onClick={activateCamera}
            className="mt-8 w-full bg-emerald-500 text-black py-4 rounded-lg font-semibold text-lg hover:opacity-90 transition"
          >
            Activate Camera
          </button>
        </div>

      </div>
    </section>
  );
}