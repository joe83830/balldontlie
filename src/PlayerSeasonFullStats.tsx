import { Chip, CircularProgress, TextField } from "@mui/material";
import { AgGridReact } from "ag-grid-react/lib/agGridReact";
import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { playerPageColDef } from "./constants";
import { IPlayerSource, IStat } from "./types";
import { formatFetchSinglePlayerUrl, formatFetchStats } from "./utils";

export default function PlayerSeasonFull(): JSX.Element {
  const [playerState, setPlayerState] = useState<IPlayerSource>();
  const { state, search } = useLocation();
  const query = new URLSearchParams(search);
  const page = parseInt(query.get("page") || "1", 10);
  const [seasons, setSeasons] = useState<Array<string>>(["2022"]);
  const [stats, setStats] = useState<Record<string, IStat[]>>();

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    fetchStats([state?.playerId], signal);

    return () => {
      controller.abort();
    };
  }, [seasons, page]);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    fetchPlayer([state?.playerId], signal);

    return () => {
      controller.abort();
    };
  }, []);

  async function fetchPlayer(playerId: number[], signal: AbortSignal) {
    try {
      const playerResponse = await fetch(
        formatFetchSinglePlayerUrl(playerId[0]),
        {
          signal,
        }
      );
      const playerResponseJson = await playerResponse.json();
      setPlayerState(playerResponseJson);
    } catch (e) {
      console.warn(e);
    }
  }

  async function fetchStats(playerId: number[], signal: AbortSignal) {
    if (seasons.length === 0) {
      return;
    }
    try {
      const statResponse = await fetch(
        formatFetchStats(playerId, [seasons[seasons.length - 1]], page),
        {
          signal,
        }
      );

      const statResponseJson = await statResponse.json();
      const massagedStats = statResponseJson.data.map((stat: IStat) => ({
        ...stat,
        date: stat.game.date.split("T")[0],
        season: stat.game.season,
        team: stat.team?.full_name,
      }));
      setStats((prevStats) => ({
        ...prevStats,
        ...{ [seasons[seasons.length - 1]]: massagedStats },
      }));
    } catch (e) {
      console.warn(e);
    }
  }

  const defaultColDef = useMemo(
    () => ({
      sortable: true,
    }),
    []
  );

  function handleAddSeason(e: React.KeyboardEvent<HTMLDivElement>) {
    const season = (e.target as HTMLInputElement).value;
    (e.target as HTMLInputElement).value = "";
    setSeasons((curSeasons) => {
      if (curSeasons.length === 0) {
        setStats({});
      }
      if (!curSeasons.includes(season)) {
        return [...curSeasons, season];
      } else {
        return curSeasons;
      }
    });
    e.preventDefault();
  }

  const deleteSeason = (season: string) => {
    return () => {
      setStats((curStats) => {
        if (!!curStats) delete curStats[season];
        return curStats;
      });
      setSeasons((curSeasons) => curSeasons.filter((s) => s !== season));
    };
  };
  function getHeight() {
    if (!!playerState) {
      const formattedHeight = !!playerState.height_feet
        ? `${playerState.height_feet} ' ${playerState.height_inches} "`
        : "N/A";
      return `Height: ${formattedHeight}`;
    }
  }
  return (
    <>
      {
        <div className="u-flex-col">
          <div className="u-flex-inner">
            {!playerState && <CircularProgress />}
            {!!playerState && (
              <>
                <h3>{`${playerState.first_name} ${playerState.last_name}`}</h3>
                <div className="u-flex-row">
                  <div className="stack-x">
                    <div className="hamburger-margin">{`Position: ${playerState.position}`}</div>
                    <div className="hamburger-margin">{getHeight()}</div>
                  </div>
                  <div>
                    <div className="hamburger-margin">{`Latest Team: ${playerState.team.city} ${playerState.team.name}`}</div>
                    <div className="hamburger-margin">{`Conference / Division: ${playerState.team.conference} / ${playerState.team.division}`}</div>
                  </div>
                </div>
              </>
            )}

            <div className="hamburger-margin u-flex-row">
              <div className="right-margin">
                <TextField
                  id="outlined-basic"
                  label="Add season"
                  variant="outlined"
                  onKeyPress={(event) => {
                    if (event.key === "Enter") {
                      handleAddSeason(event);
                    }
                  }}
                />
              </div>
              {Array.from(seasons).map((season) => (
                <div className="right-margin">
                  <Chip label={season} onDelete={deleteSeason(season)} />
                </div>
              ))}
            </div>
            <AgGridReact
              className="ag-theme-alpine"
              rowData={(!!stats && Object.values(stats).flat()) || []}
              columnDefs={playerPageColDef}
              defaultColDef={defaultColDef}
              animateRows={true}
              rowSelection="multiple"
              rowGroupPanelShow="always"
              overlayNoRowsTemplate="Please wait while data loads..."
            />
          </div>
        </div>
      }
    </>
  );
}
