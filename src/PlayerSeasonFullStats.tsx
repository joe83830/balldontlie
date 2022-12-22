import { Chip, CircularProgress, Pagination, TextField } from "@mui/material";
import { AgGridReact } from "ag-grid-react/lib/agGridReact";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { playerPageColDef } from "./constants";
import { IAllPlayersMeta, IPlayerSource, IStat } from "./types";
import { formatFetchSinglePlayerUrl, formatFetchStats } from "./utils";

export default function PlayerSeasonFull(): JSX.Element {
  const { state } = useLocation();
  const [playerState, setPlayerState] = useState<IPlayerSource>(
    {} as IPlayerSource
  );
  const [seasons, setSeasons] = useState<Array<string>>(["2022"]);
  const [stats, setStats] = useState<Record<string, IStat[]>>();
  const [meta, setMeta] = useState<IAllPlayersMeta>({} as IAllPlayersMeta);
  const [page, setPage] = useState<number>(1);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    fetchPlayerAndStat([state?.playerId], signal);

    return () => {
      controller.abort();
    };
  }, [seasons, page]);

  async function fetchPlayerAndStat(playerId: number[], signal: AbortSignal) {
    try {
      const [playerResponse, statResponse] = await Promise.all([
        fetch(formatFetchSinglePlayerUrl(playerId[0]), {
          signal,
        }),
        fetch(formatFetchStats(playerId, Array.from(seasons), page), {
          signal,
        }),
      ]);

      const playerResponseJson = await playerResponse.json();
      const statResponseJson = await statResponse.json();

      setPlayerState(playerResponseJson);
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
      setMeta(statResponseJson.meta);
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

  function handlePageChange(_: React.ChangeEvent<unknown>, value: number) {
    setPage(value);
  }

  function handleAddSeason(season: string) {
    setSeasons((curSeason) => {
      if (!curSeason.includes(season)) {
        return [...curSeason, season];
      } else {
        return curSeason;
      }
    });
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

  return (
    <>
      {
        <div className="u-flex-col">
          <div className="u-flex-inner">
            <div>{JSON.stringify(playerState, null, 2)}</div>
            <div className="hamburger-margin u-flex-row">
              <div className="right-margin">
                <TextField
                  id="outlined-basic"
                  label="Add season"
                  variant="outlined"
                  onKeyPress={(event) => {
                    if (event.key === "Enter") {
                      handleAddSeason((event.target as any).value);
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
            <Pagination
              count={meta?.total_pages || 1}
              page={meta?.current_page || 1}
              onChange={handlePageChange}
            />
          </div>
        </div>
      }
    </>
  );
}
