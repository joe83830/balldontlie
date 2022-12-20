import { Link } from "@mui/material";
import { ICellRendererParams } from "ag-grid-community";

export const getAllPlayersApi: string =
  "https://www.balldontlie.io/api/v1/players";

export const getSinglePlayerApi: string =
  "https://www.balldontlie.io/api/v1/players/";

export const getStatsApi: string = "https://www.balldontlie.io/api/v1/stats";

export const playerPageColDef = [
  { field: "game", filter: true },
  { field: "ast", filter: true },
  { field: "blk", filter: true },
  { field: "dreb", filter: true },
  { field: "fg3_pct", filter: true },
  { field: "fg3a", filter: true },
  { field: "fg3m", filter: true },
  { field: "fg_pct", filter: true },
  { field: "fga", filter: true },
  { field: "fgm", filter: true },
  { field: "ft_pct", filter: true },
  { field: "fta", filter: true },
  { field: "ftm", filter: true },
  { field: "game", filter: true },
  { field: "min", filter: true },
  { field: "oreb", filter: true },
  { field: "pf", filter: true },
  { field: "pts", filter: true },
  { field: "reb", filter: true },
  { field: "stl", filter: true },
  { field: "team", filter: true },
  { field: "turnover", filter: true },
];
