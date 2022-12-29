export interface IAllPlayersMeta {
  current_page: number;
  next_page: number;
  per_page: number;
  total_count: number;
  total_pages: number;
}

export interface IPlayerSource {
  first_name: string;
  height_feet: number | null;
  height_inches: number | null;
  id: number;
  last_name: string;
  position: string;
  team: ITeam;
}

export interface IPlayerRow {
  Name: string;
  height_feet: number | null;
  height_inches: number | null;
  id: number;
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

export interface IStatSource {
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
  player: IPlayerSource;
  pts: number;
  reb: number;
  stl: number;
  team: ITeam;
  turnover: number;
}

export enum FGTYPE {
  fieldGoal = "fg_pct",
  threePt = "fg3_pct",
  freeThrow = "ft_pct",
}

export enum FGATYPE {
  fieldGoal = "fga",
  threePt = "fg3a",
  freeThrow = "fta",
}

export enum FGMTYPE {
  fieldGoal = "fgm",
  threePt = "fg3m",
  freeThrow = "ftm",
}

export interface FGPFG {
  type: "fg";
  [FGTYPE.fieldGoal]: number;
  [FGATYPE.fieldGoal]: number;
  [FGMTYPE.fieldGoal]: number;
}

export interface FGPFT {
  type: "ft";
  [FGTYPE.freeThrow]: number;
  [FGATYPE.freeThrow]: number;
  [FGMTYPE.freeThrow]: number;
}

export interface FGP3P {
  type: "3p";
  [FGTYPE.threePt]: number;
  [FGATYPE.threePt]: number;
  [FGMTYPE.threePt]: number;
}

export type TypeName = "fg" | "ft" | "3p";

export type ObjectType<T> = T extends "fg"
  ? FGPFG
  : T extends "ft"
  ? FGPFT
  : T extends "3p"
  ? FGP3P
  : never;
export interface FGPCollection {
  [FGTYPE.fieldGoal]: FGPFG;
  [FGTYPE.freeThrow]: FGPFT;
  [FGTYPE.threePt]: FGP3P;
}
export interface IStatRow {
  id: number;
  ast: number;
  blk: number;
  dreb: number;
  [FGTYPE.threePt]: FGP3P;
  fg3a: number;
  fg3m: number;
  [FGTYPE.fieldGoal]: FGPFG;
  fga: number;
  fgm: number;
  [FGTYPE.freeThrow]: FGPFT;
  fta: number;
  ftm: number;
  date: string;
  season: number;
  min: string;
  oreb: number;
  pf: number;
  player: IPlayerSource;
  pts: number;
  reb: number;
  stl: number;
  team: string;
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

export interface Imeta {
  total_pages: number;
  current_page: number;
  next_page: number;
  per_page: number;
  total_count: number;
}
