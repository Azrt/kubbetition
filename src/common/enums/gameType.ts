export enum GameType {
  OneVsOne = 1,
  TwoVsTwo = 2,
  ThreeVsThree = 3,
  FourVsFour = 4,
  SixVsSix = 6,
}

/** Game types that support divisions (no 1v1). Division size must match. */
export const DIVISION_GAME_TYPES: GameType[] = [
  GameType.TwoVsTwo,
  GameType.ThreeVsThree,
  GameType.FourVsFour,
  GameType.SixVsSix,
];