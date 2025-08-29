export interface CheckNicknameRequest {
  nickname: string;
}

export interface RegisterRankingRequest {
  member_no: number;
  nickname: string;
  score: number;
}