# 연락처·인스타그램 공개 범위 결정안

- 작성: biz-trust-safety / 작성일·조사일: 2026-10-17
- 상태: **확정 — (b) 매칭 후 공개 (사용자 결정, 2026-10-17)**. 세부 규칙(공개 기간, 매칭 해제)은 보안 묶음 스펙 승인 때 함께 확정한다.
- 받는 쪽: `dev-supabase-schema`, `dev-security-reviewer`(개발팀 1위 보안 묶음 C1+C2), `dev-i18n-sync`(힌트 문구)
- 면책: 작성자는 변호사가 아니다. 이 문서는 신뢰·안전 관점의 정책 초안이며, 출시 전에 법률 전문가 검토가 필요하다.

---

## 0. 결론

**추천: (b) 매칭 후 공개.** `contact`와 `instagram`은 **같은 요청에서 매칭된 여행객과 가이드 두 사람만** 서로 읽을 수 있다. 공개 기간은 매칭된 때부터 `travel_date + 7일`까지다. 매칭 전에는 앱 안의 채팅으로만 대화한다. 그 전에 연락처를 주고 싶은 사람은 채팅에 직접 적으면 된다. 이 방식이 (c) "본인 선택"의 역할을 대신한다.

이유:
1. **공개할지는 여행객이 Accept를 눌러 직접 정한다.** 채팅방은 가이드가 혼자 만들 수 있다(`0001_init.sql:173-185`). 그래서 (a)로 가면 가이드 역할만 고르면(검증 없음) 아무 여행객의 연락처나 볼 수 있다. 이 구조는 홍보로 여행객이 늘수록 표적이 많아진다.
2. **노출을 1:1로 줄인다.** 인스타 링크나 호스텔 QR로 들어온 외국인 여행객은 인스타 계정에서 얼굴, 숙소, 실시간 위치가 드러나기 쉽다(가설). 이것을 볼 수 있는 사람을 "그 여행객이 고른 한 명"으로 줄인다.
3. **규칙이 하나라서 RLS로 표현하기 쉽고 사용자에게 설명하기도 쉽다.** 설명은 "매칭된 상대에게만 보여요" 한 줄이면 된다. (c)는 설정 화면과 기본값 문제가 생기고, 열(column) 단위 조건이 필요해 구현과 설명이 모두 복잡해진다.

**매칭 해제(`matched → open`)는 허용한다.** 해제 즉시 서로의 연락처는 앱에서 보이지 않는다. 다만 이미 본 연락처는 되돌릴 수 없으므로 이를 미리 알리고, 해제 횟수를 제한하고, 해제 기록을 남긴다(6장).

**전제 조건: C1(요청 상태 잠금)과 C2(연락처 분리)는 반드시 같이 배포한다.** 지금은 `guide_requests` update 정책(`0001_init.sql:161-164`)이 열려 있다. 그래서 (b)만 적용하면 여행객이 `matched_guide_id`를 아무 사용자 id로 바꿔 그 사람의 연락처를 읽을 수 있다. 결국 C2가 우회된다.

---

## 1. 현재 상태 (코드 기준, 2026-10-17 확인)

| 위치 | 누가 무엇을 보나 | 비고 |
|---|---|---|
| `supabase/migrations/0001_init.sql:140-141` `profiles are viewable by signed-in users` (`using (true)`) | 로그인한 **모든** 사용자가 모든 프로필의 `contact`(`0001:17`), `instagram`(`0002:5-7`)을 읽음 | 쿼리 한 번으로 전체 수집 가능 |
| `src/app/requests/[id]/page.tsx:20,77,181` | 열린 요청 상세의 여행객 카드에 여행객 `instagram` 표시. 채팅을 시작하지 않은 가이드와 **다른 여행객**도 봄(열린 요청은 로그인한 누구나 열람, `0001:147-157`) | 매칭 전 노출 |
| `src/app/requests/[id]/page.tsx:117-119` | 여행객에게 연락한 **모든** 가이드의 `instagram` 표시 | 매칭 전 노출 |
| `src/app/chats/[roomId]/page.tsx:33-34,62,80-84` | 방 상대의 `contact`, `instagram` 표시. 가이드가 방을 열기만 하면(메시지 0개여도) 여행객 연락처를 봄 | 매칭 전 노출 |
| `src/i18n/dictionaries/en.ts:63,66` | `contactHint`, `instagramHint` = "(optional, shown to chat partners)" | 실제 노출 범위와 다름 |
| `src/i18n/dictionaries/en.ts:50` | `profile.subtitle` = "This is what others see when you chat." | 채팅 전에도 요청 목록·상세에서 보이므로 부정확 |
| `src/app/requests/[id]/page.tsx:142-146` | matched 상태에서 "Reopen request" 버튼(= `matched → open`)이 이미 있음 | 해제는 이미 제품 기능이다 |
| `0003_signup_attributions_and_reports.sql:105-122` | 신고 스냅샷은 `display_name`과 메시지만 저장하고 `contact`·`instagram`은 저장하지 않음 | 유지 권장 |

참고: 마이그레이션 번호 `0003`은 이미 `0003_signup_attributions_and_reports.sql`이 쓰고 있다. 따라서 보안 묶음은 `0004_*` 이후 번호가 된다(개발팀 회의록의 "0003_*" 표기는 낡은 정보다).

---

## 2. 위협 모델

| # | 시나리오 | 현재 | (a) 방 생성 시 | (b) 매칭 후 | (c) 본인 선택 |
|---|---|---|---|---|---|
| T1 | 가입하자마자 `select`로 전체 사용자의 연락처 대량 수집 | 가능 | 막힘 | 막힘 | 막힘(기본값이 비공개일 때) |
| T2 | 가이드 역할로 가입해 열린 요청마다 방을 열고 여행객 연락처를 표적 수집 | 가능 | **가능**(방만 열면 됨) | 막힘 | 공개를 고른 사람은 가능 |
| T3 | 여행객 인스타 스토리로 실시간 위치를 파악하고 접근(스토킹) | 가능 | 가능 | 고른 1명만 | 공개를 고른 사람은 가능 |
| T4 | 악성 여행객이 Accept와 해제를 반복해 가이드 연락처를 수집 | 가능(제한 없음) | 가능 | 해제 횟수 제한으로 줄임(6장) | 비슷 |
| T5 | `matched_guide_id` 조작으로 아무 사용자의 연락처 열람 | (a)·(b) 모두 C1 없이는 가능 | — | **C1 필수** | — |

---

## 3. 옵션 비교

| 기준 | (a) 채팅방이 생긴 상대에게 공개 | (b) 매칭(Accept) 후 상대에게만 | (c) 본인이 선택 |
|---|---|---|---|
| 안전 | 낮음. 방은 가이드가 혼자 만들어서 여행객 동의 없이 공개됨. 변형 (a′) "양쪽이 1개 이상 메시지를 보낸 뒤"도 여행객이 거절 답장만 해도 공개됨 | 높음. 여행객이 직접 고른 한 명. 가이드는 가입할 때 "매칭되면 공개" 안내로 동의 | 기본값에 달림. 문구를 잘 안 읽는 사용자가 "모두 공개"를 고를 위험 |
| 사용성 | 가장 편함. 바로 WhatsApp 등으로 넘어감 | 매칭 전에는 앱 채팅만 씀. **푸시 알림이 없어** 답장을 늦게 볼 수 있음(현재 코드에 알림 기능 없음). 원하면 채팅에 직접 적어 공유할 수 있음 | 설정 화면이 하나 늘어남. 누구에게 공개되는지 이해하기 어려움 |
| 개인정보 | 목적(만남 조율)에 비해 공개가 넓음 | 목적에 꼭 필요한 범위(만나기로 한 상대)만 공개. 최소 공개 원칙에 맞음 | 동의 기반이지만 기본값과 설명 책임이 큼 |
| 인스타 링크로 들어온 여행객 | 가이드로 가입한 누구나 인스타를 봄. T3 위험이 가장 큼 | 고른 가이드만 봄 | 공개를 고르면 (a)와 같음 |
| 호스텔 QR로 들어온 여행객 | 요청에 지역·날짜가 공개되는데 연락처까지 붙음. 사고가 나면 **제휴 숙소 평판**에도 피해 | 일정이 짧은 여행객도 Accept 한 번이면 바로 공개되어 지연이 작음 | 같음 |
| 구현(RLS) | 쉬움(`is_room_member` 응용) | 쉬움(5장 규칙). C1과 함께 | 어려움. 열마다 다른 조건 → 함수나 뷰가 필요 |

---

## 4. 추천안

**(b) 매칭 후 공개 + 채팅에서 직접 공유하는 것은 본인 자유.**

- (c)를 따로 만들지 않아도 "본인 선택" 수요는 채팅에 아이디를 직접 적는 것으로 채워진다. 이것은 사용자가 상대를 보고 그때그때 내리는 결정이라서 설정값보다 안전하다.
- 사용성 손해(매칭 전 알림 없음)는 연락처 공개가 아니라 **알림 기능**으로 풀 문제다(개발 요구사항 D-8, 차기).
- 여행객이 가이드를 믿을 근거(인스타로 실존 인물인지 확인)가 줄어드는 것은 단점이다. 이것은 프로필 사진·소개·언어, 그리고 가이드가 원할 때 채팅에서 자기 인스타를 직접 알려 주는 방식으로 보완한다. 가이드의 인스타만 매칭 전에 공개하는 비대칭안은 차기 검토 후보로 둔다(부록 A).

---

## 5. RLS 규칙 문장 (개발팀 구현용)

용어: `profile_private(user_id pk → profiles.id on delete cascade, contact, instagram)`. 요청 g는 `guide_requests` 행. "오늘"은 `Asia/Seoul` 기준 날짜.

- **R1 (본인)** 사용자 U는 언제나 자기 `profile_private` 행을 읽고, 만들고, 고칠 수 있다. 다른 사람의 행은 만들거나 고치거나 지울 수 없다.
- **R2 (매칭 상대, 공개 조건)** 사용자 U가 다른 사용자 X의 `profile_private` 행을 읽으려면, 아래를 **모두** 만족하는 요청 g가 하나 이상 있어야 한다.
  1. `g.status in ('matched', 'completed')`
  2. `g.matched_guide_id is not null`이고, `(g.traveler_id, g.matched_guide_id)`가 `(U, X)` 또는 `(X, U)`
  3. `오늘 <= g.travel_date + 7일`
- **R3 (시작 시점)** 공개는 여행객이 Accept해서 `status = 'matched'`가 된 순간부터다. 채팅방 생성이나 메시지 전송만으로는 공개되지 않는다.
- **R4 (종료 시점)** 아래 중 하나가 일어나면 다음 조회부터 바로 읽을 수 없다.
  - 매칭 해제(`matched → open`, `matched_guide_id = null`)
  - 요청 취소(`cancelled`). 취소는 `open`에서만 가능하므로, 매칭 상태라면 먼저 해제를 거친다
  - 요청 삭제(cascade)
  - 어느 한쪽의 계정 삭제(cascade)
  - `travel_date + 7일`이 지남(`matched`에서 완료 처리를 안 한 경우 포함)
- **R5 (완료 후)** `completed`가 되어도 R2-3 기간(여행일 + 7일) 동안은 공개를 유지한다. 사진을 보내거나 분실물을 찾는 등 후속 연락을 위해서다. 그 뒤에는 앱에서 보이지 않는다.
- **R6 (운영자)** 팀은 신고 처리 목적에 한해 Supabase 대시보드(service role)로만 열람한다. 앱 안에 운영자 열람 경로를 만들지 않는다.
- **R7 (차단, 기능 추가 후)** 둘 중 한 명이 상대를 차단하면 R2를 만족해도 읽을 수 없다.
- **R8 (스냅샷)** 신고 스냅샷(`reports.messages_snapshot` 등)에는 `contact`·`instagram`을 넣지 않는다(현재 동작 유지).
- **R9 (전제)** `status`와 `matched_guide_id`는 `accept_guide` / `set_request_status` RPC로만 바꿀 수 있어야 한다(C1). `accept_guide`는 `(request_id, guide_id)` 채팅방이 있고, **그 가이드가 그 방에 메시지를 1개 이상 보냈을 때만** 통과시킨다. 가이드가 적극적으로 연락했다는 근거가 있을 때만 그 가이드의 연락처가 공개되게 하기 위해서다.

참고 SQL 스케치(정책 이해용이며 확정이 아니다. 구현과 검증은 `dev-supabase-schema`, `dev-security-reviewer`가 한다):

```sql
-- U = auth.uid() 가 p_owner 의 private 정보를 볼 수 있는가
create function public.can_view_private(p_owner uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_owner = (select auth.uid()) or exists (
    select 1 from public.guide_requests g
    where g.status in ('matched', 'completed')
      and g.matched_guide_id is not null
      and (
        (g.traveler_id = (select auth.uid()) and g.matched_guide_id = p_owner) or
        (g.matched_guide_id = (select auth.uid()) and g.traveler_id = p_owner)
      )
      and (now() at time zone 'Asia/Seoul')::date <= g.travel_date + 7
  );
$$;
```

`instagram` 고유 인덱스(`0002:10`)는 새 테이블로 옮긴다. 고유 제약 오류(`23505`)로 "다른 프로필에 연결된 계정"인지 알 수 있다는 점은 정보 노출이 작다고 보고 현행대로 둔다(`dev-security-reviewer` 판단 요청).

---

## 6. 매칭 해제(`matched → open`)

**결정: 허용한다.** 매칭 뒤에 상대가 불편하게 행동할 때 여행객이 요청 전체를 지우지 않고도 빠져나올 수 있어야 한다. 이것은 안전 기능이다. 지금 UI에도 이미 있다.

| 항목 | 규칙 |
|---|---|
| 누가 | 여행객(현재 UI). **가이드 쪽 "매칭에서 빠지기"도 추가 권장**(D-5). 가이드가 불편할 때 나갈 방법이 없으면 안전 문제가 된다 |
| 해제 후 연락처 | R4에 따라 즉시 앱에서 비공개. **이미 보거나 저장한 연락처는 회수할 수 없다.** 해제 확인 창에서 이를 알리고, 필요하면 외부 메신저에서 상대를 차단하라고 안내한다 |
| 해제 후 채팅방 | 유지한다(대화 기록은 신고 근거). 메시지를 계속 받기 싫으면 차단 기능이 필요하다(D-4) |
| 남용 방지 | 요청 하나에서 Accept는 최대 3회(해제 2회)까지(**가설**, 운영하며 조정). 여행객 한 명이 최근 30일 동안 해제를 5회 넘게 하면 운영 검토 대상으로 표시(**가설**) |
| 해제 사유 | 선택 입력: "Plans changed" / "I felt uncomfortable" / "Other". "uncomfortable"을 고르면 신고 화면 링크를 보여 준다 |
| 기록 | `match_events(request_id, traveler_id, guide_id, event: matched/unmatched/completed, actor_id, reason, created_at)`. 신고를 처리할 때 근거로 쓴다. 보관 1년(**제안**, 처리방침에 기재) |
| 같은 가이드 다시 Accept | 횟수 제한 안에서는 허용 |

`cancelled → open`(다시 열기)은 현행대로 허용한다. 연락처 공개와는 관계가 없다.

---

## 7. 바뀌어야 할 문구 (영어 기준, ko/ja/zh 번역 필요 → `dev-i18n-sync`)

| 키 | 현재 | 제안(en) |
|---|---|---|
| `profile.contactHint` | (optional, shown to chat partners) | (optional) Only shared with the person you're matched with. |
| `profile.instagramHint` | (optional, shown to chat partners) | (optional) Only shared with the person you're matched with. |
| `profile.subtitle` | This is what others see when you chat. | Other members can see your name, photo, nationality, languages and About me. Your contact details are shared only after you're matched. |
| (신규) 연락처 입력란 아래 안내 | — | Once shared, the other person may keep your details even if the match ends. Only add what you're comfortable sharing. |
| (신규) Accept 확인 | — | Accepting {name} shares your contact details with them, and theirs with you. |
| (신규) 매칭 전 채팅방 상단 | — | Contact details appear here after you're matched. Until then, please keep chatting in SeOUL MATE. |
| (신규) 해제 확인 | — | {name} will no longer see your contact details in SeOUL MATE, but they may have already saved them. |
| `requests.newSubtitle` | Volunteers will see your request together with your profile and message you. | Volunteers will see your request with your name, photo, nationality and languages. Your contact details stay hidden until you accept a guide. |
| `volunteer.steps[2].body` 뒤 보충(선택) | — | Your contact details are shared with a traveler only when they accept you. |

ko 참고 번역(확정은 `dev-i18n-sync`): contactHint/instagramHint → "(선택) 매칭된 상대에게만 보여요."

---

## 8. 함께 정리하면 좋은 노출 (권고, 이번 결정 범위 밖)

- **열린 요청 열람 범위**: 지금은 로그인한 여행객도 다른 여행객의 열린 요청(이름·국적·날짜·지역)을 본다(`0001:147-157`). `role = 'guide'`에게만 보이게 하는 것을 권장한다(D-7).
- **실명 노출**: `display_name` 기본값이 OAuth의 `full_name`이다(`0001:33`). 온보딩에서 "이름(first name)이나 별명으로 바꿔도 된다"고 안내하는 것을 권장한다(문구 작업, S).

---

## 부록 A. 차기 검토 후보: 가이드 인스타만 매칭 전 공개(비대칭안)

먼저 연락한 쪽(가이드)이 신원 확인 수단을 더 보여 주고, 연락받는 쪽(여행객)은 덜 보여 주는 안이다. 신뢰 형성에는 유리하다. 하지만 ① 열마다 다른 조건이 필요해 구현이 복잡하고, ② 가이드에게 "매칭 전에도 공개된다"는 별도 동의가 필요하고, ③ 악성 여행객이 요청을 올려 가이드 인스타를 모을 수 있다. 출시 후 사용자 인터뷰(`biz-user-researcher`)에서 여행객이 인스타 확인을 원하는지 확인한 뒤 다시 논의한다.

---

## 개발 요구사항

| ID | 내용 | 우선 | 담당 |
|---|---|---|---|
| D-1 | `profile_private(user_id, contact, instagram)` 생성, 기존 데이터 백필, `profiles`에서 두 컬럼 제거(또는 select 권한 회수), 5장 R1~R6·R8 RLS | **출시 전 필수** | dev-supabase-schema |
| D-2 | C1과 **같은 배포**: update 정책 제거, `accept_guide`(방 존재 + 가이드 메시지 1개 이상 + `open`), `set_request_status`(허용 전이) RPC | **출시 전 필수** | dev-supabase-schema, dev-security-reviewer |
| D-3 | 화면 조회 경로 수정: `requests/[id]/page.tsx:20,117-119,181`의 인스타 표시를 매칭 상대에게만, `chats/[roomId]/page.tsx:33-34,62,80-84`는 `profile_private` 조회로 바꾸고 결과가 없으면 "매칭 후 표시" 안내 | **출시 전 필수** | 메인 세션 |
| D-4 | 차단(block): 차단하면 상대 요청 숨김, 새 방 생성 금지, 메시지 전송 금지, R7 | 여행객 대상 홍보 전 필수 | dev-supabase-schema (스펙은 `moderation.md`) |
| D-5 | 가이드의 "매칭에서 빠지기"(matched → open, 가이드가 실행) | 권장(출시 직후) | dev-supabase-schema |
| D-6 | 해제 횟수 제한, `match_events` 기록, 해제 사유 선택 | 권장(출시 전) | dev-supabase-schema |
| D-7 | 열린 요청 select를 `role = 'guide'`로 제한 | 권장 | dev-supabase-schema |
| D-8 | 새 메시지 알림(이메일 또는 웹 푸시). (b)의 사용성 손해를 줄임 | 차기 | biz-product-planner 스펙 |
| D-9 | 7장 문구 반영(4개 언어) | **출시 전 필수**(D-1과 함께) | dev-i18n-sync |

## 출처·확인

- 모든 근거는 저장소 코드(2026-10-17 기준 `main`, 커밋 `11b95ad`)다. 원격 Supabase의 실제 정책은 확인하지 않았다(대시보드에서 직접 바꾼 정책이 있을 수 있음).
- 법적 판단: 개인정보 보호법상 "최소 수집·목적 내 이용" 원칙에 맞는 방향이라고 보지만, 법률 전문가 확인이 필요하다.
