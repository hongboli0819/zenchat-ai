import { Routes, Route } from "react-router-dom";
import { AppShell } from "@/app/AppShell";
import { ExtractorPage } from "@/app/pages/ExtractorPage";

function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<ExtractorPage />} />
      </Routes>
    </AppShell>
  );
}

export default App;

