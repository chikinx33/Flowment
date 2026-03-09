# 📘 Flowment Cloudflare Pages 배포 가이드

## 🎯 개요

Flowment는 Cloudflare Pages + D1 Database를 사용하는 일기 앱입니다. 이 가이드는 프로덕션 환경에 배포하기 위한 완전한 절차를 안내합니다.

---

## 📋 사전 준비

### 필수 요구사항
- Cloudflare 계정 (무료 계정 가능)
- GitHub 계정 (저장소 연결용)
- Node.js 18+ 설치
- Wrangler CLI 설치 (`npm install -g wrangler`)

---

## 🚀 배포 단계

### 1️⃣ Cloudflare D1 데이터베이스 생성

```bash
# 1. Wrangler 로그인
npx wrangler login

# 2. D1 데이터베이스 생성
npx wrangler d1 create flowment-production

# 3. 출력된 database_id를 복사하세요
# 예시 출력:
# ✅ Successfully created DB 'flowment-production'
# 
# [[d1_databases]]
# binding = "DB"
# database_name = "flowment-production"
# database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  ← 이 값을 복사
```

### 2️⃣ wrangler.jsonc 설정

`wrangler.jsonc` 파일을 열고 `database_id`를 수정하세요:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "flowment",
  "compatibility_date": "2026-03-01",
  "pages_build_output_dir": "./dist",
  "compatibility_flags": ["nodejs_compat"],
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "flowment-production",
      "database_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  // 👈 여기에 실제 ID 입력
    }
  ]
}
```

### 3️⃣ 데이터베이스 마이그레이션 적용

```bash
# Production D1 데이터베이스에 마이그레이션 적용
npx wrangler d1 migrations apply flowment-production

# ✅ 성공 메시지 확인:
# Migrations to be applied:
# - 0001_initial_schema.sql
# - 0002_add_question_sentence.sql
```

### 4️⃣ Cloudflare Pages 프로젝트 생성

```bash
# 1. 프로젝트 생성
npx wrangler pages project create flowment --production-branch main

# 2. 빌드
npm run build

# 3. 배포
npx wrangler pages deploy dist --project-name flowment
```

### 5️⃣ Cloudflare Pages 대시보드에서 D1 바인딩 설정

**중요**: Cloudflare Pages 대시보드에서 D1 바인딩을 수동으로 추가해야 합니다.

1. Cloudflare 대시보드 → **Workers & Pages** → **flowment** 선택
2. **Settings** → **Functions** → **D1 database bindings** 섹션
3. **Add binding** 클릭
4. 다음 정보 입력:
   - **Variable name**: `DB` (반드시 대문자 DB)
   - **D1 database**: `flowment-production` 선택
5. **Save** 클릭

### 6️⃣ 배포 확인

```bash
# 배포 URL 확인
npx wrangler pages deployments list --project-name flowment

# Production URL: https://flowment.pages.dev
# 브라우저에서 접속하여 확인
```

---

## 🔧 로컬 개발 환경

### 로컬 개발 서버 실행

```bash
# 1. 의존성 설치
npm install

# 2. 로컬 D1 마이그레이션 적용
npm run db:migrate:local

# 3. 로컬 개발 서버 시작
npm run dev

# 4. 브라우저에서 확인: http://localhost:3000
```

### 로컬 D1 데이터베이스 관리

```bash
# 마이그레이션 적용
npm run db:migrate:local

# 테스트 데이터 삽입
npm run db:seed

# 데이터베이스 초기화 (주의: 모든 데이터 삭제)
npm run db:reset

# 로컬 D1 콘솔
npm run db:console:local
```

---

## 📁 프로젝트 구조

```
flowment/
├── src/
│   └── index.tsx           # Hono 백엔드 + 페이지 라우트
├── public/
│   └── static/
│       ├── landing.js      # 랜딩 페이지 JS
│       ├── write.js        # 일기 작성 페이지 JS
│       ├── timeline.js     # 타임라인 페이지 JS
│       ├── calendar.js     # 캘린더 페이지 JS
│       └── settings.js     # 설정 페이지 JS
├── migrations/
│   ├── 0001_initial_schema.sql        # 초기 DB 스키마
│   └── 0002_add_question_sentence.sql # 퀴즈 문장 컬럼 추가
├── wrangler.jsonc          # Cloudflare 설정
├── package.json            # NPM 스크립트
├── ecosystem.config.cjs    # PM2 설정 (로컬 개발용)
└── DEPLOYMENT_GUIDE.md     # 이 파일
```

---

## 🗄️ 데이터베이스 스키마

### entries 테이블
일기 항목을 저장합니다.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INTEGER | PRIMARY KEY |
| date | TEXT | 일기 날짜 (YYYY-MM-DD) |
| content | TEXT | 일기 내용 |
| keyword | TEXT | 오늘의 키워드 |
| category | TEXT | 카테고리 (Emotion, Event, Relationship, Growth, Avoidance) |
| created_at | DATETIME | 생성 시간 |
| updated_at | DATETIME | 수정 시간 |

### memory_gates 테이블
Memory Gate 퀴즈를 저장합니다.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INTEGER | PRIMARY KEY |
| entry_id | INTEGER | entries.id 참조 |
| question | TEXT | 퀴즈 질문 (템플릿) |
| question_sentence | TEXT | 사용자 커스텀 퀴즈 문장 |
| correct_answer | TEXT | 정답 (키워드) |
| attempts | INTEGER | 시도 횟수 |
| passed | INTEGER | 통과 여부 (0/1) |
| created_at | DATETIME | 생성 시간 |

### user_settings 테이블
사용자 설정을 저장합니다.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INTEGER | PRIMARY KEY |
| notification_time | TEXT | 알림 시간 (HH:MM) |
| dark_mode | INTEGER | 다크모드 (0/1) |
| created_at | DATETIME | 생성 시간 |
| updated_at | DATETIME | 수정 시간 |

---

## 🔄 GitHub Actions 자동 배포 (선택사항)

GitHub에서 Cloudflare Pages로 자동 배포를 설정할 수 있습니다.

### Cloudflare Pages Git 연결

1. Cloudflare 대시보드 → **Workers & Pages** → **Create application**
2. **Pages** 선택 → **Connect to Git**
3. GitHub 저장소 `chikinx33/Flowment` 선택
4. 빌드 설정:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/`
5. **Environment variables** 섹션에서 **Add binding** → D1 database 추가:
   - Variable name: `DB`
   - D1 database: `flowment-production`
6. **Save and Deploy** 클릭

이제 `main` 브랜치에 push할 때마다 자동으로 배포됩니다.

---

## 🛠️ 문제 해결

### 배포 시 "Database not configured" 에러
- Cloudflare Pages 대시보드에서 D1 바인딩이 올바르게 설정되었는지 확인
- Variable name이 정확히 `DB` (대문자)인지 확인

### 마이그레이션 실패
```bash
# 마이그레이션 상태 확인
npx wrangler d1 migrations list flowment-production

# 특정 마이그레이션 롤백 (주의!)
npx wrangler d1 migrations apply flowment-production --remote
```

### 로컬 개발 서버가 시작되지 않음
```bash
# 포트 3000 확인
lsof -ti:3000 | xargs kill -9

# PM2 프로세스 정리
pm2 delete all

# 재시작
npm run build && pm2 start ecosystem.config.cjs
```

### Build 실패
```bash
# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install

# 빌드 재시도
npm run build
```

---

## 📞 지원

- Cloudflare D1 문서: https://developers.cloudflare.com/d1/
- Cloudflare Pages 문서: https://developers.cloudflare.com/pages/
- Hono 문서: https://hono.dev/
- GitHub 저장소: https://github.com/chikinx33/Flowment

---

## 🎉 완료!

이제 Flowment가 Cloudflare Pages에서 실행됩니다!

- **Production URL**: https://flowment.pages.dev
- **GitHub**: https://github.com/chikinx33/Flowment

문제가 발생하면 위의 문제 해결 섹션을 참고하거나 GitHub Issues를 통해 문의하세요.
