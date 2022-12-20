import { Pagination } from "@mui/material";
import { AgGridReact } from "ag-grid-react/lib/agGridReact";
import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { playerPageColDef } from "./constants";
import { IAllPlayersMeta, IPlayerSource, IStat } from "./types";
import { formatFetchSinglePlayerUrl, formatFetchStats } from "./utils";

export default function Player() {
  const { state } = useLocation();
  const [playerState, setPlayerState] = useState<IPlayerSource>(
    {} as IPlayerSource
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [seasons, setSeasons] = useState<number[]>([]);
  const [stats, setStats] = useState<IStat[]>([]);
  const [meta, setMeta] = useState<IAllPlayersMeta>({} as IAllPlayersMeta);
  const [page, setPage] = useState<number>(1);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    fetchPlayerAndStat([state.playerId], signal).catch((err) => {
      if (err.name == "AbortError") {
        console.warn("Request was aborted");
      } else {
        console.warn(err);
      }
    });

    return () => {
      controller.abort();
    };
  }, [seasons, page]);

  async function fetchPlayerAndStat(playerId: number[], signal: AbortSignal) {
    setIsLoading(true);
    const [playerResponse, statResponse] = await Promise.all([
      fetch(formatFetchSinglePlayerUrl(playerId[0]), {
        signal,
      }).then(async (res) => await res.json()),
      fetch(formatFetchStats(playerId, seasons, page), {
        signal,
      }).then(async (res) => await res.json()),
    ]);
    setPlayerState(playerResponse);
    const massagedStats = statResponse.data.map((stat: IStat) => ({
      ...stat,
      game: stat.game.id,
      team: stat.team?.full_name,
    }));
    setStats(massagedStats);
    setMeta(statResponse.meta);

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

  return (
    <>
      {isLoading && <div>LOADING</div>}{" "}
      {!isLoading && (
        <div className="u-flex">
          <AgGridReact
            className="ag-theme-alpine"
            rowData={stats}
            columnDefs={playerPageColDef}
            defaultColDef={defaultColDef}
          />
          <Pagination
            count={meta.total_pages}
            page={meta.current_page}
            onChange={handlePageChange}
          />
        </div>
      )}
    </>
  );
}
