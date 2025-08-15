# Flowment - 감정 흐름 기록 앱

> Our moments in flow...

## 앱 개요

Flowment는 한국 전통 감정 개념인 희·노·애·락을 기반으로, 하루의 감정 흐름을 타임라인 형태로 기록·분석하는 모바일 앱입니다. 사용자는 하루 중 감정 상태, 메모, 사진을 실시간으로 추가하고, 하루 종료 시 자동 요약과 분석을 받을 수 있습니다.

## 주요 기능

### 1. 감정 타임라인

- **지원 감정**: 희(기쁨), 노(화남), 애(슬픔), 락(즐거움), 중성(무감정)
- **실시간 기록**: 감정 + 메모 + 사진 추가
- **연속 세그먼트**: 다음 액션 입력 전까지 이전 감정 유지
- **시각화**: 커스텀 아이콘으로 감정 표시

### 2. 캘린더·일기

- **월간 캘린더**: 날짜별 감정 색상 표시
- **일기 모달**: 날짜 클릭 시 팝업으로 하루 기록 상세 보기
- **모바일 최적화**: 420px UI 제약 준수

### 3. 고급 인사이트 분석

- **스마트 코멘트 엔진**: 감정 패턴 분석 후 맞춤 조언
- **3단계 리포트**: 일·주·월 단위 감정 통계
- **감정 도넛차트**, 키워드·토픽 분석

## 감정 색상

- 희(H): #FFD54F
- 노(A): #EF5350
- 애(S): #64B5F6
- 락(F): #B39DDB
- 중성(N): 회색

## 차별화 포인트

- 한국 전통 감정 체계 기반
- 시간 흐름에 따른 감정 시각화 중심 UX
- 오프라인 우선 동작
- 패턴 기반 맞춤 분석
- 웹앱이지만 네이티브 앱급 UI·UX

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build
```

## 기술 스택

- React
- Vite
- Styled Components
- Chart.js
- date-fns
- LocalStorage (오프라인 데이터 저장)

## 프로젝트 구조

```
/
├── public/
│   └── favicon.svg
├── src/
│   ├── assets/
│   │   └── images/
│   ├── components/
│   │   ├── BottomNav.jsx
│   │   ├── DayDetail.jsx
│   │   ├── EmotionInput.jsx
│   │   ├── EmotionTimeline.jsx
│   │   ├── Header.jsx
│   │   └── Layout.jsx
│   ├── context/
│   │   └── EmotionContext.jsx
│   ├── hooks/
│   ├── pages/
│   │   ├── CalendarPage.jsx
│   │   ├── HomePage.jsx
│   │   └── InsightsPage.jsx
│   ├── styles/
│   │   └── index.css
│   ├── utils/
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── package.json
├── vite.config.js
└── README.md
```