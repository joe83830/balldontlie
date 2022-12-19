import Pagination from "@mui/material/Pagination/Pagination";
import { AgGridReact } from "ag-grid-react/lib/agGridReact";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { IAllPlayersMeta, IPlayer } from "./types";
import { formatFetchAllPlayersUrl } from "./utils";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { Link } from "react-router-dom";
import { ICellRendererParams } from "ag-grid-community/dist/lib/rendering/cellRenderers/iCellRenderer";

export default function AllPlayers() {
  const [allPlayerData, setAllPlayersData] = useState<Array<IPlayer>>([]);
  const [meta, setMeta] = useState<IAllPlayersMeta>({} as IAllPlayersMeta);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const columnDefs = [
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
  ];
  const agRef = useRef<AgGridReact<IPlayer> | null>(
    {} as AgGridReact<IPlayer> | null
  );

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    fetchAllPlayers(page, signal)
      .then((response) => {
        console.log(response.data);
        const playersData = response.data.map((player: IPlayer) => ({
          ...player,
          ...{ Name: `${player.first_name} ${player.last_name}` },
          ...{ team: player.team?.full_name },
        }));
        setAllPlayersData(playersData);
        setMeta(response.meta);
      })
      .catch((err) => {
        if (err.name == "AbortError") {
          console.warn("Request was aborted");
        } else {
          console.warn(err);
        }
      });

    return () => {
      controller.abort();
    };
  }, [page]);

  async function fetchAllPlayers(targetPage: number, signal: AbortSignal) {
    setIsLoading(true);
    const response = await fetch(formatFetchAllPlayersUrl(targetPage), {
      signal,
    });
    const jsonRes = await response.json();
    setIsLoading(false);
    return jsonRes;
  }

  function handlePageChange(_: React.ChangeEvent<unknown>, value: number) {
    console.log("Changing page, page = ", value);
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
        <div>
          <div className="ag-theme-alpine" style={{ height: 400, width: 600 }}>
            <AgGridReact
              ref={agRef}
              rowData={allPlayerData}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
            />
          </div>
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
