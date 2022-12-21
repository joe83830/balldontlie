import React from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Route,
  Link,
  Routes,
} from "react-router-dom";
import AllPlayers from "./AllPlayers";
import PlayerSeasonFull from "./PlayerSeasonFullStats";
import { PlayerSeasonAverageStats } from "./PlayerSeasonAverage";

export default function Application() {
  return (
    <Routes>
      <Route path="/" element={<AllPlayers />} />
      <Route path="playerAverage/:id" element={<PlayerSeasonAverageStats />} />
      <Route path="playerFullStat/:id" element={<PlayerSeasonFull />} />
    </Routes>
  );
}
