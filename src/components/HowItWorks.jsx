export default function HowItWorks() {
  return (
    <section id="how" className="py-32 px-10 border-t border-white/5">
      <div className="max-w-6xl mx-auto">

        <div className="mb-20 text-center">
          <h2 className="text-4xl font-bold tracking-tight">
            How It Works
          </h2>
          <p className="mt-4 text-gray-400 text-lg">
            Three simple steps to smarter consumption.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12">

          <div className="p-8 bg-[#111827] border border-white/10 rounded-2xl">
            <div className="text-emerald-400 text-sm mb-4">01</div>
            <h3 className="text-xl font-semibold mb-3">Scan</h3>
            <p className="text-gray-400">
              Use your device camera to scan product barcodes instantly.
            </p>
          </div>

          <div className="p-8 bg-[#111827] border border-white/10 rounded-2xl">
            <div className="text-emerald-400 text-sm mb-4">02</div>
            <h3 className="text-xl font-semibold mb-3">Analyze</h3>
            <p className="text-gray-400">
              Our system evaluates environmental impact and sustainability score.
            </p>
          </div>

          <div className="p-8 bg-[#111827] border border-white/10 rounded-2xl">
            <div className="text-emerald-400 text-sm mb-4">03</div>
            <h3 className="text-xl font-semibold mb-3">Choose Better</h3>
            <p className="text-gray-400">
              Discover eco-friendly alternatives tailored to Indian markets.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
}