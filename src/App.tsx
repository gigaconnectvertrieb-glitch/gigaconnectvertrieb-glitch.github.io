import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Gebiete from "@/pages/Gebiete";
import GebietDetail from "@/pages/GebietDetail";
import Tagesbericht from "@/pages/Tagesbericht";
import Settings from "@/pages/Settings";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="gebiete" element={<Gebiete />} />
        <Route path="gebiete/:id" element={<GebietDetail />} />
        <Route path="tagesbericht" element={<Tagesbericht />} />
        <Route path="einstellungen" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;