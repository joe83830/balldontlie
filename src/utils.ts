import {
  getAllPlayersApi,
  getSeasonAverageApi,
  getSinglePlayerApi,
  getStatsApi,
} from "./constants";

export function formatFetchAllPlayersUrl(
  page: number,
  searchTerm: string = ""
) {
  if (searchTerm.length > 0) {
    return `${getAllPlayersApi}?search=${searchTerm}`;
  }
  return `${getAllPlayersApi}?page=${page}&search=${searchTerm}&per_page=100`;
}

export function formatFetchSinglePlayerUrl(playerId: number) {
  return `${getSinglePlayerApi}${playerId}`;
}

export function formatFetchStats(playerIds: number[], seasons: string[]) {
  let url = `${getStatsApi}?page=1&per_page=100`;

  playerIds.forEach((pid) => {
    url += `&player_ids[]=${pid}`;
  });

  seasons.forEach((season) => {
    url += `&seasons[]=${season}`;
  });
  return url;
}

export function formatFetchAverage(playerIds: number[], season: number) {
  let url = `${getSeasonAverageApi}?season=${season}`;

  playerIds.forEach((pid) => {
    url += `&player_ids[]=${pid}`;
  });
  return url;
}
