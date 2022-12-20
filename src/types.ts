export interface IAllPlayersMeta {
  current_page: number;
  next_page: number;
  per_page: number;
  total_count: number;
  total_pages: number;
}

export interface IPlayer {
  first_name: string;
  height_feet: number | null;
  height_inches: number | null;
  id: number;
  last_name: string;
  position: string;
  team: ITeam;
}

export interface ITeam {
  abbreviation: string;
  city: string;
  conference: string;
  division: string;
  full_name: string;
  id: number;
  name: string;
}

export interface IStat {
  id: number;
  ast: number;
  blk: number;
  dreb: number;
  fg3_pct: number;
  fg3a: number;
  fg3m: number;
  fg_pct: number;
  fga: number;
  fgm: number;
  ft_pct: number;
  fta: number;
  ftm: number;
  game: IGame;
  min: string;
  oreb: number;
  pf: number;
  player: IPlayer;
  pts: number;
  reb: number;
  stl: number;
  team: ITeam;
  turnover: number;
}

export interface IGame {
  id: number;
  date: string;
  home_team_id: number;
  home_team_score: number;
  period: number;
  postseason: boolean;
  season: number;
  status: string;
  time: " ";
  visitor_team_id: number;
  visitor_team_score: number;
}
