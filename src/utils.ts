import { getAllPlayersApi } from "./constants";

export function formatFetchAllPlayersUrl(page: number) {
  return `${getAllPlayersApi}?page=${page}`;
}
