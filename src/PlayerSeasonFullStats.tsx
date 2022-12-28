import { Chip, CircularProgress, TextField } from "@mui/material";
import { IAggFuncParams, ValueFormatterParams } from "@ag-grid-community/core";
import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { IPlayerSource, IStatRow, IStatSource } from "./types";
import { formatFetchSinglePlayerUrl, formatFetchStats } from "./utils";
import { AgGridReact } from "@ag-grid-community/react";
import "@ag-grid-community/styles/ag-grid.css";
import "@ag-grid-community/styles/ag-theme-alpine.css";

export default function PlayerSeasonFull(): JSX.Element {
  const [playerState, setPlayerState] = useState<IPlayerSource>();
  const { state, search } = useLocation();
  const query = new URLSearchParams(search);
  const page = parseInt(query.get("page") || "1", 10);
  const [seasons, setSeasons] = useState<Array<string>>(["2022"]);
  const [stats, setStats] = useState<Record<string, IStatRow[]>>();
  const [noDataError, setNoDataError] = useState<string>("");
  const [availableSeason, setAvailableSeason] = useState<string>();

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
    fetchInitialStat([state?.playerId], signal);

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
  async function fetchInitialStat(playerId: number[], signal: AbortSignal) {
    try {
      const statResponse = await fetch(formatFetchStats(playerId, [], page), {
        signal,
      });
      const statResponseJson = await statResponse.json();
      setAvailableSeason(statResponseJson.data[0].game.season);
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

      if (statResponseJson.data.length === 0) {
        setNoDataError(seasons[seasons.length - 1]);
      }

      const massagedStats = [] as IStatRow[];
      statResponseJson.data.forEach((stat: IStatSource) => {
        if (stat.min !== "00") {
          massagedStats.push({
            ...stat,
            date: stat.game.date.split("T")[0],
            season: stat.game.season,
            team: stat.team?.full_name,
            min: parseInt(stat.min),
            fg_pct: { fg_pct: stat.fg_pct, fga: stat.fga, fgm: stat.fgm },
            fg3_pct: {
              fg3_pct: stat.fg3_pct,
              fg3a: stat.fg3a,
              fg3m: stat.fg3m,
            },
            ft_pct: {
              ft_pct: stat.ft_pct,
              fta: stat.fta,
              ftm: stat.ftm,
            },
          });
        }
      });
      setStats((prevStats) => ({
        ...prevStats,
        ...{ [seasons[seasons.length - 1]]: massagedStats },
      }));
    } catch (e) {
      console.warn(e);
    }
  }

  const toFixedFormatterFunc = useMemo(
    () => (params: ValueFormatterParams<IStatRow>) => {
      return params?.value?.value?.toFixed(2);
    },
    []
  );

  const percentageAggFactory = useMemo(
    () => (attemptField: string, madeField: string, percentField: string) => {
      return (params: IAggFuncParams<IStatRow>) => {
        if (!!params.values && params.values.length > 1) {
          const { totalA, totalM } = params.values.reduce(
            (acc, cur) => ({
              totalA: acc.totalA + cur[attemptField],
              totalM: acc.totalM + cur[madeField],
            }),
            {
              totalA: 0,
              totalM: 0,
            }
          );
          return { [percentField]: totalM / totalA };
        }
      };
    },
    []
  );

  const percentageFormatterFactory = useMemo(
    () => (field: string) => {
      return (params: ValueFormatterParams<IStatRow>) => {
        if (!!params.value) {
          return `${params.value[field].toFixed(2).split(".")[1]}%`;
        }
        return "";
      };
    },
    []
  );

  const playerPageColDef = useMemo(
    () => [
      { field: "date" },
      { field: "season", filter: true, enableRowGroup: true, rowGroup: true },
      {
        field: "pts",
        filter: true,
        aggFunc: "avg",
        valueFormatter: toFixedFormatterFunc,
      },
      {
        field: "ast",
        filter: true,
        aggFunc: "avg",
        valueFormatter: toFixedFormatterFunc,
      },
      {
        field: "reb",
        filter: true,
        aggFunc: "avg",
        valueFormatter: toFixedFormatterFunc,
      },
      {
        field: "dreb",
        filter: true,
        aggFunc: "avg",
        valueFormatter: toFixedFormatterFunc,
      },
      {
        field: "oreb",
        filter: true,
        aggFunc: "avg",
        valueFormatter: toFixedFormatterFunc,
      },
      {
        field: "stl",
        filter: true,
        aggFunc: "avg",
        valueFormatter: toFixedFormatterFunc,
      },
      {
        field: "blk",
        filter: true,
        aggFunc: "avg",
        valueFormatter: toFixedFormatterFunc,
      },
      {
        field: "fg_pct",
        filter: true,
        aggFunc: percentageAggFactory("fga", "fgm", "fg_pct"),
        valueFormatter: percentageFormatterFactory("fg_pct"),
      },
      {
        field: "fga",
        filter: true,
        aggFunc: "avg",
        valueFormatter: toFixedFormatterFunc,
      },
      {
        field: "fgm",
        filter: true,
        aggFunc: "avg",
        valueFormatter: toFixedFormatterFunc,
      },
      {
        field: "fg3_pct",
        filter: true,
        aggFunc: percentageAggFactory("fg3a", "fg3m", "fg3_pct"),
        valueFormatter: percentageFormatterFactory("fg3_pct"),
      },
      {
        field: "fg3a",
        filter: true,
        aggFunc: "avg",
        valueFormatter: toFixedFormatterFunc,
      },
      {
        field: "fg3m",
        filter: true,
        aggFunc: "avg",
        valueFormatter: toFixedFormatterFunc,
      },
      {
        field: "ft_pct",
        filter: true,
        aggFunc: percentageAggFactory("fta", "ftm", "ft_pct"),
        valueFormatter: percentageFormatterFactory("ft_pct"),
      },
      {
        field: "fta",
        filter: true,
        aggFunc: "avg",
        valueFormatter: toFixedFormatterFunc,
      },
      {
        field: "ftm",
        filter: true,
        aggFunc: "avg",
        valueFormatter: toFixedFormatterFunc,
      },
      {
        field: "min",
        filter: true,
        aggFunc: "avg",
        valueFormatter: toFixedFormatterFunc,
      },
      {
        field: "pf",
        filter: true,
        aggFunc: "avg",
        valueFormatter: toFixedFormatterFunc,
      },
      {
        field: "turnover",
        filter: true,
        aggFunc: "avg",
        valueFormatter: toFixedFormatterFunc,
      },
      { field: "team", filter: true },
    ],
    []
  );

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
      if (season === noDataError) {
        setNoDataError("");
      }
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
            {noDataError && (
              <div
                style={{ color: "red", marginBottom: "12px" }}
              >{`No Data for season ${noDataError}, try ${availableSeason}!`}</div>
            )}
            <AgGridReact
              className="ag-theme-alpine"
              rowData={(!!stats && Object.values(stats).flat()) || []}
              columnDefs={playerPageColDef}
              defaultColDef={defaultColDef}
              animateRows={true}
              rowSelection="multiple"
              rowGroupPanelShow="always"
              overlayNoRowsTemplate="Please wait while data loads..."
              suppressAggFuncInHeader={true}
              sideBar={true}
            />
          </div>
        </div>
      }
    </>
  );
}
