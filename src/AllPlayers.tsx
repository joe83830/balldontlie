import Pagination from "@mui/material/Pagination/Pagination";
import { AgGridReact } from "ag-grid-react/lib/agGridReact";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { IAllPlayersMeta, IAllPlayersPlayer } from "./types";
import { formatFetchAllPlayersUrl } from "./utils";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

export default function AllPlayers() {
  const [allPlayerData, setAllPlayersData] = useState<Array<IAllPlayersPlayer>>(
    []
  );
  const [meta, setMeta] = useState<IAllPlayersMeta>({} as IAllPlayersMeta);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [columnDefs, _] = useState([
    { field: "first_name" },
    { field: "last_name" },
    { field: "height_feet", filter: true },
    { field: "height_inches", filter: true },
    { field: "position", filter: true },
    { field: "team", filter: true },
  ]);
  const agRef = useRef<AgGridReact<IAllPlayersPlayer> | null>(
    {} as AgGridReact<IAllPlayersPlayer> | null
  );

  useEffect(() => {
    console.log("useEffect triggered");
    fetchAllPlayers(page)
      .then((response) => {
        console.log(response.data);
        setAllPlayersData(response.data);
        setMeta(response.meta);
      })
      .catch((err) => console.warn(err));
  }, [page]);

  async function fetchAllPlayers(targetPage: number) {
    setIsLoading(true);
    const response = await fetch(formatFetchAllPlayersUrl(targetPage));
    const jsonRes = await response.json();
    setIsLoading(false);
    return jsonRes;
  }

  function handlePageChange(_: React.ChangeEvent<unknown>, value: number) {
    console.log("Changing page");
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
