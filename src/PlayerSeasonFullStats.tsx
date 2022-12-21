import { Chip, CircularProgress, Pagination, TextField } from "@mui/material";
import { AgGridReact } from "ag-grid-react/lib/agGridReact";
import React, { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { playerPageColDef } from "./constants";
import { IAllPlayersMeta, IPlayerSource, IStat } from "./types";
import { formatFetchSinglePlayerUrl, formatFetchStats } from "./utils";

export default function PlayerSeasonFull() {
  const { state } = useLocation();
  const [playerState, setPlayerState] = useState<IPlayerSource>(
    {} as IPlayerSource
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [seasons, setSeasons] = useState<Array<string>>(["2022"]);
  const [stats, setStats] = useState<Record<string, IStat[]>>();
  const [meta, setMeta] = useState<IAllPlayersMeta>({} as IAllPlayersMeta);
  const [page, setPage] = useState<number>(1);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    console.log("In useEffect");
    fetchPlayerAndStat([state?.playerInfo?.id], signal);

    return () => {
      controller.abort();
    };
  }, [seasons, page]);

  async function fetchPlayerAndStat(playerId: number[], signal: AbortSignal) {
    setIsLoading(true);

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

    setIsLoading(false);
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

  const getRowData = () => {};

  return (
    <>
      {isLoading && (
        <div className="loading-spinner">
          <CircularProgress />
        </div>
      )}
      {!isLoading && (
        <div className="u-flex-col">
          <div className="u-flex-inner">
            <div>{JSON.stringify(state?.playerInfo, null, 2)}</div>
            <div className="hamburger-margin u-flex-row">
              <TextField
                id="outlined-basic"
                label="Add season"
                variant="outlined"
                // onChange={(e) => handleAddSeason(e.target.value)}
                onKeyPress={(event) => {
                  if (event.key === "Enter") {
                    console.log(event);
                    handleAddSeason((event.target as any).value);
                  }
                }}
              />
              {Array.from(seasons).map((season) => (
                <Chip label={season} onDelete={deleteSeason(season)} />
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
            />
            <Pagination
              count={meta.total_pages}
              page={meta.current_page}
              onChange={handlePageChange}
            />
          </div>
        </div>
      )}
    </>
  );
}
