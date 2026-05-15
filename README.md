# 제철의 미학 - 버티컬 테이스팅 앱

매월 정기모임에서 N종 식재료를 시식하고 별점·한줄평·투표를 모아 결과를 공개하는 모바일 웹앱.

- **백엔드**: Google Apps Script + Google Sheets (무료)
- **프론트**: 정적 HTML 1개 파일 (Vanilla JS, Pretendard)
- **배포**: GitHub Pages

---

## 🚀 배포 가이드 (1회만, 약 30분)

### Step 1. Google Sheets 생성 (5분)

1. 본인 Google 계정으로 [Google Sheets](https://sheets.google.com) 접속
2. 새 스프레드시트 생성 → 이름: `제철의미학-테이스팅-DB`
3. **시트 5개 추가** 및 **헤더(첫 행)만** 입력:
   - 상세 컬럼명은 [`docs/SHEETS_SCHEMA.md`](docs/SHEETS_SCHEMA.md) 참고
   - 시트명: `events`, `items`, `participants`, `ratings`, `votes`
4. URL에서 Spreadsheet ID 복사 (`docs.google.com/spreadsheets/d/{ID}/edit`)

### Step 2. Google Apps Script 배포 (10분)

1. [script.google.com](https://script.google.com) → 새 프로젝트
2. 프로젝트 이름: `jecheol-tasting-api`
3. `Code.gs` 내용을 `gas/Code.gs` 파일 내용으로 **전체 교체**
4. 상단의 `SHEET_ID` 상수에 Step 1에서 복사한 ID 붙여넣기
5. 저장 (⌘S)
6. **배포** → **새 배포** → 유형: **웹 앱**
   - 설명: `v1`
   - 다음 사용자로 실행: **나**
   - 액세스 권한: **모든 사용자** (익명 포함, 휴대폰 접속용)
7. 배포 → 권한 승인 → **웹 앱 URL 복사**
   - 형식: `https://script.google.com/macros/s/AKfycb.../exec`

### Step 3. 프론트엔드 설정 (3분)

1. `index.html` 열기
2. 상단의 `GAS_URL` 상수에 Step 2 URL 붙여넣기
   ```js
   const GAS_URL = 'https://script.google.com/macros/s/AKfycb.../exec';
   ```

### Step 4. GitHub Pages 배포 (10분)

1. GitHub에서 새 **public** repo 생성 (이름: `jecheol-tasting`)
2. 로컬에서:
   ```bash
   cd /Users/hojun.shim/hojun-workspace/20-personal/29-제철의미학/tasting-app
   git init
   git add .
   git commit -m "init: 제철의 미학 테이스팅 앱"
   git branch -M main
   git remote add origin https://github.com/shimchao/jecheol-tasting.git
   git push -u origin main
   ```
3. GitHub repo 페이지 → **Settings** → **Pages**
   - Source: **Deploy from a branch**
   - Branch: **main** / **/ (root)** → Save
4. 1~2분 후 `https://shimchao.github.io/jecheol-tasting/`에서 접속 가능

### Step 5. 5월 멍게 모임 이벤트 등록 (5분)

배포 URL에 `?new=true` 붙여서 접속:
```
https://shimchao.github.io/jecheol-tasting/?new=true
```

[`docs/SEED-2026-05-munge.md`](docs/SEED-2026-05-munge.md)의 시드 데이터로 입력.

---

## 📱 URL 요약

| URL | 용도 | 누가 |
|-----|------|------|
| `/?event=2026-05-munge` | **참여 진입** (시식·투표·결과) | 참여자 12명 |
| `/?event=2026-05-munge&admin=제철2026` | **호스트 대시보드** | 호스트만 |
| `/?new=true` | **새 이벤트 등록** | 매월 호스트 |

→ 참여자에게는 `?event=2026-05-munge` 링크의 QR을 슬랙 채널에 공유.

## 🦑 모임 당일 운영 순서 (5/15)

1. **모임 시작 전**: 슬랙에 QR + URL 공유 (`?event=2026-05-munge`)
2. **시식 시작**: 참여자가 닉네임 입력 → 한 종씩 맛보며 별점·한줄평 입력
3. **투표**: 4종 다 시식 후 "가장 맛있었던 1종" 투표
4. **호스트 대시보드 확인**: `?admin=제철2026` 으로 입력 완료율 확인
5. **결과 공개**: 호스트가 "🎉 결과 공개하기" 버튼 클릭
6. **전원 화면 자동 전환** → 1위 발표 + 별점/득표 막대 그래프 + 한줄평 모음

## 🔁 다음 달 사용법 (재사용)

- 동일 배포 그대로 사용. `?new=true`로 새 이벤트 등록만 하면 끝.
- 호스트 비밀번호 동일: `제철2026`
- 이미지는 새 모임 항목명에 맞게 `images/` 폴더에 추가하고 push.

## 📂 파일 구조

```
tasting-app/
├── index.html              ← 메인 앱 (단일 파일)
├── images/                 ← 식재료 이미지
│   ├── munge-01-yangsik.jpg
│   ├── munge-02-natural.jpg
│   ├── munge-03-bidan.jpg
│   └── munge-04-dol.jpg
├── gas/
│   └── Code.gs             ← Google Apps Script 백엔드
├── docs/
│   ├── SHEETS_SCHEMA.md    ← Sheets 컬럼 정의
│   └── SEED-2026-05-munge.md  ← 5월 멍게 시드 데이터
└── README.md
```

## ⚠️ 트러블슈팅

- **GAS 응답 느림**: 첫 호출 콜드스타트로 2~3초. 모임 시작 전 본인 휴대폰으로 한 번 워밍업.
- **CORS 에러**: GAS Web App의 액세스 권한이 "모든 사용자"인지 재확인. 아닐 경우 Step 2.6 재배포.
- **이미지 안 보임**: GitHub Pages 캐시 (~1분 대기) 또는 파일명 대소문자 확인.
- **결과 공개 후 되돌리기**: Sheets `events` 시트에서 해당 행의 `revealed`를 FALSE로 직접 수정.
