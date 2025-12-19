import { Routes, Route } from "react-router-dom";
import { LandingPage } from "@/app/pages/LandingPage";

function App() {
  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/welcome" element={<LandingPage />} />
      </Routes>
    </div>
  );
}

export default App;

