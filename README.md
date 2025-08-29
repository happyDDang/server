# 🎮 Happy DDang Game Ranking API

<div align="center">

![Deno](https://img.shields.io/badge/deno-%23000000.svg?style=for-the-badge&logo=deno&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Deno KV](https://img.shields.io/badge/Deno%20KV-Database-green?style=for-the-badge)

**🚀 Deno + TypeScript로 구축된 게임 랭킹 API 서버**

</div>

---

## ✨ 주요 기능

### 🎯 **닉네임 관리**
- ✅ 닉네임 중복 검사
- 🎲 고유 멤버 번호 자동 생성 (9자리)

### 🏆 **랭킹 시스템**
- 📊 게임 점수 등록
- 🥇 상위 랭킹 조회 (기본 7명)
- 📍 개인 순위 확인
- ⚡ 실시간 자동 정렬 (높은 점수순 + 빠른 시간순)

### 🌐 **CORS 지원**
- 🔒 안전한 도메인 허용 목록
- 🌍 개발/배포 환경 분리

---

## 🏗️ 프로젝트 구조

```
📦 deno-happyddang/
├── 📄 deno.json                # Deno 설정 및 태스크
├── 📄 README.md                # 프로젝트 문서
└── 📁 src/
    ├── 📄 main.ts              # 🚀 서버 시작점 (32줄)
    │
    ├── 📁 models/              # 📊 타입 정의
    │   ├── 📄 index.ts         # 통합 export
    │   ├── 📄 entities.ts      # Player 엔티티
    │   ├── 📄 requests.ts      # API 요청 타입
    │   └── 📄 responses.ts     # API 응답 타입
    │
    ├── 📁 config/              # ⚙️ 설정 파일
    │   └── 📄 constants.ts     # 상수 및 환경설정
    │
    ├── 📁 utils/               # 🛠️ 유틸리티
    │   ├── 📄 cors.ts          # CORS 설정
    │   └── 📄 response.ts      # 응답 헬퍼
    │
    ├── 📁 services/            # 🧠 비즈니스 로직
    │   ├── 📄 memberService.ts # 멤버 관리 로직
    │   └── 📄 rankingService.ts # 랭킹 관리 로직
    │
    └── 📁 routes/              # 🛤️ API 라우트 핸들러
        ├── 📄 member.ts        # 멤버 관련 API
        └── 📄 ranking.ts       # 랭킹 관련 API
```

---

## 🔌 API 엔드포인트

### 1️⃣ **닉네임 중복 검사**
```http
POST /member
Content-Type: application/json

{
  "nickname": "플레이어닉네임"
}
```

**📤 응답**
```json
{
  "value": {
    "duplicated": false,
    "member": {
      "member_no": 123456789
    }
  }
}
```

### 2️⃣ **랭킹 등록**
```http
POST /rank
Content-Type: application/json

{
  "member_no": 123456789,
  "nickname": "플레이어닉네임",
  "score": 9999
}
```

**📤 응답**
```json
{
  "success": true,
  "message": "랭킹 등록 완료!"
}
```

### 3️⃣ **랭킹 조회**
```http
GET /rank?member_no=123456789&top_rank_size=10
```

**📤 응답**
```json
{
  "value": {
    "top_rank": [
      {
        "nickname": "1등플레이어",
        "score": 10000
      }
    ],
    "my_rank": {
      "rank": 5,
      "nickname": "내닉네임",
      "score": 8500
    }
  }
}
```

---

## 🚀 로컬 개발 환경 설정

### 📋 **요구사항**
- 🦕 [Deno](https://deno.land/) v1.40+

### ⚡ **빠른 시작**

```bash
# 1. 저장소 클론
git clone <repository-url>
cd deno-happyddang

# 2. 개발 서버 시작 🚀
deno task dev
```

### 🛠️ **사용 가능한 명령어**

```bash
# 개발 모드 (파일 변경 감지 + 자동 재시작)
deno task dev

# 직접 실행
deno run -A --unstable-kv src/main.ts
```

**📝 플래그 설명:**
- `-A`: 모든 권한 허용 (네트워크, 파일 시스템)
- `--unstable-kv`: Deno KV 데이터베이스 기능 활성화
- `--watch`: 파일 변경시 자동 재시작

---

## 🧪 API 테스트

### 🔍 **cURL 예제**

```bash
# 닉네임 중복 검사
curl -X POST http://localhost:8000/member \
  -H "Content-Type: application/json" \
  -d '{"nickname": "테스트플레이어"}'

# 랭킹 등록
curl -X POST http://localhost:8000/rank \
  -H "Content-Type: application/json" \
  -d '{"member_no": 123456789, "nickname": "테스트플레이어", "score": 9999}'

# 랭킹 조회
curl "http://localhost:8000/rank?member_no=123456789&top_rank_size=5"
```

---

## 🛡️ 기술 스택

| 기술 | 설명 | 버전 |
|------|------|------|
| 🦕 **Deno** | JavaScript/TypeScript 런타임 | v1.40+ |
| 📘 **TypeScript** | 타입 안전한 JavaScript | Latest |
| 🗄️ **Deno KV** | 내장 Key-Value 데이터베이스 | Built-in |
| 🌐 **Web API** | 표준 웹 API 사용 | Native |

---

## 🌟 주요 특징

### ⚡ **성능 최적화**
- 🚀 Deno KV의 자동 정렬 기능 활용
- 📊 음수 점수로 내림차순 자동 정렬
- 🎯 효율적인 랭킹 조회 알고리즘

### 🏗️ **깔끔한 아키텍처**
- 📦 모듈별 책임 분리
- 🔄 Request/Response 타입 체계
- 🛠️ 재사용 가능한 유틸리티

### 🔒 **보안 고려사항**
- ✅ CORS 도메인 화이트리스트
- 🛡️ 타입 안전성 보장
- 🔍 에러 핸들링 표준화

---

## 🚢 배포 환경

- **🌍 프로덕션**: `https://happy-ddang.vercel.app`
- **💻 개발**: `http://localhost:3000`
- **🖥️ 서버**: `http://localhost:8000`

---

## 📝 라이센스

이 프로젝트는 MIT 라이센스를 따릅니다.

---

<div align="center">

**🎮 Happy DDang으로 즐거운 게임하세요! 🎉**

Made with ❤️ using Deno & TypeScript

</div>