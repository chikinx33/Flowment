# Flowment

**기억을 유지하기 위한 시스템**

Flowment는 단순한 일기 앱이 아닙니다. 매일 키워드 하나로 하루를 정리하고, 다음 날 그 기억을 통과해야만 새로운 기록을 열 수 있는 특별한 일기 앱입니다.

## 🌟 프로젝트 개요

- **이름**: Flowment
- **목적**: 기록을 쌓는 것이 아니라 기억을 잊지 않게 만드는 것
- **핵심 철학**: "기억해야 열린다"

## 🚀 주요 기능

### ✅ 완성된 기능 (V2.1)

1. **Memory Gate (랜딩 페이지)** - `/` ✅ V2.1 완전 복구
   - 3~7일 전 일기에서 자동 퀴즈 생성 (키워드 기반)
   - 3개 선택지 (정답 + 랜덤 키워드 2개)
   - 정답 시 타임라인 이동, 오답 시 블러 효과 + 재시도
   - 하이브리드 캐시 (오프라인 대응)
   - 정답 검증 엔드포인트 구현

2. **Writing Page (일기 작성)** - `/write` ✅ V2.1 완전 업그레이드
   - 제목 입력 (선택 사항)
   - 7가지 감정 이모지 선택 (😊 joy, 😢 sadness, 😠 anger, 😨 fear, 😮 surprise, 🤢 disgust, 😐 neutral)
   - 기분 점수 슬라이더 (1~10)
   - 다중 키워드 태그 입력 (최대 5개)
   - 자동 client_id 생성 (오프라인 동기화)
   - V2 API 페이로드 완전 통합 (entry_date, keywords[], emotion, mood_score)

3. **Timeline Page (키워드 타임라인)** - `/timeline` ✅ V2.1 완전 업그레이드
   - 감정 이모지 표시 (각 일기마다)
   - 별/하트 기반 기분 점수 시각화 (★★★★★☆☆☆☆☆)
   - 다중 키워드 태그 표시 (배지 스타일)
   - 제목 표시 (있는 경우)
   - 시간순 정렬 + 좌우 교차 레이아웃
   - 내용 미리보기 (100자 트렁케이션)

4. **Calendar Page (월간 키워드 맵)** - `/calendar` ✅ V2.1 완전 업그레이드
   - 날짜별 감정 색상 코딩 (🟢 joy, 🔵 neutral, 🔴 sadness, 🟠 anger, 🟣 fear, 🟤 disgust, 🟡 surprise)
   - 월간 감정 통계 (각 감정 카운트)
   - 월 평균 기분 점수 (예: 8.2/10)
   - 키워드 워드클라우드 (빈도 기반 크기, Top 10)
   - 주요 엔트리 하이라이트
   - 월 이동 내비게이션

5. **Settings Page (설정)** - `/settings` ✅
   - 다크/라이트 모드 전환
   - 알림 시간 설정
   - 데이터 관리
   - 앱 정보

### 🎨 디자인 특징

- **다크/라이트 모드**: 전체 앱에서 매끄러운 테마 전환
- **반응형 디자인**: 모바일 우선 디자인, 모든 화면 크기 지원
- **우아한 애니메이션**: 부드러운 전환 효과
- **미니멀 UI**: 깔끔하고 집중된 사용자 경험

## 🔗 URLs

### 프로덕션 환경
- **웹사이트**: https://flowment.pages.dev ✅
- **GitHub**: https://github.com/chikinx33/Flowment

### 개발 환경
- **로컬 서버**: http://localhost:3000

### API 엔드포인트 (V2.0)
- `POST /api/entries` - 일기 생성/수정 (entry_date, title, content, emotion, mood_score, keywords[], client_id)
- `GET /api/entries` - 전체 일기 목록 (user_id 필터링, keywords 자동 파싱)
- `GET /api/entries/:date` - 특정 날짜 일기 조회
- `GET /api/entries/month/:yearMonth` - 월별 일기 조회
- `DELETE /api/entries/:date` - 일기 삭제 (소프트 삭제)
- ✅ `GET /api/memory-gate` - Memory Gate (3~7일 전 일기 퀴즈 생성)
- ✅ `POST /api/memory-gate/verify` - 답변 검증
- ✅ `GET /api/keywords/frequency` - 키워드 빈도 Top 20 (워드클라우드용)

## 💾 데이터 아키텍처

### D1 Database V2.0 (SQLite)

**테이블 구조:**

1. **users** - 사용자 인증 (멀티유저 지원)
   - id (PRIMARY KEY)
   - auth_provider (anonymous, google, github, email)
   - auth_user_key (UNIQUE, 외부 인증 ID)
   - nickname (TEXT, optional)
   - created_at, updated_at

2. **entries** - 일기 항목 (user_id로 분리)
   - id (PRIMARY KEY)
   - user_id (FOREIGN KEY → users.id)
   - entry_date (DATE, 실제 일기 날짜)
   - title (TEXT, optional)
   - content (TEXT, 필수)
   - emotion (joy, sadness, anger, fear, surprise, disgust, neutral)
   - mood_score (INTEGER, 1~10)
   - keywords_json (JSON array, ["키워드1", "키워드2"])
   - client_id (TEXT UNIQUE, 오프라인 동기화용)
   - sync_status (pending, synced, conflict)
   - created_at, updated_at
   - deleted_at (NULL = 활성, 값 = 삭제)
   - UNIQUE(user_id, entry_date) - 하루 1개 일기 제한

**인덱스:**
- `idx_users_auth` - 인증 조회 최적화
- `idx_entries_user_date` - 사용자별 날짜 조회
- `idx_entries_user_created` - 사용자별 생성 순서
- `idx_entries_sync_status` - 동기화 상태 필터링
- `idx_entries_client_id` - client_id 조회
- `idx_entries_deleted` - 삭제된 항목 필터링

**현재 사용자:** id=1 (Anonymous User, anonymous/default-user)

**샘플 데이터:** 프로덕션 DB에 1개 테스트 일기 ("Flowment v2.0 배포 성공")

## 🛠 기술 스택

### Backend
- **Hono**: 경량 웹 프레임워크
- **Cloudflare Workers**: 엣지 런타임
- **Cloudflare D1**: 분산 SQLite 데이터베이스

### Frontend
- **Vanilla JavaScript**: 프레임워크 없는 순수 JS
- **Tailwind CSS**: 유틸리티 우선 CSS 프레임워크
- **Google Fonts**: Spline Sans, Newsreader
- **Material Symbols**: 아이콘

### Development
- **Vite**: 빌드 도구
- **Wrangler**: Cloudflare CLI
- **PM2**: 프로세스 관리자

## 📁 프로젝트 구조

```
webapp/
├── src/
│   └── index.tsx              # Hono 백엔드 (API + 프론트엔드 라우팅)
├── public/
│   └── static/
│       ├── landing.js         # Memory Gate 페이지 로직
│       ├── write.js           # 일기 작성 페이지 로직
│       ├── timeline.js        # 타임라인 페이지 로직
│       ├── calendar.js        # 캘린더 페이지 로직
│       └── settings.js        # 설정 페이지 로직
├── migrations/
│   ├── backup/                # 구버전 마이그레이션 (백업)
│   └── 2026-03-07_production_schema.sql  # V2.0 스키마
├── seed.sql                   # 샘플 데이터
├── ecosystem.config.cjs       # PM2 설정
├── wrangler.jsonc             # Cloudflare 설정
├── vite.config.ts             # Vite 빌드 설정
├── package.json               # 의존성 및 스크립트
└── README.md                  # 이 파일
```

## 🚀 사용 방법

### 로컬 개발

```bash
# 의존성 설치 (이미 완료됨)
npm install

# 데이터베이스 초기화 (이미 완료됨)
npm run db:migrate:local
npm run db:seed

# 빌드 (이미 완료됨)
npm run build

# 개발 서버 시작 (PM2)
pm2 start ecosystem.config.cjs

# 서버 확인
curl http://localhost:3000

# PM2 로그 확인
pm2 logs flowment --nostream

# PM2 중지
pm2 stop flowment
pm2 delete flowment
```

### 데이터베이스 관리

```bash
# 로컬 DB 마이그레이션
npm run db:migrate:local

# 시드 데이터 삽입
npm run db:seed

# DB 리셋 (데이터 초기화)
npm run db:reset

# DB 콘솔 (SQL 실행)
npm run db:console:local
```

### Git 관리

```bash
# 초기 커밋 (이미 완료됨)
npm run git:init

# 변경사항 커밋
npm run git:commit "커밋 메시지"

# 상태 확인
npm run git:status

# 로그 확인
npm run git:log
```

## 📖 사용자 가이드

### 첫 사용

1. **Memory Gate 통과**: 앱을 열면 어제의 기억을 테스트하는 질문이 나타납니다
2. **정답 선택**: 3개의 선택지 중 올바른 키워드를 선택합니다
3. **통과 성공**: 정답을 맞추면 오늘의 캘린더로 이동합니다

### 일기 작성

1. **캘린더에서 + 버튼** 클릭
2. **내용 작성**: 자유롭게 오늘의 생각을 적습니다
3. **카테고리 선택**: 감정, 이벤트, 관계, 성장, 회피 중 선택
4. **키워드 입력**: 오늘을 대표하는 단어 하나를 입력합니다
5. **저장**: Save 버튼을 눌러 저장합니다

### 타임라인 보기

- 하단 내비게이션에서 **Entries** 탭 선택
- 시간순으로 정렬된 키워드와 내용 확인
- 각 엔트리를 클릭하여 전체 내용 보기

### 캘린더 보기

- 하단 내비게이션에서 **Home** 탭 선택
- 월별 캘린더에서 각 날짜의 감정 강도 확인
- 키워드 워드클라우드로 이번 달의 주요 테마 파악
- 왼쪽/오른쪽 화살표로 월 이동

### 다크 모드 전환

- 하단 내비게이션에서 **Settings** 탭 선택
- **Dark Mode** 토글을 켜거나 끕니다
- 설정은 자동으로 저장됩니다

## 🔮 향후 개발 계획

### 미구현 기능

1. **고급 통계**
   - 감정 변화 그래프
   - 카테고리별 분포 차트
   - 키워드 연관성 분석

2. **소셜 기능**
   - 친구와 키워드 공유
   - 공개/비공개 설정
   - 커뮤니티 키워드 트렌드

3. **알림 시스템**
   - 매일 정해진 시간에 알림
   - 연속 작성 스트릭 표시
   - 작성 리마인더

4. **데이터 내보내기**
   - PDF/TXT 형식 내보내기
   - 월간 리포트 생성
   - 백업 기능

5. **AI 기능**
   - 키워드 자동 추천
   - 감정 분석
   - 작문 코칭

## 🚢 배포

### Cloudflare Pages 배포

```bash
# 프로덕션 데이터베이스 생성 (한 번만)
npx wrangler d1 create flowment-production
# wrangler.jsonc에 database_id 업데이트

# 프로덕션 마이그레이션
npm run db:migrate:prod

# Cloudflare Pages 프로젝트 생성 (한 번만)
npx wrangler pages project create flowment --production-branch main

# 배포
npm run deploy:prod

# 환경 변수 설정 (필요시)
npx wrangler pages secret put API_KEY --project-name flowment
```

### 배포 상태

- **플랫폼**: Cloudflare Pages
- **프로젝트명**: flowment
- **Database**: Cloudflare D1 (flowment-production)
- **Database ID**: caceaa53-2415-4ed0-a02f-d887ccc13343
- **상태**: ✅ 프로덕션 배포 완료 (V2.1)
- **마지막 업데이트**: 2026-03-07
- **커밋**: 31c4ce2

**프로덕션 URL:** https://flowment.pages.dev

## 📝 라이선스

이 프로젝트는 개인 프로젝트입니다.

## 🙏 감사의 말

이 앱은 "기억을 유지하기 위한 시스템"이라는 철학을 바탕으로 만들어졌습니다. 기록이 아닌 기억에 집중하는 새로운 형태의 일기 경험을 제공합니다.

---

**Built with ❤️ using Hono + Cloudflare Workers**

버전: v2.1.0 | 마지막 업데이트: 2026-03-07

**V2.1 주요 변경사항:**
- ✅ 멀티유저 지원 데이터베이스 구조
- ✅ 감정(emotion) 7종 + 기분(mood_score 1~10) 추적
- ✅ 다중 키워드(keywords[]) 저장 (최대 5개)
- ✅ 오프라인 동기화 준비 (client_id, sync_status)
- ✅ 소프트 삭제 지원 (deleted_at)
- ✅ **Memory Gate V2 완전 복구** (3~7일 전 일기 퀴즈, 3선택지)
- ✅ **키워드 빈도 API** (Top 20, 워드클라우드)
- ✅ **프론트엔드 V2 API 완전 통합** (write/timeline/calendar)

**상세 보고서:** [DEPLOYMENT_REPORT_V2.md](./DEPLOYMENT_REPORT_V2.md)
