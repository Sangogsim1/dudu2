# 창원 유니시티 분석 도구 (정적 웹앱)

정적 HTML/CSS/JS로 만든 단일 페이지 앱입니다. `index.html`을 브라우저로 열면 실행됩니다.

## 배포 방법

### Netlify(가장 간단)
1) Netlify 로그인 → Add new site → Deploy manually
2) 이 폴더 전체를 드래그&드롭 업로드 (Build command: 없음, Publish directory: `.`)
3) `netlify.toml`가 보안 헤더를 설정합니다.

### Vercel
1) Vercel 로그인 → New Project → Import
2) Framework: Other, Build: 없음, Output: 루트(`.`)
3) `vercel.json`이 모든 경로를 `index.html`로 라우팅합니다.

### GitHub Pages
1) 새 GitHub 저장소 생성 후 푸시
```bash
git remote add origin <YOUR_REPO_URL>
git branch -M main
git push -u origin main
```
2) GitHub → Settings → Pages → Branch: `main` / 폴더: `/ (root)` → Save

## 로컬 실행
- Windows/macOS/Linux: `index.html` 더블클릭 또는 브라우저로 열기

## 기능
- 보고서 편집/PC 저장/인쇄
- AI 웹검색(Google/Naver/Bing)
- 취득세/중개보수/대출이자 계산기

## 주의
본 앱 정보는 참고용이며 법적 효력이 없습니다. 실제 세율·수수료는 지자체 고시 및 계약을 따릅니다.

