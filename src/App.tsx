import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Tour from "@/pages/Tour";
import Report from "@/pages/Report";
import More from "@/pages/More";
import Pitch from "@/pages/PitchHub";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="liste/:id" element={<Tour />} />
        <Route path="bericht" element={<Report />} />
        <Route path="pitch" element={<Pitch />} />
        <Route path="mehr" element={<More />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
