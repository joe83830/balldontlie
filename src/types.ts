export interface IAllPlayersMeta {
  current_page: number;
  next_page: number;
  per_page: number;
  total_count: number;
  total_pages: number;
}

export interface IAllPlayersPlayer {
  first_name: string;
  height_feet: number | null;
  height_inches: number | null;
  id: number;
  last_name: string;
  position: string;
  team: IAllPlayersTeam;
}

export interface IAllPlayersTeam {
  abbreviation: string;
  city: string;
  conference: string;
  division: string;
  full_name: string;
  id: number;
  name: string;
}
