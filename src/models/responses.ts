export interface ApiErrorResponse {
  error: string;
}

export interface ApiSuccessResponse {
  success: boolean;
  message: string;
}

export interface CheckNicknameResponse {
  value: {
    duplicated: boolean;
    member?: {
      member_no: number;
    };
  };
}

export interface RankingResponse {
  value: {
    top_rank: Array<{
      nickname: string;
      score: number;
    }>;
    my_rank: {
      rank: number;
      nickname: string;
      score: number;
    } | null;
  };
}