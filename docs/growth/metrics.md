# 지표 정의, 측정 방법, 채널 코드표

- 작성: biz-growth-marketer, 2026-10-17
- 근거: `README.md`의 "홍보 링크 규칙", `supabase/migrations/0001_init.sql`(profiles, guide_requests, chat_rooms, messages), `0003_signup_attributions_and_reports.sql`(signup_attributions, reports), `src/lib/acquisition.ts`, `src/proxy.ts`, `src/app/profile/actions.ts`
- 전략과 게이트는 [strategy.md](strategy.md). 이 문서의 숫자 목표는 모두 가설이다.
- 쿼리는 아직 실제 DB에서 실행해 보지 않았다(원격 DB 접근 없음). 처음 실행할 때 컬럼명 오류나 결과 이상이 있으면 이 문서를 고친다.

---

## 1. 쓰는 방법

1. Supabase 대시보드 → SQL Editor에서 실행한다. SQL Editor는 관리자 권한이라 RLS를 우회하므로 `signup_attributions`도 읽힌다(앱 사용자는 못 읽는다).
2. 집계 시작일은 쿼리 안의 `timestamptz '2026-10-19 00:00+09'`를 바꾼다. 시간대는 한국 시간(`+09`)이다.
3. **결과는 집계만 공유한다.** 이름·이메일·연락처·인스타·채팅 내용이 든 행은 문서·메신저에 붙이지 않는다. Q8b(방치 요청 목록)는 제목·본문·사용자 id를 일부러 뺐다.
4. 매주 금요일에 Q1·Q15·Q8·Q12를 돌려 **값을 따로 기록**한다(스프레드시트 등). `signup_attributions`는 프로필이 삭제되면 같이 지워지므로(`on delete cascade`) 나중에 다시 계산하면 숫자가 달라질 수 있다.
5. 내부 테스트 가입은 `utm_source=test` 링크로만 한다. 아래 쿼리는 `test`를 제외한다. 테스트 계정은 확인 후 삭제한다.
6. contact·instagram을 별도 테이블로 옮기는 개발 변경(dev 회의 1위)이 배포되면 Q6의 해당 컬럼 쿼리를 새 구조에 맞게 고친다.

---

## 2. 지표 정의

### 2.1 채널·획득

| ID | 지표 | 정의 | 출처 | 쿼리 |
|---|---|---|---|---|
| A1 | 채널별 가입 수 | 온보딩을 마친 사용자 수, `utm_source` × `role` | `signup_attributions` | Q1, Q2, Q3 |
| A2 | 직접/불명 가입 | `utm_source`가 NULL인 행. 검색·입소문·UTM 누락·다른 기기 가입이 섞여 있음 | 같음 | Q1 |
| A3 | 코드 위생 | 코드표에 없는 `utm_source`·`utm_medium` 값 | 같음 | Q4 |
| A4 | 협조 수락률 | 수락한 기관 수 / 연락한 기관 수 | 수동 기록표(7장) | - |
| A5 | 호스텔 비치 수락률 | 비치한 숙소 수 / 접촉한 숙소 수 | 수동 기록표 | - |
| A6 | 방문 수·링크 클릭 수 | 앱에는 없음. 인스타 Insights의 링크 탭 등 플랫폼 통계로 대체 | 외부 | 3장 |

### 2.2 퍼널 (양쪽 시장)

| ID | 지표 | 정의 | 출처 | 쿼리 |
|---|---|---|---|---|
| F1 | 온보딩 완료율 | `profiles` 행 중 `role is not null` 비율. 채널별은 불가(미완료자는 채널 기록이 없음) | `profiles` | Q5 |
| F2 | 프로필 완성률 | `display_name <> ''` 이고 `languages`가 비어 있지 않고 `bio`가 비어 있지 않음 | `profiles` | Q6 |
| F3 | 인스타 입력률 | `instagram is not null` 비율 (선택 항목, 입력 장벽 확인용) | `profiles` | Q6 |
| F4 | 여행객 첫 요청률 | 가입 후 7일 안에 `guide_requests`를 1건 이상 만든 여행객 비율 | `signup_attributions`, `guide_requests` | Q7 |
| F5 | 가이드 첫 연락률 | 가입 후 14일 안에 `chat_rooms`를 1개 이상 연 가이드 비율 | `signup_attributions`, `chat_rooms` | Q9 |
| F6 | 요청의 첫 연락 속도 | 요청 생성부터 첫 채팅방 생성까지 시간의 중앙값, 48시간 내 첫 연락 비율 | `guide_requests`, `chat_rooms` | Q8 |
| F7 | 방치 요청 | 48시간 이상 열려 있고 연락이 0건이며 여행 날짜가 지나지 않은 요청 수 | 같음 | Q8b |
| F8 | 매칭률 | 취소 제외 요청 중 `matched`·`completed` 비율 | `guide_requests` | Q10 |
| F9 | 완료 수 | `status = 'completed'` 요청 수 (북극성) | 같음 | Q10 |
| F10 | 채널별 퍼널 | 가입 → 프로필 완성 → 첫 요청/첫 연락 → 매칭 → 완료 | 조인 | Q15 |

### 2.3 공급·수요 균형

| ID | 지표 | 정의 | 출처 | 쿼리 |
|---|---|---|---|---|
| B1 | 활성 가이드 | 최근 14일 안에 채팅방을 연 가이드 수, 전체 가이드 대비 비율 | `profiles`, `chat_rooms` | Q11 |
| B2 | 동네별 공급·수요 | 동네별 열린 요청 수, 최근 30일 요청 수, 그 요청에 연락한 가이드 수 | `guide_requests.area`(자유 텍스트), `chat_rooms` | Q12, Q12a |
| B3 | 가이드 참여 분포 | 가이드별 매칭 건수 분포(1명에게 쏠리는지) | `guide_requests.matched_guide_id` | Q11 |

### 2.4 유지·추천·안전

| ID | 지표 | 정의 | 출처 | 쿼리 |
|---|---|---|---|---|
| R1 | 7일 후 활동 | 가입 7일 뒤 이후에 메시지를 보냈거나(`messages`) 다시 로그인한(`auth.users.last_sign_in_at`) 비율 | 조인 | Q13 |
| R2 | 여행객 재이용 | 취소 제외 요청 2건 이상인 여행객 수 | `guide_requests` | Q14 |
| R3 | 가이드 재참여 | 매칭 2건 이상인 가이드 수 | `guide_requests` | Q11 |
| R4 | 추천 | 현재 측정 불가. 3장 보완책 | - | - |
| S1 | 신고 건수·유형 | `reports`의 `reason`별 건수, 미처리 건수 | `reports` | Q16 |
| S2 | 신고 처리 시간 | `resolved_at - created_at` 중앙값 | `reports` | Q16 |
| S3 | 매칭 100건당 신고 | 신고 건수 / 매칭 건수 × 100 (분모가 작을 때는 건수만 본다) | 조인 | Q16 |

---

## 3. 측정 한계와 보완

### 3.1 한계 (코드에서 확인한 사실)

1. **First-touch.** 첫 방문의 UTM만 `sm_utm` 쿠키에 30일 보관된다. 쿠키가 있으면 이후 다른 채널 링크를 눌러도 덮어쓰지 않는다(`src/proxy.ts`). 호스텔 카드를 본 사람이 먼저 인스타 링크를 눌렀으면 `instagram`으로 기록된다.
2. **가입자만 기록.** `signup_attributions`는 온보딩 완료 시 1회 기록된다. 방문 수, 클릭 수, 로그인만 하고 이탈한 사람의 채널은 알 수 없다.
3. **UTM 없는 링크는 추적되지 않는다.** `utm_source`가 없으면 쿠키가 만들어지지 않고 가입은 `utm_source = NULL`(직접/불명)로 기록된다. `?lang=`만 붙인 링크는 언어 지정일 뿐 추적이 아니다.
4. **30일 이후, 다른 기기·브라우저 가입은 못 잡는다.** 인스타 인앱 브라우저에서 눌렀다가 다른 브라우저로 옮겨 가입하면 쿠키가 따로라 UTM이 사라질 수 있다. 외부 브라우저로 같은 URL을 다시 열면 UTM이 있으므로 새로 기록된다(가설). 호스텔 QR은 카메라가 기본 브라우저를 여는 경우가 많아 영향이 작을 것으로 본다(가설).
5. **잘못된 값은 조용히 버려진다.** `utm_source`에 허용 외 문자가 있으면 추적 자체가 안 되고, `utm_medium`·`utm_campaign`이 잘못되면 그 칸만 NULL이 된다. 오타가 허용 문자 안이면(예: `instagam`) 그대로 기록되므로 Q4로 잡는다. 대문자는 소문자로 바뀌어 저장된다.
6. **`utm_content`·`utm_term`은 읽지 않는다.** 소재 A/B 비교는 `utm_campaign` 값으로 구분한다.
7. **완료는 자기 신고.** `completed`는 여행객이 누른 상태이고 실제 만남 여부는 모른다. 완료 시각은 `updated_at` 근사다(이후 수정되면 달라짐).
8. **동네 정보가 약하다.** 요청의 `area`는 자유 텍스트이고 가이드에게는 동네 필드가 없다.
9. **`0003` 적용 전에 가입한 사용자는 기록이 없다.** 그 행은 채널별 쿼리에서 빠진다.
10. **삭제되면 사라진다.** 탈퇴·프로필 삭제 시 `signup_attributions`도 함께 삭제된다. 주간 값을 따로 저장한다.
11. **표본이 작다.** 첫 한 달은 건수와 개별 사례를 본다.

### 3.2 보완 방법

| 부족한 것 | 보완 | 비용 | 비고 |
|---|---|---|---|
| 클릭·도달 | 인스타 전문가 계정의 Insights(도달, 저장, 공유, 프로필 방문, 링크 탭). 스토리 링크 스티커는 노출·탭 수가 보임 | 무료 | 인스타 프로필 링크는 `utm_medium=bio` 가입 수와 링크 탭 수를 같은 주 단위로 나란히 적어 전환 추정(가설) |
| 호스텔 | 비치 날짜, 카드 소진량을 주 1회 스태프에게 확인(구두·메시지) | 무료 | 카드 하단에 버전 표기로 구형 회수 쉽게 |
| 대학·플랫폼 | 공고 조회수(플랫폼이 보여 주는 경우), 학생단체 공지 여부, 발송·답신 기록 | 무료 | 7장 기록표 |
| 방문 수·유입 | 무료 방문 통계 도구(무료 범위·약관은 **미확인**). 도입 시 개인정보처리방침 고지 필요(dev 회의 C11) | 확인 필요 | 개발 스펙으로 요청 |
| 추천·알게 된 경로 | 온보딩 시 선택 문항 "어떻게 알게 됐나요?"(채널 목록 + 직접 입력). first-touch 보완 | 개발 필요 | strategy.md 11장 4번 |
| 소재별 효과 | 스토리 링크마다 `utm_campaign=reel<NN>_<주제>` | 무료 | 4장 코드표 |
| 품질 | 가이드 소개 댓글·DM 질문을 수집해 FAQ 개선 | 무료 | 개인정보는 기록하지 않음 |

---

## 4. 채널 코드표

같은 채널이 다른 이름으로 기록되지 않도록 **새 코드는 이 표에 먼저 추가한 뒤** 링크에 쓴다. 변경 이력은 8장.

### 4.1 규칙

- 값은 영문 소문자·숫자·`_`·`-`·`.`만 쓴다. 한글, 공백, 대문자, `%`, `/`, `@` 금지. 최대 100자(DB 제약). 구분자는 `_`로 통일한다.
- `utm_source`는 필수다. 없으면 아예 추적되지 않는다.
- 사람 이름·인스타 핸들·학번 같은 개인 식별자는 값에 넣지 않는다. 가이드는 `g01`처럼 내부 코드를 쓰고 대응표는 앱 밖 비공개 기록에만 둔다.
- 한 번 인쇄·게시한 코드는 바꾸지 않고, 의미를 바꾸지 않는다. 새로 필요하면 새 값을 만든다.
- 언어는 링크의 `lang`(`en|ko|ja|zh`)으로 지정한다. 이 값은 DB에 기록되지 않으므로, 언어별 비교가 필요하면 `utm_medium`에 언어를 넣는다(호스텔 카드의 `card_en`처럼).

### 4.2 `utm_source`

| 코드 | 뜻 | 상태 | 허용 `utm_medium` | `utm_campaign` 규칙과 예 |
|---|---|---|---|---|
| `univ` | 대학 국제교류 조직·학과 사무실·학생단체 협조 | 사용 (게이트 G) | `email` 협조 요청 메일, `dm` 학생단체 메시지, `notice` 학내 공지, `poster` 게시물·포스터, `group` 단톡방·오픈채팅 공유 | `<학교약칭>_<조직약칭>`. 예 `snu_buddy`, `hansung_buddy`, `hufs_jp` |
| `linkareer` | 링커리어 공고 | 조건부 (등록 자격 사용자 확인) | `listing` | `guide_b1` (1기). 2기부터 `guide_b2` |
| `everytime` | 에브리타임 게시 | 조건부 (재학생이 본인 학교 게시판 규칙 확인 후) | `board` | `<학교약칭>_guide`. 예 `snu_guide` |
| `instagram` | 자체 인스타 계정과 그 Collab | 사용 (모집은 게이트 G, 여행객은 T) | `bio` 프로필 링크, `story` 스토리 링크 스티커, `dm` 문의 답변 링크, `collab` 가이드 본인 프로필 링크 | bio는 `profile`(여행객), `profile_guide`(가이드). story는 `reel<NN>_<주제>` 예 `reel01_hongdae`. collab은 `guide_<코드>` 예 `guide_g01` |
| `hostel` | 호스텔·게스트하우스 카드·포스터 | 게이트 T 이후 | `card_en`, `card_ja`, `card_zh` 카드, `poster_en`, `poster_ja`, `poster_zh` 포스터, `msg_en`, `msg_ja`, `msg_zh` 숙소의 디지털 안내 메시지 | `h<두 자리 번호>[_<위치>]`. 예 `h01`, `h02_desk`. 숙소·동네가 드러나지 않는 번호만 쓴다(user_id와 묶이면 숙박 위치가 됨). 대응표는 저장소 밖, 규칙은 [hostel-qr-card.md](content/hostel-qr-card.md) 6장 |
| `referral` | 사용자 소개 (앱에 공유 기능이 생겼을 때 예약) | 예약 | `guide_share`, `traveler_share` | 개발 후 정의 |
| `reddit` | Reddit 답변·게시 | 보류 (규칙 확인, 링크는 모더레이터 승인 시) | `comment`, `post` | 서브레딧명. 예 `r_koreatravel` |
| `facebook` | Facebook 그룹 | 보류 (관리자 허락 시) | `group` | 그룹 약칭 |
| `x` | X 자체 계정 | 보류 | `bio`, `post` | 주제 |
| `note` | note 자체 계정 | 보류 | `post` | 주제 |
| `xhs` | 小红书 | 보류 (站外 링크 금지, 사용 가능성 낮음) | `bio` | - |
| `test` | 내부 링크 QA | 사용 | `qa` | `link_check` 등. 모든 쿼리에서 제외 |

표에 없는 새 채널은 소문자 영문 서비스명을 `utm_source`로 하고 이 표에 한 줄 추가한다. `direct`·`none` 같은 값은 쓰지 않는다(NULL이 직접/불명이다).

### 4.3 `utm_medium` 요약

`email`, `dm`, `notice`, `poster`, `group`, `listing`, `board`, `bio`, `story`, `collab`, `card_<lang>`, `poster_<lang>`, `msg_<lang>`, `comment`, `post`, `qa`. 새 값은 이 표에 추가한 뒤 사용한다.

### 4.4 인스타 `utm_campaign` 소재 코드

| 코드 | 릴스 | 뜻 |
|---|---|---|
| `profile` / `profile_guide` | - | 프로필 링크 (여행객용 / 가이드용) |
| `reel01_hongdae` ~ `reel03_seongsu` | EP1~EP3 | 동네 릴스 |
| `reel04_guide_intro` | EP4 | 가이드 소개 |
| `reel05_how_it_works` | EP5 | 진행 방식·안전 수칙 |
| `reel06_why_free` | EP6 | 왜 무료인가 |

릴스 캡션의 URL은 눌러지지 않는 것으로 알려져 있으므로(일반 지식, 확인 필요) 링크 추적은 스토리 링크 스티커와 프로필 링크로 한다.

---

## 5. 링크 예시

`https://<도메인>`은 도메인 확정 후 바꾼다(strategy.md 10장 결정 3). 아래는 전부 예시이며 실제 게시 전에 9장 체크리스트로 확인한다.

| 용도 | 링크 |
|---|---|
| 인스타 프로필, 게이트 T 전 (가이드 모집) | `https://<도메인>/volunteer?lang=ko&utm_source=instagram&utm_medium=bio&utm_campaign=profile_guide` |
| 인스타 프로필, 게이트 T 후 (여행객, 첫 번째 링크) | `https://<도메인>/?utm_source=instagram&utm_medium=bio&utm_campaign=profile` |
| 인스타 스토리 스티커, EP1 | `https://<도메인>/?utm_source=instagram&utm_medium=story&utm_campaign=reel01_hongdae` |
| 인스타 스토리 스티커, EP4 가이드 모집 | `https://<도메인>/volunteer?lang=ko&utm_source=instagram&utm_medium=story&utm_campaign=reel04_guide_intro` |
| 가이드 g01의 프로필 링크 (본인 동의 시) | `https://<도메인>/volunteer?lang=ko&utm_source=instagram&utm_medium=collab&utm_campaign=guide_g01` |
| 대학 국제교류 조직에 보내는 메일 | `https://<도메인>/volunteer?lang=ko&utm_source=univ&utm_medium=email&utm_campaign=snu_buddy` |
| 같은 조직의 학내 공지 | `https://<도메인>/volunteer?lang=ko&utm_source=univ&utm_medium=notice&utm_campaign=snu_buddy` |
| 링커리어 공고 | `https://<도메인>/volunteer?lang=ko&utm_source=linkareer&utm_medium=listing&utm_campaign=guide_b1` |
| 에브리타임 (규칙 확인 후) | `https://<도메인>/volunteer?lang=ko&utm_source=everytime&utm_medium=board&utm_campaign=snu_guide` |
| 호스텔 영어 카드 | `https://<도메인>/?lang=en&utm_source=hostel&utm_medium=card_en&utm_campaign=h01` |
| 호스텔 일본어 카드 | `https://<도메인>/?lang=ja&utm_source=hostel&utm_medium=card_ja&utm_campaign=h01` |
| 호스텔 중국어 포스터 | `https://<도메인>/?lang=zh&utm_source=hostel&utm_medium=poster_zh&utm_campaign=h02` |
| 내부 QA | `https://<도메인>/?utm_source=test&utm_medium=qa&utm_campaign=link_check` |

호스텔 숙소와 코드의 대응표는 저장소 밖 팀 전용 문서에 둔다. 코드 규칙은 [hostel-qr-card.md](content/hostel-qr-card.md) 6장.

---

## 6. SQL (Supabase SQL Editor)

모두 읽기 전용 `select`다. 집계 시작일 `2026-10-19`는 상황에 맞게 바꾼다. `signup_attributions.role`은 온보딩 때 고른 역할이고 `profiles.role`은 현재 역할이다(나중에 바뀔 수 있어 퍼널은 전자를 쓴다).

### Q1. 채널별 가입 × 역할 (핵심)

```sql
select
  coalesce(sa.utm_source, '(direct)') as source,
  sa.role,
  count(*) as signups
from public.signup_attributions sa
where sa.created_at >= timestamptz '2026-10-19 00:00+09'
  and coalesce(sa.utm_source, '') <> 'test'
group by 1, 2
order by signups desc, source, sa.role;
```

### Q2. 소스·매체·캠페인 상세

```sql
select
  coalesce(sa.utm_source, '(direct)') as source,
  coalesce(sa.utm_medium, '-') as medium,
  coalesce(sa.utm_campaign, '-') as campaign,
  sa.role,
  count(*) as signups,
  min(sa.first_visit_at) as first_seen,
  max(sa.created_at) as last_signup
from public.signup_attributions sa
where sa.created_at >= timestamptz '2026-10-19 00:00+09'
  and coalesce(sa.utm_source, '') <> 'test'
group by 1, 2, 3, 4
order by signups desc, source, medium, campaign;
```

### Q3. 주간 가입 추이 (채널 × 역할)

```sql
select
  date_trunc('week', sa.created_at at time zone 'Asia/Seoul')::date as week_start,
  coalesce(sa.utm_source, '(direct)') as source,
  sa.role,
  count(*) as signups
from public.signup_attributions sa
where sa.created_at >= timestamptz '2026-10-19 00:00+09'
  and coalesce(sa.utm_source, '') <> 'test'
group by 1, 2, 3
order by week_start desc, signups desc;
```

### Q4. 코드표 밖 값 탐지 (오타 점검)

코드표의 `utm_source`·`utm_medium`을 아래 목록에 맞춰 둔다. 새 코드를 4장에 추가하면 여기에도 추가한다.

```sql
select
  sa.utm_source, sa.utm_medium, sa.utm_campaign, count(*) as n_rows
from public.signup_attributions sa
where sa.utm_source is not null
  and (
    sa.utm_source not in ('univ','linkareer','everytime','instagram','hostel','referral',
                          'reddit','facebook','x','note','xhs','test')
    or sa.utm_medium not in ('email','dm','notice','poster','group','listing','board','bio','story',
                             'collab','card_en','card_ja','card_zh','poster_en','poster_ja','poster_zh',
                             'msg_en','msg_ja','msg_zh','comment','post','qa','guide_share','traveler_share')
  )
group by 1, 2, 3
order by n_rows desc;
```

`utm_medium`이 NULL인 행은 `not in` 조건에서 걸리지 않는다. 매체를 빠뜨린 링크는 Q2의 `medium = '-'`로 확인한다.

### Q5. 온보딩 완료율 (전체, 채널별 불가)

로그인만 하고 역할을 고르지 않은 사람은 `profiles.role`이 NULL이다. 이들은 채널 기록이 없어 전체 수치로만 본다.

```sql
select
  count(*) as profiles_total,
  count(*) filter (where p.role is not null) as onboarded,
  round(100.0 * count(*) filter (where p.role is not null) / nullif(count(*), 0), 1) as onboarded_pct,
  count(*) filter (where p.role = 'traveler') as travelers,
  count(*) filter (where p.role = 'guide') as guides
from public.profiles p
where p.created_at >= timestamptz '2026-10-19 00:00+09'
  and p.id not in (select user_id from public.signup_attributions where utm_source = 'test');
```

### Q6. 채널별 프로필 완성률·인스타 입력률

```sql
select
  coalesce(sa.utm_source, '(direct)') as source,
  sa.role,
  count(*) as signups,
  count(*) filter (
    where p.display_name <> '' and cardinality(p.languages) > 0 and coalesce(p.bio, '') <> ''
  ) as profile_complete,
  round(100.0 * count(*) filter (
    where p.display_name <> '' and cardinality(p.languages) > 0 and coalesce(p.bio, '') <> ''
  ) / nullif(count(*), 0), 1) as complete_pct,
  round(100.0 * count(*) filter (where p.instagram is not null) / nullif(count(*), 0), 1) as instagram_pct,
  round(100.0 * count(*) filter (where p.contact is not null) / nullif(count(*), 0), 1) as contact_pct
from public.signup_attributions sa
join public.profiles p on p.id = sa.user_id
where sa.created_at >= timestamptz '2026-10-19 00:00+09'
  and coalesce(sa.utm_source, '') <> 'test'
group by 1, 2
order by signups desc;
```

### Q7. 여행객 첫 요청률 (가입 후 7일 이내)

7일이 지난 가입자만 센다(집계 시점이 너무 이르면 비율이 낮게 나온다).

```sql
with t as (
  select
    sa.user_id,
    coalesce(sa.utm_source, '(direct)') as source,
    exists (
      select 1 from public.guide_requests r
      where r.traveler_id = sa.user_id
        and r.created_at < sa.created_at + interval '7 days'
    ) as requested_7d
  from public.signup_attributions sa
  where sa.role = 'traveler'
    and sa.created_at >= timestamptz '2026-10-19 00:00+09'
    and sa.created_at <= now() - interval '7 days'
    and coalesce(sa.utm_source, '') <> 'test'
)
select
  source,
  count(*) as traveler_signups,
  count(*) filter (where requested_7d) as requested_7d,
  round(100.0 * count(*) filter (where requested_7d) / nullif(count(*), 0), 1) as requested_pct
from t
group by 1
order by traveler_signups desc;
```

### Q8. 요청의 첫 연락 속도

```sql
with fc as (
  select
    r.id,
    r.created_at as requested_at,
    min(c.created_at) as first_contact_at
  from public.guide_requests r
  left join public.chat_rooms c on c.request_id = r.id
  where r.status <> 'cancelled'
    and r.created_at >= timestamptz '2026-10-19 00:00+09'
  group by r.id, r.created_at
)
select
  count(*) as requests,
  count(first_contact_at) as contacted,
  round(100.0 * count(first_contact_at) / nullif(count(*), 0), 1) as contacted_pct,
  count(*) filter (where first_contact_at <= requested_at + interval '48 hours') as contacted_within_48h,
  round(100.0 * count(*) filter (where first_contact_at <= requested_at + interval '48 hours')
        / nullif(count(*) filter (where requested_at <= now() - interval '48 hours'), 0), 1) as within_48h_pct,
  round((percentile_cont(0.5) within group (
    order by extract(epoch from (first_contact_at - requested_at)) / 3600
  ))::numeric, 1) as median_hours_to_first_contact
from fc;
```

`within_48h_pct`의 분모는 48시간이 지난 요청만 센다(너무 새 요청이 비율을 낮추지 않도록).

### Q8b. 방치 요청 (운영용, 개인 식별 정보 제외)

```sql
select
  r.id as request_id,
  r.area,
  r.travel_date,
  r.group_size,
  r.languages,
  round(extract(epoch from (now() - r.created_at)) / 3600) as hours_open
from public.guide_requests r
where r.status = 'open'
  and r.travel_date >= current_date
  and r.created_at < now() - interval '48 hours'
  and not exists (select 1 from public.chat_rooms c where c.request_id = r.id)
order by r.travel_date, r.created_at;
```

### Q9. 가이드 첫 연락률 (가입 후 14일 이내)

```sql
with g as (
  select
    sa.user_id,
    coalesce(sa.utm_source, '(direct)') as source,
    exists (
      select 1 from public.chat_rooms c
      where c.guide_id = sa.user_id
        and c.created_at < sa.created_at + interval '14 days'
    ) as contacted_14d
  from public.signup_attributions sa
  where sa.role = 'guide'
    and sa.created_at >= timestamptz '2026-10-19 00:00+09'
    and sa.created_at <= now() - interval '14 days'
    and coalesce(sa.utm_source, '') <> 'test'
)
select
  source,
  count(*) as guide_signups,
  count(*) filter (where contacted_14d) as contacted_14d,
  round(100.0 * count(*) filter (where contacted_14d) / nullif(count(*), 0), 1) as contacted_pct
from g
group by 1
order by guide_signups desc;
```

요청이 거의 없는 초기에는 가이드가 연락할 대상이 없어 이 비율이 낮을 수 있다. Q12의 열린 요청 수와 함께 해석한다.

### Q10. 주간 요청 → 연락 → 매칭 → 완료

```sql
select
  date_trunc('week', r.created_at at time zone 'Asia/Seoul')::date as week_start,
  count(*) as requests,
  count(*) filter (where r.status = 'cancelled') as cancelled,
  count(*) filter (where exists (select 1 from public.chat_rooms c where c.request_id = r.id)) as contacted,
  count(*) filter (where r.status in ('matched', 'completed')) as matched_or_completed,
  count(*) filter (where r.status = 'completed') as completed,
  round(100.0 * count(*) filter (where r.status in ('matched', 'completed'))
        / nullif(count(*) filter (where r.status <> 'cancelled'), 0), 1) as match_pct
from public.guide_requests r
where r.created_at >= timestamptz '2026-10-19 00:00+09'
group by 1
order by week_start desc;
```

### Q11. 가이드 활동성·참여 분포

```sql
-- 활성 가이드 (최근 14일에 채팅방을 연 가이드)
select
  count(*) filter (where p.role = 'guide') as guides_total,
  count(*) filter (
    where p.role = 'guide'
      and exists (
        select 1 from public.chat_rooms c
        where c.guide_id = p.id and c.created_at > now() - interval '14 days'
      )
  ) as guides_active_14d
from public.profiles p;

-- 가이드별 매칭 건수 분포 (이름·id 없이 분포만)
select
  coalesce(m.matched_cnt, 0) as matched_requests,
  count(*) as guides
from public.profiles p
left join (
  select matched_guide_id, count(*) as matched_cnt
  from public.guide_requests
  where status in ('matched', 'completed')
  group by matched_guide_id
) m on m.matched_guide_id = p.id
where p.role = 'guide'
group by 1
order by 1;
```

### Q12a. 요청에 실제로 쓰인 area 값 (정규식 보정용)

```sql
select lower(trim(r.area)) as area_text, count(*) as requests
from public.guide_requests r
where r.created_at > now() - interval '60 days'
group by 1
order by requests desc
limit 30;
```

### Q12. 동네별 공급·수요 (키워드 매칭)

`area`가 자유 텍스트라서 정규식으로 묶는다. Q12a 결과를 보고 패턴을 보정한다. "연락한 가이드 수"는 그 동네 요청에 실제로 연락한 가이드 수이며, 가이드가 사는 동네의 수는 아니다(필드 없음).

```sql
with zone(zone, re) as (
  values
    ('hongdae', 'hongdae|hongik|홍대|홍익|연남|yeonnam|弘大|ホンデ'),
    ('jongno',  'jongno|jongro|종로|익선|ikseon|북촌|bukchon|서촌|seochon|인사동|insadong|钟路|鍾路|ジョンノ'),
    ('seongsu', 'seongsu|성수|圣水|聖水|ソンス')
)
select
  z.zone,
  count(distinct r.id) filter (where r.status = 'open' and r.travel_date >= current_date) as open_requests,
  count(distinct r.id) as requests_30d,
  count(distinct c.guide_id) as guides_contacted_30d
from zone z
left join public.guide_requests r
  on r.area ~* z.re and r.created_at > now() - interval '30 days'
left join public.chat_rooms c on c.request_id = r.id
group by z.zone
order by z.zone;
```

### Q13. 가입 7일 이후 활동 (재방문 근사)

`auth.users.last_sign_in_at`은 로그인 시점이라 세션이 유지된 채 돌아온 사용자를 놓친다. 메시지 기준(`messaged_7d_plus`)을 같이 본다.

```sql
with u as (
  select
    sa.user_id,
    sa.role,
    coalesce(sa.utm_source, '(direct)') as source,
    (au.last_sign_in_at >= sa.created_at + interval '7 days') as signed_in_7d_plus,
    exists (
      select 1 from public.messages m
      where m.sender_id = sa.user_id and m.created_at >= sa.created_at + interval '7 days'
    ) as messaged_7d_plus
  from public.signup_attributions sa
  join auth.users au on au.id = sa.user_id
  where sa.created_at >= timestamptz '2026-10-19 00:00+09'
    and sa.created_at <= now() - interval '14 days'
    and coalesce(sa.utm_source, '') <> 'test'
)
select
  source, role,
  count(*) as signups,
  count(*) filter (where signed_in_7d_plus) as signed_in_7d_plus,
  count(*) filter (where messaged_7d_plus) as messaged_7d_plus
from u
group by 1, 2
order by signups desc;
```

### Q14. 여행객 재이용

```sql
select
  count(*) as travelers_with_request,
  count(*) filter (where n >= 2) as repeat_travelers,
  round(100.0 * count(*) filter (where n >= 2) / nullif(count(*), 0), 1) as repeat_pct
from (
  select r.traveler_id, count(*) as n
  from public.guide_requests r
  where r.status <> 'cancelled'
  group by r.traveler_id
) t;
```

### Q15. 채널별 퍼널 종합

플래그를 먼저 계산하고 집계한다. 가이드의 "매칭됨"은 `matched_guide_id`, 여행객의 "매칭됨"은 자신의 요청 상태 기준이다.

```sql
with base as (
  select
    sa.user_id,
    sa.role,
    coalesce(sa.utm_source, '(direct)') as source,
    (p.display_name <> '' and cardinality(p.languages) > 0 and coalesce(p.bio, '') <> '') as profile_complete,
    exists (select 1 from public.guide_requests r where r.traveler_id = sa.user_id) as made_request,
    exists (select 1 from public.guide_requests r
            where r.traveler_id = sa.user_id and r.status in ('matched', 'completed')) as t_matched,
    exists (select 1 from public.guide_requests r
            where r.traveler_id = sa.user_id and r.status = 'completed') as t_completed,
    exists (select 1 from public.chat_rooms c where c.guide_id = sa.user_id) as made_contact,
    exists (select 1 from public.guide_requests r where r.matched_guide_id = sa.user_id) as g_matched,
    exists (select 1 from public.guide_requests r
            where r.matched_guide_id = sa.user_id and r.status = 'completed') as g_completed
  from public.signup_attributions sa
  join public.profiles p on p.id = sa.user_id
  where sa.created_at >= timestamptz '2026-10-19 00:00+09'
    and coalesce(sa.utm_source, '') <> 'test'
)
select
  source,
  role,
  count(*) as signups,
  count(*) filter (where profile_complete) as profile_complete,
  count(*) filter (where (role = 'traveler' and made_request) or (role = 'guide' and made_contact)) as first_request_or_contact,
  count(*) filter (where (role = 'traveler' and t_matched) or (role = 'guide' and g_matched)) as matched,
  count(*) filter (where (role = 'traveler' and t_completed) or (role = 'guide' and g_completed)) as completed
from base
group by 1, 2
order by signups desc, source, role;
```

### Q16. 신고(가드레일)

```sql
-- 유형별 건수와 미처리 건수
select
  rp.reason,
  count(*) as reports,
  count(*) filter (where rp.resolved_at is null) as open_reports
from public.reports rp
where rp.created_at >= timestamptz '2026-10-19 00:00+09'
group by 1
order by reports desc;

-- 처리 시간(중앙값, 시간)과 매칭 100건당 신고
select
  round((percentile_cont(0.5) within group (
    order by extract(epoch from (rp.resolved_at - rp.created_at)) / 3600
  ))::numeric, 1) as median_hours_to_resolve,
  (select count(*) from public.reports where created_at >= timestamptz '2026-10-19 00:00+09') as reports_total,
  (select count(*) from public.guide_requests
    where status in ('matched', 'completed') and created_at >= timestamptz '2026-10-19 00:00+09') as matched_total
from public.reports rp
where rp.resolved_at is not null
  and rp.created_at >= timestamptz '2026-10-19 00:00+09';
```

신고 내용(`details`, `messages_snapshot`)은 이 문서·보고에 옮기지 않는다. 처리는 trust-safety가 정한 절차를 따른다. 미처리 신고가 있으면 다른 홍보 지표보다 먼저 처리한다.

---

## 7. 수동 기록표 (앱에 없는 지표)

기록은 스프레드시트 등 앱 밖에서 한다. 개인 연락처는 공개된 기관 공식 채널만 적는다.

| 표 | 컬럼 |
|---|---|
| 협조 요청 로그 | 날짜, 기관(학교·조직), 연락 채널(공식 이메일/공식 SNS), 변형(A1/A2), 코드(`utm_campaign`), 답신 여부, 수락 여부, 공지 게시일, 리마인드 일자 |
| 공고 로그 | 플랫폼, 등록일, 코드, 조회수(제공 시), 마감일 |
| 호스텔 로그 | 숙소(공개 사업장명), 동네, 코드(`h01`), 접촉일, 결과, 비치일, 카드 종류(언어·버전), 주간 소진량, 회수일 (**저장소 밖 팀 전용 문서에만 둔다**) |
| 인스타 성과 | 게시일, 에피소드(EP), 도달, 저장, 공유, 프로필 방문, 링크 탭, Collab 여부, 출연 동의 확보 여부 |
| 신고·이슈 | 날짜, 유형, 처리 담당, 해결일 (내용은 기록하지 않음) |

## 8. 주간 점검 루틴과 코드표 변경 이력

매주 금요일 30분: Q1 → Q15 → Q8 → Q8b → Q12 → Q16 순서로 실행, 값을 기록, strategy.md 4장 게이트 상태와 3장 균형 규칙을 점검한다. 2주마다 목표(가설)를 데이터로 조정한다.

| 날짜 | 변경 | 담당 |
|---|---|---|
| 2026-10-17 | 코드표 초안 작성 (`univ`, `linkareer`, `everytime`, `instagram`, `hostel`, `referral`, 보류 코드, `test`) | biz-growth-marketer |

## 9. 링크 QA 체크리스트 (게시·인쇄 전)

1. 링크가 코드표(4장)의 값만 쓰는가. 대문자·공백·한글이 없는가.
2. 시크릿 창에서 열어 원하는 언어로 첫 화면이 뜨는가(`?lang=`).
3. 개발자 도구 → Application → Cookies에 `sm_utm`이 생겼는가(UTM 없는 링크는 생기지 않는 것이 정상).
4. 이미 `sm_utm`이 있는 브라우저에서는 새 UTM이 무시된다. 테스트마다 새 시크릿 창이나 쿠키 삭제를 쓴다.
5. 테스트 계정으로 `utm_source=test` 링크를 통해 온보딩까지 마치고 Q2에서 `test` 행이 `landing_path`와 함께 보이는지 확인한다. 확인 후 테스트 행과 계정을 삭제한다.
6. 인쇄물은 실제 휴대폰(iOS 카메라, Android 카메라)으로 스캔해 본다. LINE·WeChat 스캔 화면은 앱 내 브라우저로 열릴 수 있으니 같이 확인한다.
7. 도메인이 확정되었는가. 도메인이 바뀌면 인쇄물이 전부 무효다.
