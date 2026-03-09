# Flowment Design System

## 🎨 Color Palette

### Primary Colors
- **Primary**: `#306ee8` (브랜드 블루)
- **Primary Hover**: `#2563eb`
- **Primary Light**: `#60a5fa`
- **Primary Dark**: `#1e40af`

### Background Colors
- **Light Mode**: `#ffffff` (순백)
- **Light Secondary**: `#f8fafc` (연한 회색)
- **Dark Mode**: `#0f172a` (다크 네이비)
- **Dark Secondary**: `#1e293b` (다크 슬레이트)

### Text Colors
- **Light Primary**: `#0f172a` (거의 검정)
- **Light Secondary**: `#64748b` (회색)
- **Dark Primary**: `#f1f5f9` (거의 흰색)
- **Dark Secondary**: `#94a3b8` (연한 회색)

### Border Colors
- **Light**: `#e2e8f0` (연한 회색)
- **Dark**: `#334155` (다크 회색)

## 📐 Spacing System

### Container
- **Max Width**: `448px` (max-w-md)
- **Horizontal Padding**: `1rem` (px-4)

### Section Spacing
- **Page Padding**: `1.5rem` (p-6)
- **Header Height**: `64px`
- **Bottom Nav Height**: `68px` (py-3 + 중앙 버튼 고려)

### Component Spacing
- **Card Gap**: `1rem` (gap-4)
- **Button Padding**: `0.75rem 1.5rem` (px-6 py-3)
- **Input Padding**: `0.75rem 1rem` (px-4 py-3)

## 🔤 Typography

### Font Family
- **Primary**: 'Spline Sans', sans-serif
- **Weight**: 300, 400, 500, 600, 700

### Font Sizes
- **Display**: `2rem` (text-3xl) - 페이지 타이틀
- **Heading**: `1.5rem` (text-2xl) - 섹션 헤더
- **Body Large**: `1rem` (text-base) - 본문
- **Body**: `0.875rem` (text-sm) - 부가 정보
- **Caption**: `0.75rem` (text-xs) - 레이블, 힌트
- **Nav Label**: `10px` (text-[10px]) - 네비게이션

## 🎭 Shadows & Effects

### Box Shadows
- **Card**: `shadow-sm` - 기본 카드
- **Card Hover**: `shadow-md` - 호버 상태
- **Modal**: `shadow-xl` - 모달, 중요 요소
- **FAB**: `shadow-lg shadow-primary/30` - 플로팅 버튼

### Border Radius
- **Small**: `0.5rem` (rounded-lg)
- **Medium**: `0.75rem` (rounded-xl)
- **Large**: `1rem` (rounded-2xl)
- **Full**: `9999px` (rounded-full)

## 🏛️ Layout Structure

### Page Container
```html
<body class="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
  <div class="w-full max-w-md mx-auto min-h-screen flex flex-col bg-white dark:bg-slate-900">
    <!-- Header: sticky top-0 -->
    <!-- Main: flex-1 -->
    <!-- Navigation: sticky bottom-0 -->
  </div>
</body>
```

### Header Structure
```html
<header class="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 px-4 py-4">
  <!-- 64px height (py-4 * 2 + content) -->
</header>
```

### Navigation Structure
```html
<nav class="sticky bottom-0 z-10 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 py-3">
  <div class="w-full flex justify-between items-center max-w-md mx-auto">
    <!-- 5 items -->
  </div>
</nav>
```

## 🎯 Interactive States

### Button States
- **Default**: `bg-primary text-white`
- **Hover**: `hover:bg-primary-hover`
- **Active**: `active:scale-95`
- **Disabled**: `opacity-50 cursor-not-allowed`

### Link States
- **Default**: `text-slate-600 dark:text-slate-400`
- **Hover**: `hover:text-primary dark:hover:text-primary`
- **Active**: `text-primary border-b-2 border-primary`

### Input States
- **Default**: `border-slate-300 dark:border-slate-600`
- **Focus**: `focus:border-primary focus:ring-2 focus:ring-primary/20`
- **Error**: `border-red-500 focus:ring-red-500/20`

## 🌗 Dark Mode

### Implementation
- Class-based: `dark:` prefix
- Toggle stored in localStorage
- Smooth transition: `transition-colors duration-200`

### Contrast Ratios
- Light: 15:1 (최소)
- Dark: 12:1 (최소)

## ♿ Accessibility

### Touch Targets
- **Minimum**: `44px x 44px`
- **Recommended**: `48px x 48px`

### Focus Indicators
- Visible focus ring
- High contrast outline
- `focus-visible:ring-2 focus-visible:ring-primary`

## 📱 Responsive Breakpoints

- **Mobile First**: Default styling
- **Tablet**: `sm:` (640px+) - 사용 안 함 (모바일 전용)
- **Desktop**: 모바일 뷰 유지, 중앙 정렬
