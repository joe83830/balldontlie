import { Chip, CircularProgress, TextField } from "@mui/material";
import {
  IAggFuncParams,
  ValueFormatterParams,
  ModuleRegistry,
} from "@ag-grid-community/core";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  FGTYPE,
  IPlayerSource,
  IStatRow,
  IStatSource,
  FGATYPE,
  FGMTYPE,
  FGPFG,
  FGPCollection,
  ObjectType,
} from "./types";
import { formatFetchSinglePlayerUrl, formatFetchStats } from "./utils";
import { AgGridReact } from "@ag-grid-community/react";
import "@ag-grid-community/styles/ag-grid.css";
import "@ag-grid-community/styles/ag-theme-alpine.css";
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
import { ColumnsToolPanelModule } from "@ag-grid-enterprise/column-tool-panel";
import { FiltersToolPanelModule } from "@ag-grid-enterprise/filter-tool-panel";
import { SetFilterModule } from "@ag-grid-enterprise/set-filter";
import { TypeName } from "./types";

ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  ColumnsToolPanelModule,
  FiltersToolPanelModule,
  SetFilterModule,
]);

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
        if (!!stat.min && stat.min !== "00" && stat.min !== "0") {
          massagedStats.push({
            ...stat,
            date: stat.game.date.split("T")[0],
            season: stat.game.season,
            team: stat.team?.full_name,
            min: stat.min,
            [FGTYPE.fieldGoal]: {
              type: "fg",
              [FGTYPE.fieldGoal]: stat.fg_pct,
              [FGATYPE.fieldGoal]: stat.fga,
              [FGMTYPE.fieldGoal]: stat.fgm,
            },
            [FGTYPE.threePt]: {
              type: "3p",
              [FGTYPE.threePt]: stat.fg3_pct,
              [FGATYPE.threePt]: stat.fg3a,
              [FGMTYPE.threePt]: stat.fg3m,
            },
            [FGTYPE.freeThrow]: {
              type: "ft",
              [FGTYPE.freeThrow]: stat.ft_pct,
              [FGATYPE.freeThrow]: stat.fta,
              [FGMTYPE.freeThrow]: stat.ftm,
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

  // Return type of the returned function has to be the same as what's defined in IStatRow
  const percentageAggFactory = useMemo(
    () => (attemptField: FGATYPE, madeField: FGMTYPE, percentField: FGTYPE) => {
      return (params: IAggFuncParams<IStatRow>) => {
        if (!!params.values && !!params.rowNode.key) {
          const { totalA, totalM } = params.values.reduce(
            (acc, cur) => ({
              totalA: acc.totalA + (!!cur && cur[attemptField]),
              totalM: acc.totalM + (!!cur && cur[madeField]),
            }),
            {
              totalA: 0,
              totalM: 0,
            }
          );

          return {
            [percentField]: totalA === 0 ? 0 : totalM / totalA,
            [attemptField]: totalA,
            [madeField]: totalM,
          };
        }
      };
    },
    []
  );

  const percentageFormatterFactory = useMemo(
    () => (field: FGTYPE) => {
      return (params: ValueFormatterParams<IStatRow>) => {
        if (params.value[field] === 0) {
          return "0%";
        }
        return `${params.value[field].toFixed(2).split(".")[1]}%`;
      };
    },
    []
  );

  const minAvgFunc = useCallback((params: IAggFuncParams<IStatRow, string>) => {
    if (!!params.values && !!params.rowNode.key) {
      let totalMins = 0;
      let totalSecs = 0;
      params.values.forEach((minString) => {
        const [min, sec] = minString.split(":");
        if (!!sec) {
          totalSecs += parseInt(sec);
        }
        totalMins += parseInt(min);
      });
      totalSecs += totalMins * 60;
      const avgSecs = Math.round(totalSecs / params.values.length);
      const avgMins = Math.floor(avgSecs / 60);
      let secsRemainder =
        avgSecs - avgMins * 60 === 0 ? "00" : `${avgSecs - avgMins * 60}`;

      return `${avgMins}:${secsRemainder}`;
    }
  }, []);

  const minFormatterFunc = useCallback(
    (params: ValueFormatterParams<IStatRow>) => {
      if (!!params.value) {
        if (!params.value.split(":")[1]) {
          return `${params.value}:00`;
        } else {
          return params.value;
        }
      }
    },
    []
  );

  const playerPageColDef = useMemo(
    () => [
      { field: "date" },
      { field: "season", enableRowGroup: true, rowGroup: true },
      {
        field: "pts",
        aggFunc: "avg",
        valueFormatter: toFixedFormatterFunc,
      },
      {
        field: "ast",
        aggFunc: "avg",
        valueFormatter: toFixedFormatterFunc,
      },
      {
        field: "reb",
        aggFunc: "avg",
        valueFormatter: toFixedFormatterFunc,
      },
      {
        field: "dreb",
        aggFunc: "avg",
        valueFormatter: toFixedFormatterFunc,
      },
      {
        field: "oreb",
        aggFunc: "avg",
        valueFormatter: toFixedFormatterFunc,
      },
      {
        field: "stl",
        aggFunc: "avg",
        valueFormatter: toFixedFormatterFunc,
      },
      {
        field: "blk",
        aggFunc: "avg",
        valueFormatter: toFixedFormatterFunc,
      },
      {
        field: FGTYPE.fieldGoal,
        aggFunc: percentageAggFactory(
          FGATYPE.fieldGoal,
          FGMTYPE.fieldGoal,
          FGTYPE.fieldGoal
        ),
        valueFormatter: percentageFormatterFactory(FGTYPE.fieldGoal),
      },
      {
        field: "fga",
        aggFunc: "avg",
        valueFormatter: toFixedFormatterFunc,
      },
      {
        field: "fgm",
        aggFunc: "avg",
        valueFormatter: toFixedFormatterFunc,
      },
      {
        field: FGTYPE.threePt,
        aggFunc: percentageAggFactory(
          FGATYPE.threePt,
          FGMTYPE.threePt,
          FGTYPE.threePt
        ),
        valueFormatter: percentageFormatterFactory(FGTYPE.threePt),
      },
      {
        field: "fg3a",
        aggFunc: "avg",
        valueFormatter: toFixedFormatterFunc,
      },
      {
        field: "fg3m",
        aggFunc: "avg",
        valueFormatter: toFixedFormatterFunc,
      },
      {
        field: FGTYPE.freeThrow,
        aggFunc: percentageAggFactory(
          FGATYPE.freeThrow,
          FGMTYPE.freeThrow,
          FGTYPE.freeThrow
        ),
        valueFormatter: percentageFormatterFactory(FGTYPE.freeThrow),
      },
      {
        field: "fta",
        aggFunc: "avg",
        valueFormatter: toFixedFormatterFunc,
      },
      {
        field: "ftm",
        aggFunc: "avg",
        valueFormatter: toFixedFormatterFunc,
      },
      {
        field: "min",
        aggFunc: minAvgFunc,
        valueFormatter: minFormatterFunc,
      },
      {
        field: "pf",
        aggFunc: "avg",
        valueFormatter: toFixedFormatterFunc,
      },
      {
        field: "turnover",
        aggFunc: "avg",
        valueFormatter: toFixedFormatterFunc,
      },
      { field: "team" },
    ],
    []
  );

  const defaultColDef = useMemo(() => {
    return {
      // flex: 1,
      // allow every column to be aggregated
      enableValue: true,
      // allow every column to be grouped
      enableRowGroup: true,
      // allow every column to be pivoted
      enablePivot: true,
      sortable: true,
      filter: true,
    };
  }, []);

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
