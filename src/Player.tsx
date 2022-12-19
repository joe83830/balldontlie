import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { IAllPlayersMeta, IPlayer, IStat } from "./types";
import { formatFetchSinglePlayerUrl, formatFetchStats } from "./utils";

export default function Player() {
  const { state } = useLocation();
  const [playerState, setPlayerState] = useState<IPlayer>({} as IPlayer);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [seasons, setSeasons] = useState<number[]>([]);
  const [statState, setStatState] = useState<IStat[]>([]);
  const [meta, setMeta] = useState<IAllPlayersMeta>({} as IAllPlayersMeta);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    fetchPlayerAndStat(state.playerId, signal).catch((err) => {
      if (err.name == "AbortError") {
        console.warn("Request was aborted");
      } else {
        console.warn(err);
      }
    });

    return () => {
      controller.abort();
    };
  }, [seasons]);

  async function fetchPlayerAndStat(playerId: number, signal: AbortSignal) {
    setIsLoading(true);
    const [playerResponse, statResponse] = await Promise.all([
      fetch(formatFetchSinglePlayerUrl(playerId), {
        signal,
      }).then(async (res) => await res.json()),
      fetch(formatFetchStats(playerId, seasons), {
        signal,
      }).then(async (res) => await res.json()),
    ]);
    setPlayerState(playerResponse);
    setStatState(statResponse.data);
    setMeta(statResponse.meta);

    setIsLoading(false);
  }

  return <div>Player Page</div>;
}
