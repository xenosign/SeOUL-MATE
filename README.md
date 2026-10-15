# SeOUL MATE

외국인 여행객과 서울의 자원봉사 가이드를 연결하는 웹 서비스.

- **여행객(traveler)**: 카카오/구글로 로그인 → 프로필 작성 → 가이드 요청 등록
- **가이드(guide)**: 열린 요청 목록 확인 → 여행객에게 채팅으로 연락
- 여행객이 마음에 드는 가이드를 **Accept** → 매칭 → 가이드 후 **완료** 처리

## 기술 스택

| 영역 | 사용 기술 |
| --- | --- |
| 프레임워크 / 백엔드 | Next.js 16 (App Router, Server Actions, Route Handlers) |
| DB / 인증 | Supabase (Postgres + RLS, Auth: Kakao·Google OAuth) |
| 실시간 채팅 | Supabase Realtime (WebSocket) — 메시지 수신, 접속 상태(Presence), 입력 중 표시(Broadcast) |
| 다국어 | English · 한국어 · 日本語 · 中文(简体) — 쿠키(`NEXT_LOCALE`) → 브라우저 `Accept-Language` 순으로 결정 |
| 배포 | Vercel |

> **왜 자체 WebSocket 서버가 아니라 Supabase Realtime인가?**
> Vercel의 서버리스 함수는 장시간 연결을 유지할 수 없어 `ws`/Socket.IO 서버를 띄울 수 없습니다.
> Supabase Realtime은 브라우저와 Supabase 사이에 WebSocket을 직접 열고, DB의 RLS 정책을 그대로 적용해 주므로
> 별도 서버 없이 Vercel 배포와 그대로 호환됩니다.

## 폴더 구조

```
supabase/migrations/0001_init.sql   DB 스키마, RLS 정책, Realtime 설정
src/proxy.ts                        (구 middleware) 세션 갱신 + 보호 경로 리다이렉트
src/lib/supabase/                   서버/브라우저/프록시용 Supabase 클라이언트
src/lib/auth.ts                     현재 사용자 프로필 조회 (DAL)
src/i18n/                           언어 설정, 번역 사전(dictionaries/), 언어 전환 액션
src/app/login/                      카카오·구글 로그인
src/app/auth/callback/route.ts      OAuth code → 세션 교환
src/app/profile/                    프로필 / 첫 로그인 온보딩(역할 선택)
src/app/requests/                   요청 목록·등록·상세, 서버 액션
src/app/chats/                      채팅 목록, 실시간 채팅방
```

## 1. Supabase 설정

1. [Supabase](https://supabase.com/dashboard)에서 프로젝트 생성
2. **SQL Editor**에서 `supabase/migrations/` 의 SQL 파일을 번호 순서대로 실행 (`0001_init.sql` → `0002_profiles_instagram.sql` → `0003_signup_attributions_and_reports.sql`)
   (Supabase CLI 사용 시 `supabase link` 후 `supabase db push`)
3. **Project Settings → API**에서 Project URL과 Publishable key(또는 anon key) 복사
4. **Authentication → URL Configuration**
   - Site URL: `https://<배포 도메인>`
   - Redirect URLs:
     - `http://localhost:3000/**`
     - `https://<배포 도메인>/**`
     - (Preview 배포용) `https://*-<vercel-팀-slug>.vercel.app/**`

## 2. 카카오 로그인

1. [Kakao Developers](https://developers.kakao.com) → 애플리케이션 추가
2. **앱 키**의 *REST API 키* → Supabase의 **Client ID**
3. **카카오 로그인** 활성화, Redirect URI에 `https://<project-ref>.supabase.co/auth/v1/callback` 등록
4. **보안 → Client Secret** 코드 생성·활성화 → Supabase의 **Client Secret**
5. **동의항목**: 닉네임, 프로필 사진 설정
   - 이메일(`account_email`)은 비즈 앱 전환이 필요합니다. 비즈 앱이 아니라면 Supabase Kakao 설정에서
     **Allow users without an email** 을 켜 주세요.
6. Supabase **Authentication → Sign In / Providers → Kakao** 활성화 후 위 값 입력

## 3. 구글 로그인

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → OAuth 동의 화면 구성
2. **사용자 인증 정보 → OAuth 클라이언트 ID** (웹 애플리케이션)
   - 승인된 리디렉션 URI: `https://<project-ref>.supabase.co/auth/v1/callback`
3. Supabase **Authentication → Sign In / Providers → Google** 활성화 후 Client ID / Secret 입력

## 4. 로컬 실행

```bash
cp .env.example .env.local   # 값 채우기
npm install
npm run dev
```

http://localhost:3000 접속. 채팅 테스트는 브라우저 두 개(일반 창 + 시크릿 창)로
한쪽은 traveler, 한쪽은 guide 계정으로 로그인하면 됩니다.

## 5. Vercel 배포

1. GitHub에 push → [Vercel](https://vercel.com/new)에서 저장소 Import (Framework: Next.js 자동 인식)
2. **Environment Variables**에 `.env.example`의 두 값 등록
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
3. Deploy 후, 배포 도메인을 Supabase **URL Configuration**의 Site URL / Redirect URLs에 추가

## 데이터 모델

- `profiles` — 사용자 프로필 (가입 시 트리거로 자동 생성, 역할 `traveler | guide`, 인스타그램 아이디는 프로필에서 선택 입력)
- `guide_requests` — 여행객의 가이드 요청 (`open → matched → completed`, 또는 `cancelled`)
- `chat_rooms` — 요청별 여행객·가이드 1:1 채팅방 (가이드만 생성 가능)
- `messages` — 채팅 메시지 (Realtime publication 등록)
- `signup_attributions` — 가입 경로(UTM). 온보딩 완료 시 1회 기록, 사용자는 읽을 수 없고 대시보드에서 확인
- `reports` — 채팅 상대 신고. 신고 시점의 상대 이름·최근 메시지 50개를 스냅샷으로 보관(요청·계정이 삭제돼도 남음), 신고자당 하루 10건 제한, 신고자 본인만 조회 가능, `resolved_at`으로 처리 표시

## 홍보 링크 규칙

- **언어 지정**: `?lang=en|ko|ja|zh` 를 붙이면 해당 언어로 열리고 쿠키에 저장됩니다. 예) `https://<도메인>/?lang=ja`
- **유입 추적**: `utm_source`(필수), `utm_medium`, `utm_campaign` 을 붙입니다. 값은 영문 소문자·숫자·`_`·`-`·`.` 만 씁니다.
  첫 방문 값이 30일간 쿠키에 남고, 가입(온보딩 완료) 시 `signup_attributions`에 기록됩니다.
  예) 인스타 프로필 링크 `/?utm_source=instagram&utm_medium=bio`, 호스텔 QR `/?lang=ja&utm_source=hostel&utm_campaign=hongdae_a`
- **가이드 모집**: `/volunteer` (예: `/volunteer?lang=ko&utm_source=univ&utm_campaign=snu_buddy`)

모든 테이블에 RLS가 적용되어 있어, 채팅방·메시지는 참여자만 읽고 쓸 수 있습니다.

## 다음에 해볼 만한 것

- 새 메시지 알림 (Web Push / 이메일), 안 읽은 메시지 수
- 가이드 후기·평점, 차단 기능, 신고 처리 화면
- PWA 설정(manifest, 아이콘)으로 홈 화면 설치 지원
- `supabase gen types typescript`로 DB 타입 자동 생성
