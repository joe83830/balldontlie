import Pagination from "@mui/material/Pagination/Pagination";
import { AgGridReact } from "ag-grid-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  const [allPlayerData, setAllPlayersData] = useState<Array<IPlayerRow>>([]);
  const [meta, setMeta] = useState<IAllPlayersMeta>({} as IAllPlayersMeta);
  const [searchTerm, setSearchTerm] = useState<string>(existingSearchTerm);

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
      { field: "height_feet", filter: true, enableRowGroup: true },
      { field: "height_inches", filter: true },
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
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    fetchAllPlayers(page, searchTerm, signal);

    return () => {
      controller.abort();
    };
  }, [page]);

  async function fetchAllPlayers(
    targetPage: number,
    search: string,
    signal: AbortSignal
  ) {
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
          page: page.toString(),
          searchTerm: search,
        }).toString(),
      });
      setAllPlayersData(playersData);
      setMeta(jsonRes.meta);
    } catch (e) {
      console.warn(e);
    }
  }

  const debouncedFetch = useCallback(debounce(fetchAllPlayers, 1000), []);

  function handlePageChange(_: React.ChangeEvent<unknown>, value: number) {
    navigate({
      pathname: "/",
      search: createSearchParams({
        page: value.toString(),
        searchTerm: searchTerm,
      }).toString(),
    });
  }

  function handleSearch(term: string) {
    const controller = new AbortController();
    const signal = controller.signal;
    setSearchTerm(term);
    debouncedFetch(page, term, signal);
  }

  const defaultColDef = useMemo(
    () => ({
      sortable: true,
    }),
    []
  );
  return (
    <>
      {
        <div className="u-flex-col">
          <div className="u-flex-inner" id="inner">
            <TextField
              id="outlined-basic"
              label="Search Player"
              variant="outlined"
              onChange={(e) => handleSearch(e.target.value)}
              value={searchTerm}
            />
            {/* </div> */}

            <AgGridReact
              className="ag-theme-alpine grid-container"
              rowData={allPlayerData}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              animateRows={true}
              rowSelection="multiple"
              rowGroupPanelShow="always"
              overlayNoRowsTemplate="Please wait while data loads..."
            />
            <div className="hamburger-margin">
              <Pagination
                count={meta?.total_pages || 1}
                page={page}
                onChange={handlePageChange}
              />
            </div>
          </div>
        </div>
      }
    </>
  );
}
