# 과제 제출용 바로가기 (Windows · Google Drive)

**기관:** AI활성화진흥공단  
**시스템:** ITSM_CURSOR 표준운영관리 포털

이 폴더를 그대로 **Google Drive에 업로드**하면, 평가자(Windows)가 더블클릭으로 포털·저장소에 접근할 수 있습니다.

## 포함 파일

| 파일 | 용도 | Windows |
|---|---|---|
| `01_GitHub_소스저장소_온라인.url` | GitHub 저장소 (온라인) | ✅ 더블클릭 |
| `02_공단_ITSM포털_온라인.url` | GitHub Pages 안내 포털 (온라인) | ✅ 더블클릭 |
| `03_로컬포털_프로덕션_8000.url` | 로컬 `http://localhost:8000` | 서버 기동 후 |
| `04_로컬포털_개발_5173.url` | 로컬 `http://localhost:5173` | 개발 서버 기동 후 |
| `ITSM포털_바로가기_허브.html` | 링크 모음 페이지 (맥/윈도우 공통) | ✅ 브라우저로 열기 |
| `ITSM포털_열기_Windows.bat` | 메뉴형 실행기 | ✅ 더블클릭 |

## Google Drive 제출 방법

1. 이 `제출용_바로가기` 폴더 전체(또는 `제출용_바로가기.zip`)를 Drive에 업로드
2. 평가자에게 공유(보기 가능)
3. Windows에서 `.url` 파일 더블클릭 → 기본 브라우저로 이동

> Drive 웹에서 `.url`이 바로 안 열리면 **다운로드 후** 실행하세요.

## 온라인 주소 (복사 제출용)

- GitHub: https://github.com/hudsonkim77/ITSM_CURSOR  
- 온라인 안내 포털: https://hudsonkim77.github.io/ITSM_CURSOR/

## 로컬 포털 기동 (시연 PC)

저장소를 받은 뒤:

```bat
REM Windows 예시 — Python/Node 설치 필요
cd 5_ITSM관리\frontend
npm install
npm run build
cd ..\backend
pip install -r requirements.txt
set MGMT_PASSWORD=7587
python -m uvicorn app:app --host 0.0.0.0 --port 8000
```

브라우저: http://localhost:8000/

macOS는 `5_ITSM관리/scripts/prod.sh` 사용.
