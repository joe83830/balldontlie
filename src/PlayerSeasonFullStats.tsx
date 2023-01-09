import {
  Chip,
  CircularProgress,
  FormControlLabel,
  FormGroup,
  Switch,
  TextField,
} from "@mui/material";
import {
  IAggFuncParams,
  ValueFormatterParams,
  ModuleRegistry,
} from "@ag-grid-community/core";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation } from "react-router-dom";
import {
  FGTYPE,
  IPlayerSource,
  IStatRow,
  IStatSource,
  FGATYPE,
  FGMTYPE,
  RESULT,
} from "./types";
import { formatFetchSinglePlayerUrl, formatFetchStats } from "./utils";
import { AgGridReact } from "@ag-grid-community/react";
import "@ag-grid-community/styles/ag-grid.css";
import "@ag-grid-community/styles/ag-theme-alpine.css";
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
import { ColumnsToolPanelModule } from "@ag-grid-enterprise/column-tool-panel";
import { FiltersToolPanelModule } from "@ag-grid-enterprise/filter-tool-panel";
import { SetFilterModule } from "@ag-grid-enterprise/set-filter";
import { RangeSelectionModule } from "@ag-grid-enterprise/range-selection";
import { GridChartsModule } from "@ag-grid-enterprise/charts";
import { MenuModule } from "@ag-grid-enterprise/menu";
import { NBATeamsDataCacheKey } from "./constants";
import { ITeam } from "./types";

ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  ColumnsToolPanelModule,
  FiltersToolPanelModule,
  SetFilterModule,
  RangeSelectionModule,
  GridChartsModule,
  MenuModule,
]);

export default function PlayerSeasonFull(): JSX.Element {
  const [playerState, setPlayerState] = useState<IPlayerSource>();
  const { state } = useLocation();
  const [seasons, setSeasons] = useState<Array<string>>([]);
  const [stats, setStats] = useState<Record<string, IStatRow[]>>();
  const [playoffStats, setPlayoffStats] = useState<
    Record<string, IStatRow[]>
  >();
  const [noDataError, setNoDataError] = useState<string>("");
  const [availableSeason, setAvailableSeason] = useState<string>();
  const [playoffToggleChecked, setPlayoffToggleChecked] = useState<boolean>(
    false
  );
  const teamsDataRef = useRef<ITeam[]>([]);

  const fetchPlayer = useCallback(
    async (playerId: number[], signal: AbortSignal) => {
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
    },
    []
  );

  const fetchInitialStat = useCallback(
    async (playerId: number[], signal: AbortSignal) => {
      try {
        const statResponse = await fetch(formatFetchStats(playerId, []), {
          signal,
        });
        const statResponseJson = await statResponse.json();
        setAvailableSeason(statResponseJson.data[0].game.season);
      } catch (e) {
        console.warn(e);
      }
    },
    []
  );

  const massageStat = useCallback(
    (stat: IStatSource, playoffs: boolean, statArr: IStatRow[]) => {
      if (
        !!stat.min &&
        stat.min !== "00" &&
        stat.min !== "0" &&
        stat.game.postseason === playoffs
      ) {
        statArr.push({
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
          result:
            stat.team.id === stat.game.home_team_id
              ? stat.game.home_team_score > stat.game.visitor_team_score
                ? RESULT.WIN
                : RESULT.LOSS
              : stat.game.home_team_score > stat.game.visitor_team_score
              ? RESULT.LOSS
              : RESULT.WIN,
          opponent:
            teamsDataRef.current[stat.game.visitor_team_id - 1].full_name,
        });
      }
    },
    []
  );

  const fetchStats = useCallback(
    async (playerId: number[], signal: AbortSignal, seasons: string[]) => {
      if (seasons.length === 0) {
        return;
      }
      try {
        const statResponse = await fetch(
          formatFetchStats(playerId, [seasons[seasons.length - 1]]),
          {
            signal,
          }
        );

        const statResponseJson = await statResponse.json();

        if (statResponseJson.data.length === 0) {
          setNoDataError(seasons[seasons.length - 1]);
        }

        const massagedStats = [] as IStatRow[];
        const massagedPlayoffStats = [] as IStatRow[];

        statResponseJson.data.forEach((stat: IStatSource) => {
          massageStat(stat, false, massagedStats);
          massageStat(stat, true, massagedPlayoffStats);
        });

        setStats((prevStats) => ({
          ...prevStats,
          ...{ [seasons[seasons.length - 1]]: massagedStats },
        }));

        setPlayoffStats((prevStats) => ({
          ...prevStats,
          ...{ [seasons[seasons.length - 1]]: massagedPlayoffStats },
        }));
      } catch (e) {
        console.warn(e);
      }
    },
    [massageStat]
  );

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    fetchStats([state?.playerId], signal, seasons);

    return () => {
      controller.abort();
    };
  }, [seasons, fetchStats, state?.playerId]);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    fetchPlayer([state?.playerId], signal);
    fetchInitialStat([state?.playerId], signal);

    return () => {
      controller.abort();
    };
  }, [fetchInitialStat, fetchPlayer, state?.playerId]);

  useEffect(() => {
    if (!teamsDataRef.current.length) {
      const cachedTeamsData = localStorage.getItem(NBATeamsDataCacheKey);
      if (!!cachedTeamsData) {
        teamsDataRef.current = JSON.parse(cachedTeamsData);
      }
    }
  }, []);

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
        if (!!params.value) {
          if (params.value[field] === 0) {
            return "0%";
          }
          return `${params.value[field].toFixed(2).split(".")[1]}%`;
        }
        return "";
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

      let formattedSecs;
      const secsRemainder = avgSecs - avgMins * 60;
      if (secsRemainder === 0) {
        formattedSecs = "00";
      } else if (secsRemainder < 10) {
        formattedSecs = `0${secsRemainder}`;
      } else {
        formattedSecs = `${secsRemainder}`;
      }

      return `${avgMins}:${formattedSecs}`;
    }
  }, []);

  const minFormatterFunc = useCallback(
    (params: ValueFormatterParams<IStatRow>): string => {
      if (!!params.value) {
        if (!params.value.split(":")[1]) {
          return `${params.value}:00`;
        } else {
          return params.value;
        }
      }
      return "";
    },
    []
  );

  const aggFuncs = useMemo(
    () => ({
      minFunc: minAvgFunc,
      fgPercentageAggFunc: percentageAggFactory(
        FGATYPE.fieldGoal,
        FGMTYPE.fieldGoal,
        FGTYPE.fieldGoal
      ),
      threePtPercentageAggFunc: percentageAggFactory(
        FGATYPE.threePt,
        FGMTYPE.threePt,
        FGTYPE.threePt
      ),
      ftPercentageAggFunc: percentageAggFactory(
        FGATYPE.freeThrow,
        FGMTYPE.freeThrow,
        FGTYPE.freeThrow
      ),
    }),
    [minAvgFunc, percentageAggFactory]
  );

  const playerPageColDef = useMemo(
    () => [
      { field: "date" },
      { field: "season", enableRowGroup: true, rowGroup: true },
      {
        field: "pts",
        aggFunc: "avg",
        filter: "agNumberColumnFilter",
        valueFormatter: toFixedFormatterFunc,
      },
      {
        field: "ast",
        aggFunc: "avg",
        filter: "agNumberColumnFilter",
        valueFormatter: toFixedFormatterFunc,
      },
      {
        field: "reb",
        aggFunc: "avg",
        filter: "agNumberColumnFilter",
        valueFormatter: toFixedFormatterFunc,
      },
      {
        field: "dreb",
        aggFunc: "avg",
        filter: "agNumberColumnFilter",
        valueFormatter: toFixedFormatterFunc,
      },
      {
        field: "oreb",
        aggFunc: "avg",
        filter: "agNumberColumnFilter",
        valueFormatter: toFixedFormatterFunc,
      },
      {
        field: "stl",
        aggFunc: "avg",
        filter: "agNumberColumnFilter",
        valueFormatter: toFixedFormatterFunc,
      },
      {
        field: "blk",
        aggFunc: "avg",
        filter: "agNumberColumnFilter",
        valueFormatter: toFixedFormatterFunc,
      },
      {
        field: FGTYPE.fieldGoal,
        filter: "agNumberColumnFilter",
        aggFunc: "fgPercentageAggFunc",
        valueFormatter: percentageFormatterFactory(FGTYPE.fieldGoal),
      },
      {
        field: "fga",
        aggFunc: "avg",
        filter: "agNumberColumnFilter",
        valueFormatter: toFixedFormatterFunc,
      },
      {
        field: "fgm",
        aggFunc: "avg",
        filter: "agNumberColumnFilter",
        valueFormatter: toFixedFormatterFunc,
      },
      {
        field: FGTYPE.threePt,
        filter: "agNumberColumnFilter",
        aggFunc: "threePtPercentageAggFunc",
        valueFormatter: percentageFormatterFactory(FGTYPE.threePt),
      },
      {
        field: "fg3a",
        filter: "agNumberColumnFilter",
        aggFunc: "avg",
        valueFormatter: toFixedFormatterFunc,
      },
      {
        field: "fg3m",
        filter: "agNumberColumnFilter",
        aggFunc: "avg",
        valueFormatter: toFixedFormatterFunc,
      },
      {
        field: FGTYPE.freeThrow,
        filter: "agNumberColumnFilter",
        aggFunc: "ftPercentageAggFunc",
        valueFormatter: percentageFormatterFactory(FGTYPE.freeThrow),
      },
      {
        field: "fta",
        filter: "agNumberColumnFilter",
        aggFunc: "avg",
        valueFormatter: toFixedFormatterFunc,
      },
      {
        field: "ftm",
        filter: "agNumberColumnFilter",
        aggFunc: "avg",
        valueFormatter: toFixedFormatterFunc,
      },
      {
        field: "min",
        aggFunc: "minFunc",
        valueFormatter: minFormatterFunc,
      },
      {
        field: "pf",
        filter: "agNumberColumnFilter",
        aggFunc: "avg",
        valueFormatter: toFixedFormatterFunc,
      },
      {
        field: "turnover",
        filter: "agNumberColumnFilter",
        aggFunc: "avg",
        valueFormatter: toFixedFormatterFunc,
      },
      { field: "result", filter: true },
      { field: "team", filter: true },
      { field: "opponent", filter: true },
    ],
    [minFormatterFunc, toFixedFormatterFunc, percentageFormatterFactory]
  );

  const defaultColDef = useMemo(() => {
    return {
      enableValue: true,
      enableRowGroup: true,
      enablePivot: true,
      sortable: true,
    };
  }, []);

  const handleAddSeason = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const season = (e.target as HTMLInputElement).value;
      (e.target as HTMLInputElement).value = "";
      setSeasons((curSeasons) => {
        if (curSeasons.length === 0) {
          setStats({});
          setPlayoffStats({});
        }
        if (!curSeasons.includes(season)) {
          return [...curSeasons, season];
        } else {
          return curSeasons;
        }
      });
      e.preventDefault();
    },
    []
  );

  const deleteSeason = useCallback((season: string, noDataError: string) => {
    return () => {
      if (season === noDataError) {
        setNoDataError("");
      }
      setStats((curStats) => {
        if (!!curStats) delete curStats[season];
        return curStats;
      });
      setPlayoffStats((curStats) => {
        if (!!curStats) delete curStats[season];
        return curStats;
      });
      setSeasons((curSeasons) => curSeasons.filter((s) => s !== season));
    };
  }, []);

  const handleTogglePlayoff = useCallback(() => {
    setPlayoffToggleChecked((curPlayoffChecked) => !curPlayoffChecked);
  }, []);

  const getHeight = useCallback((playerState: IPlayerSource) => {
    if (!!playerState) {
      const formattedHeight = !!playerState.height_feet
        ? `${playerState.height_feet} ' ${playerState.height_inches} "`
        : "N/A";
      return `Height: ${formattedHeight}`;
    }
  }, []);

  const getRowData = () => {
    const rowData = playoffToggleChecked ? playoffStats : stats;
    return !!rowData
      ? Object.values(rowData).flat()
      : !!seasons.length
      ? null
      : [];
  };

  return (
    <>
      {
        <div className="u-flex-col-allplayers">
          <div className="u-flex-inner-allplayers" id="innerContainer">
            {!playerState && <CircularProgress />}
            {!!playerState && (
              <>
                <h3>{`${playerState.first_name} ${playerState.last_name}`}</h3>
                <div>{`Rookie Season: ${availableSeason}`}</div>
                <div className="u-flex-row">
                  <div className="stack-x">
                    <div className="hamburger-margin">{`Position: ${playerState.position}`}</div>
                    <div className="hamburger-margin">
                      {getHeight(playerState)}
                    </div>
                  </div>
                  <div>
                    <div className="hamburger-margin">{`Latest Team: ${playerState.team.city} ${playerState.team.name}`}</div>
                    <div className="hamburger-margin">{`Conference / Division: ${playerState.team.conference} / ${playerState.team.division}`}</div>
                  </div>
                </div>
              </>
            )}

            <div className="hamburger-margin u-flex-row">
              <div className="u-flex-row">
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
                {Array.from(seasons).map((season, i) => (
                  <div className="right-margin" key={`${season}-${i}`}>
                    <Chip
                      label={season}
                      onDelete={deleteSeason(season, noDataError)}
                    />
                  </div>
                ))}
              </div>
              <div>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={playoffToggleChecked}
                        onChange={handleTogglePlayoff}
                      />
                    }
                    label="Playoffs"
                  />
                </FormGroup>
              </div>
            </div>
            {noDataError && (
              <div
                style={{ color: "red", marginBottom: "12px" }}
              >{`No Data for season ${noDataError}, try ${availableSeason}!`}</div>
            )}
            <AgGridReact
              className="ag-theme-alpine"
              rowData={getRowData()}
              columnDefs={playerPageColDef}
              defaultColDef={defaultColDef}
              animateRows
              rowSelection="multiple"
              rowGroupPanelShow="always"
              overlayNoRowsTemplate="No data to be shown"
              loadingOverlayComponent={CircularProgress}
              suppressAggFuncInHeader
              sideBar
              enableRangeSelection
              enableCharts
              popupParent={document.getElementById("innerContainer")}
              aggFuncs={aggFuncs}
            />
          </div>
        </div>
      }
    </>
  );
}
