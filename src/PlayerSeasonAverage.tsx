import React, { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Imeta, IStat } from "./types";
import { formatFetchStats } from "./utils";

export function PlayerSeasonAverageStats() {
  const { state } = useLocation();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const seasonsRef = useRef();

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    fetchData([state.playerId], signal);

    return () => {
      controller.abort();
    };
  }, []);

  async function fetchData(playerId: number[], signal: AbortSignal) {
    setIsLoading(true);
    const promiseArray = [];

    try {
      const statResponse = await fetch(formatFetchStats(playerId, [], 1), {
        signal,
      });

      const statResponseJson = await statResponse.json();
      const statMeta: Imeta = statResponseJson.meta;

      for (let i = 2; i < statMeta.total_pages + 1; i++) {
        promiseArray.push(formatFetchStats(playerId, [], i), {
          signal,
        });
      }
    } catch (e) {
      console.warn(e);
    }

    setIsLoading(false);
  }

  //   async function fetchSeasons(playerId: number[], signal: AbortSignal) {
  //       const statResponse = await fetch(formatFetchStats(playerId, [], 1), {
  //         signal,
  //       });

  //       const statResponseJson = await statResponse.json();
  //       const statMeta: Imeta = statResponseJson.meta;

  //       for (let i = 2; i < statMeta.total_pages + 1; i++) {
  //         const newStats = await fetch(formatFetchStats(playerId, [], i), {
  //           signal,
  //         });
  //         new
  //       }
  //   }

  return <div>WIP</div>;
}
