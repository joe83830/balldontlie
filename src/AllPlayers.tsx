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
import { Link } from "react-router-dom";
import { ICellRendererParams, Module, ModuleRegistry } from "ag-grid-community";
import debounce from "lodash.debounce";
import TextField from "@mui/material/TextField/TextField";
import "./App.css";
import { RowGroupingModule } from "@ag-grid-enterprise/row-grouping";
import { RangeSelectionModule } from "@ag-grid-enterprise/range-selection";
import { RichSelectModule } from "@ag-grid-enterprise/rich-select";
import CircularProgress from "@mui/material/CircularProgress/CircularProgress";

ModuleRegistry.registerModules([
  RangeSelectionModule as Module,
  RowGroupingModule as Module,
  RichSelectModule as Module,
]);

export default function AllPlayers() {
  const [allPlayerData, setAllPlayersData] = useState<Array<IPlayerRow>>([]);
  const [meta, setMeta] = useState<IAllPlayersMeta>({} as IAllPlayersMeta);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const columnDefs = useMemo(
    () => [
      {
        field: "Name",
        cellRenderer: (params: ICellRendererParams<IPlayerRow>) => {
          console.log(params.data);
          return (
            <Link
              state={{ playerInfo: params.data }}
              to={`playerFullStat/${params.data?.id}`}
            >
              {params.data?.Name}
            </Link>
          );
        },
      },
      { field: "height_feet", filter: true },
      { field: "height_inches", filter: true },
      { field: "position", enableRowGroup: true, filter: true },
      {
        field: "team",
        filter: true,
        enableRowGroup: true,
      },
    ],
    []
  );

  const agRef = useRef<AgGridReact<IPlayerRow> | null>(
    {} as AgGridReact<IPlayerRow> | null
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
    setIsLoading(true);
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
      setAllPlayersData(playersData);
      setMeta(jsonRes.meta);
      setIsLoading(false);
    } catch (e) {
      console.warn(e);
    }
  }

  const debouncedFetch = useCallback(debounce(fetchAllPlayers, 1000), []);

  function handleSearch(term: string) {
    const controller = new AbortController();
    const signal = controller.signal;
    setSearchTerm(term);
    debouncedFetch(page, searchTerm, signal);
  }

  function handlePageChange(_: React.ChangeEvent<unknown>, value: number) {
    setPage(value);
  }

  const defaultColDef = useMemo(
    () => ({
      sortable: true,
    }),
    []
  );

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
              ref={agRef}
              rowData={allPlayerData}
              columnDefs={columnDefs}
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
