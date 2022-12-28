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
import { GridExample } from "./GridExample";

export default function Application() {
  return (
    <Routes>
      <Route path="/" element={<AllPlayers />} />
      <Route path="demo" element={<GridExample />} />
      <Route path="playerFullStat/:id" element={<PlayerSeasonFull />} />
    </Routes>
  );
}
