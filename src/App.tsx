import React from "react";
import { Route, Routes } from "react-router-dom";
import AllPlayers from "./AllPlayers";
import PlayerSeasonFull from "./PlayerSeasonFullStats";

export default function Application() {
  return (
    <Routes>
      <Route path="/" element={<AllPlayers />} />
      <Route path="playerFullStat/:id" element={<PlayerSeasonFull />} />
    </Routes>
  );
}
