import { getAllPlayersApi, getSinglePlayerApi, getStatsApi } from "./constants";

export function formatFetchAllPlayersUrl(
  page: number,
  searchTerm: string = ""
) {
  return `${getAllPlayersApi}?page=${page}&search=${searchTerm}`;
}

export function formatFetchSinglePlayerUrl(playerId: number) {
  return `${getSinglePlayerApi}${playerId}`;
}

export function formatFetchStats(
  playerIds: number[],
  seasons: number[],
  page: number
) {
  let url = `${getStatsApi}?page=${page}`;

  playerIds.forEach((pid) => {
    url += `&player_ids[]=${pid}`;
  });

  seasons.forEach((season) => {
    url += `&seasons[]=${season}`;
  });
  return url;
}
