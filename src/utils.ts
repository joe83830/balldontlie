import { getAllPlayersApi, getSinglePlayerApi, getStatsApi } from "./constants";

export function formatFetchAllPlayersUrl(page: number) {
  return `${getAllPlayersApi}?page=${page}`;
}

export function formatFetchSinglePlayerUrl(playerId: number) {
  return `${getSinglePlayerApi}${playerId}`;
}

export function formatFetchStats(playerId: number, seasons: number[]) {
  let url = `${getStatsApi}?player_ids[]=${playerId}`;
  seasons.forEach((season) => {
    url += `&seasons[]=${season}`;
  });
  return url;
}
