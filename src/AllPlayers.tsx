import Pagination from "@mui/material/Pagination/Pagination";
import { AgGridReact } from "ag-grid-react/lib/agGridReact";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { IAllPlayersMeta, IPlayer } from "./types";
import { formatFetchAllPlayersUrl } from "./utils";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { Link } from "react-router-dom";
import { ICellRendererParams } from "ag-grid-community/dist/lib/rendering/cellRenderers/iCellRenderer";
import debounce from "lodash.debounce";
import TextField from "@mui/material/TextField/TextField";
import "./App.css";

export default function AllPlayers() {
  const [allPlayerData, setAllPlayersData] = useState<Array<IPlayer>>([]);
  const [meta, setMeta] = useState<IAllPlayersMeta>({} as IAllPlayersMeta);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const columnDefs = useMemo(
    () => [
      {
        field: "Name",
        cellRenderer: (params: ICellRendererParams) => {
          // console.log("In renderer");
          // console.log(params);
          return (
            <Link
              state={{ playerId: params.data.id }}
              to={`player/${params.data.id}`}
            >
              {params.data.Name}
            </Link>
          );
        },
      },
      { field: "height_feet", filter: true },
      { field: "height_inches", filter: true },
      { field: "position", filter: true },
      { field: "team", filter: true },
    ],
    []
  );

  const agRef = useRef<AgGridReact<IPlayer> | null>(
    {} as AgGridReact<IPlayer> | null
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
      const playersData = jsonRes.data.map((player: IPlayer) => ({
        ...player,
        ...{ Name: `${player.first_name} ${player.last_name}` },
        ...{ team: player.team?.full_name },
      }));
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
      {isLoading && <div>LOADING</div>}{" "}
      {!isLoading && (
        <div className="u-flex">
          {/* <div className="hamburger-padding"> */}
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
