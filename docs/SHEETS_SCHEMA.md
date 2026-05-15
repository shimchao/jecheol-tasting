# Google Sheets 스키마

Spreadsheet 1개 안에 **5개 시트**를 만드세요. 시트명과 컬럼명(첫 행)은 **정확히 일치**해야 합니다.

---

## 1. `events`

| event_id | month | theme | host_name | host_password | vote_count | status | revealed | created_at |
|----------|-------|-------|-----------|---------------|------------|--------|----------|------------|
| 2026-05-munge | 2026-05 | 멍게 버티컬 테이스팅 | 동장(심호준) | 제철2026 | 1 | active | FALSE | 2026-05-14T... |

- `vote_count`: 1 또는 2 (참여자가 투표 가능한 개수)
- `status`: `active` / `closed`
- `revealed`: `TRUE`/`FALSE` (결과 공개 여부)

## 2. `items`

| item_id | event_id | name | image_url | description | display_order |
|---------|----------|------|-----------|-------------|---------------|
| 2026-05-munge-1 | 2026-05-munge | 양식멍게 | images/munge-01.jpg | 균일한 맛, 부드러운 식감 | 1 |

- `image_url`: GitHub Pages에 같이 올라간 상대 경로 (`images/xxx.jpg`)

## 3. `participants`

| participant_id | event_id | nickname | joined_at |
|----------------|----------|----------|-----------|
| p_a1b2c3d4 | 2026-05-munge | 호준 | 2026-05-15T... |

## 4. `ratings`

| rating_id | event_id | participant_id | item_id | stars | comment | created_at | updated_at |
|-----------|----------|----------------|---------|-------|---------|------------|------------|
| r_a1b2c3d4 | 2026-05-munge | p_xxx | 2026-05-munge-1 | 4 | 부드럽고 향이 진함 | ... | ... |

- 같은 `(event, participant, item)` 조합은 1개만 — GAS가 자동으로 upsert 처리

## 5. `votes`

| vote_id | event_id | participant_id | item_id | created_at |
|---------|----------|----------------|---------|------------|
| v_a1b2c3d4 | 2026-05-munge | p_xxx | 2026-05-munge-3 | ... |

- 같은 `(event, participant)`의 기존 vote는 새로 투표 시 삭제 후 재기록

---

## 빠른 세팅 방법

1. Google Sheets에서 새 스프레드시트 생성 (이름: `제철의미학-테이스팅-DB`)
2. 시트 5개 추가하고 위 표의 **첫 행(헤더)** 만 정확히 입력
3. URL에서 spreadsheet ID 추출 → `gas/Code.gs`의 `SHEET_ID` 상수에 붙여넣기
   - URL 형식: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`
4. 데이터 입력은 직접 하지 않아도 됨 — 앱이 자동으로 채움
