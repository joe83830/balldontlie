import Pagination from "@mui/material/Pagination/Pagination";
import { AgGridReact } from "ag-grid-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { IAllPlayersMeta, IPlayerRow, IPlayerSource } from "./types";
import { formatFetchAllPlayersUrl } from "./utils";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import {
  createSearchParams,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { ICellRendererParams, Module, ModuleRegistry } from "ag-grid-community";
import debounce from "lodash.debounce";
import TextField from "@mui/material/TextField/TextField";
import "./App.css";
import { RowGroupingModule } from "@ag-grid-enterprise/row-grouping";
import { RangeSelectionModule } from "@ag-grid-enterprise/range-selection";
import { RichSelectModule } from "@ag-grid-enterprise/rich-select";
import { CircularProgress } from "@mui/material";
import { getAllTeamsApi, NBATeamsDataCacheKey } from "./constants";

ModuleRegistry.registerModules([
  RangeSelectionModule as Module,
  RowGroupingModule as Module,
  RichSelectModule as Module,
]);

export default function AllPlayers() {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const page = parseInt(query.get("page") || "1", 10);
  const existingSearchTerm = query.get("searchTerm") || "";
  const navigate = useNavigate();
  const [allPlayerData, setAllPlayersData] = useState<Array<IPlayerRow>>();
  const [meta, setMeta] = useState<IAllPlayersMeta>({} as IAllPlayersMeta);
  const [searchTerm, setSearchTerm] = useState<string>(existingSearchTerm);

  const [debouncedSearchTerm, setDebouncedSearchTerm] =
    useState(existingSearchTerm);

  const debouncedHandleSearch = useCallback(
    debounce((term) => {
      setDebouncedSearchTerm(term);
    }, 500),
    [debounce, setDebouncedSearchTerm]
  );

  const columnDefs = useMemo(
    () => [
      {
        field: "Name",
        cellRenderer: (params: ICellRendererParams<IPlayerRow>) => {
          return (
            <Link
              state={{ playerId: params.data?.id }}
              to={`playerFullStat/${params.data?.id}`}
            >
              {params.data?.Name}
            </Link>
          );
        },
      },
      {
        field: "height_feet",
        filter: "agNumberColumnFilter",
        enableRowGroup: true,
      },
      {
        field: "height_inches",
        filter: "agNumberColumnFilter",
        enableRowGroup: true,
      },
      {
        field: "weight_pounds",
        filter: "agNumberColumnFilter",
        enableRowGroup: true,
      },
      { field: "position", enableRowGroup: true, filter: true },
      {
        field: "team",
        filter: true,
        enableRowGroup: true,
        flex: 1,
      },
    ],
    []
  );

  const fetchAllPlayers = useCallback(
    async (targetPage: number, search: string, signal: AbortSignal) => {
      try {
        const response = await fetch(
          formatFetchAllPlayersUrl(targetPage, search),
          {
            signal,
          }
        );
        const jsonRes = await response.json();
        const playersData: IPlayerRow[] = jsonRes.data.map(
          (player: IPlayerSource) => ({
            ...player,
            ...{ Name: `${player.first_name} ${player.last_name}` },
            ...{ team: player.team?.full_name },
          })
        );
        navigate({
          pathname: "/",
          search: createSearchParams({
            page: targetPage.toString(),
            searchTerm: search,
          }).toString(),
        });
        setAllPlayersData(playersData);
        setMeta(jsonRes.meta);
      } catch (e) {
        console.warn(e);
      }
    },
    [navigate]
  );

  useEffect(() => {
    const cachedTeamData = localStorage.getItem(NBATeamsDataCacheKey);
    if (!cachedTeamData) {
      const controller = new AbortController();
      const signal = controller.signal;
      fetch(getAllTeamsApi, {
        signal,
      })
        .then((res) => res.json())
        .then((res) =>
          localStorage.setItem(NBATeamsDataCacheKey, JSON.stringify(res.data))
        )
        .catch((e) => console.warn(e));

      return () => {
        controller.abort();
      };
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    fetchAllPlayers(page, debouncedSearchTerm, signal);

    return () => {
      controller.abort();
    };
  }, [page, fetchAllPlayers, debouncedSearchTerm]);

  const handlePageChange = useCallback(
    (_: React.ChangeEvent<unknown>, value: number, searchTerm: string) => {
      navigate({
        pathname: "/",
        search: createSearchParams({
          page: value.toString(),
          searchTerm: searchTerm,
        }).toString(),
      });
    },
    [navigate]
  );

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    debouncedHandleSearch(term);
  };

  return (
    <>
      {
        <div className="u-flex-col-allplayers">
          <div className="u-flex-inner-allplayers" id="inner">
            <TextField
              id="outlined-basic"
              label="Search Player"
              variant="outlined"
              onChange={(e) => handleSearch(e.target.value)}
              value={searchTerm}
            />
            <AgGridReact
              className="ag-theme-alpine grid-container"
              rowData={allPlayerData}
              columnDefs={columnDefs}
              animateRows={true}
              rowSelection="multiple"
              rowGroupPanelShow="always"
              overlayNoRowsTemplate="No data to be shown"
              loadingOverlayComponent={CircularProgress}
            />
            <div className="hamburger-margin">
              <Pagination
                count={meta?.total_pages || 1}
                page={page}
                onChange={(e, value) => handlePageChange(e, value, searchTerm)}
              />
            </div>
          </div>
        </div>
      }
    </>
  );
}
