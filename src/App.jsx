import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import HowItWorks from "./components/HowItWorks";
import TopScanned from "./components/TopScanned";
import Scan from "./components/Scan";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <div className="bg-[#0b0f19] text-white min-h-screen">
      <Navbar />

      <Routes>
        <Route
          path="/"
          element={
            <>
              <Hero />
              <TopScanned />
              <HowItWorks />
            </>
          }
        />

        <Route
          path="/scan"
          element={
            <ProtectedRoute>
              <Scan />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;