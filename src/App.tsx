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
import Player from "./Player";

export default function Application() {
  return (
    <Routes>
      <Route path="/" element={<AllPlayers />} />
      <Route path="player">
        <Route index element={<Player />} />
        <Route path=":number" element={<Player />} />
      </Route>
    </Routes>
  );
}
