"""ITSM_CURSOR 백엔드 도메인 설정.

기존 wiki(Streamlit) 앱의 도메인 구조를 그대로 계승하되, 화면(프론트)은 React로
새로 구현하기 때문에 백엔드는 "각 도메인 = 폴더 + 마스터 CSV" 라는 사실만 알면 된다.
컬럼 목록은 CSV 헤더에서 읽고, 한글 라벨은 아래 COLUMN_LABELS_KO로 치환한다.
"""

# CI_CATEGORY(원본 코드) -> 화면 표시용 한글 라벨 (wiki labels.py에서 계승).
CATEGORY_LABELS_KO = {
    "Storage": "스토리지",
    "VM": "가상머신(VM)",
    "Staff": "인력",
    "PC": "PC",
    "Server": "서버",
    "Internal_Security_Sol": "내부보안솔루션",
    "DMZ_Compute": "DMZ 서버",
    "Switch": "스위치",
    "Network_Security": "네트워크 보안",
    "Network_Equipment": "네트워크 장비",
    "L3_PAGE": "웹페이지(3단계)",
    "L2_PAGE": "웹페이지(2단계)",
    "L1_PAGE": "웹페이지(1단계)",
    "Peripheral": "주변기기",
    "Security_Management": "보안관제",
}

# CSV 컬럼 -> 한글 라벨 (wiki column_labels.py에서 계승).
COLUMN_LABELS_KO = {
    "MAP_ID": "매핑 ID", "CI_ID": "구성항목 ID", "NOTE": "비고", "STATUS": "상태",
    "OWNER_TEAM": "담당 부서",
    "CHG_TICKET_ID": "변경 티켓 ID", "CHG_TITLE": "변경 제목", "CHG_TYPE": "변경 유형",
    "REQUEST_TEAM": "요청 부서", "REQUESTER_ID": "요청자 ID", "APPROVER_ID": "승인자 ID",
    "CHG_STATUS": "변경 상태", "PLANNED_DT": "계획 일시", "APPLIED_DT": "적용 일시",
    "ROLLBACK_YN": "롤백 여부", "IMPACT_LEVEL": "영향도", "RELATED_DESC": "상세 내용",
    "TRIGGERED_BY_INCIDENT_ID": "촉발 장애 ID", "WORK_NOTE": "작업 메모",
    "INCIDENT_ID": "장애 ID", "INCIDENT_TITLE": "장애 제목", "SEVERITY": "심각도",
    "DETECTED_DT": "감지 일시", "RESOLVED_DT": "복구 일시", "ROOT_CAUSE": "근본 원인",
    "ACTION_TAKEN": "조치 내용", "HANDLER_ID": "처리자 ID", "INCIDENT_STATUS": "장애 상태",
    "CAUSED_BY_CHG_TICKET_ID": "원인 변경 ID", "IMPACT_DESC": "영향 내용",
    "CI_NAME": "자산명", "HOST_NAME": "호스트명", "CI_TYPE": "자산 유형",
    "CI_CATEGORY": "자산 분류", "DEPTH_LEVEL": "계층 깊이", "PARENT_CI_ID": "상위 자산 ID",
    "LOCATION_OR_URL": "위치/URL", "IP_ADDRESS": "IP 주소", "OS_VERSION": "OS 버전",
    "SERIAL_NUM": "일련번호", "ADMIN_USER_ID": "관리자 ID", "INST_DT": "설치 일시",
    "HISTORY_ID": "이력 ID", "ACTION": "조치 구분", "ACTION_DT": "조치 일시", "ACTION_BY": "조치자",
    "TARGET_ID": "대상 ID",
    "PROBLEM_ID": "문제 ID", "PROBLEM_TITLE": "문제 제목", "PROBLEM_TYPE": "문제 유형",
    "WORKAROUND": "임시 회피책", "PERMANENT_FIX": "영구 조치",
    "DEPLOY_ID": "배포 ID", "DEPLOY_NAME": "배포명", "DEPLOY_TYPE": "배포 유형",
    "DEPLOY_STATUS": "배포 상태", "DEPLOYED_DT": "배포 일시", "DESC": "설명",
    "REQ_ID": "요청 ID", "REQ_TITLE": "요청 제목", "REQ_TYPE": "요청 유형",
    "REQUESTED_DT": "요청 일시", "COMPLETED_DT": "완료 일시", "ASSIGNED_TEAM": "담당 부서",
    "SLA_ID": "SLA ID", "SERVICE_NAME": "서비스명", "METRIC_TYPE": "지표 유형",
    "TARGET_VALUE": "목표치", "PERIOD": "측정 주기", "MEASURED_VALUE": "측정치",
    "BREACH_YN": "위반 여부",
    "BASELINE_ID": "베이스라인 ID", "BASELINE_NAME": "베이스라인명", "VERSION": "버전",
    "BASELINE_TYPE": "베이스라인 유형", "CREATED_DT": "생성 일시", "APPROVED_DT": "승인 일시",
    "RESOLVED_PROBLEM_ID": "조치 문제 ID",
    "BASELINE_VERSION": "베이스라인 버전(스냅샷)", "BASELINE_AREA": "베이스라인 영역",
    "OPS_ID": "운영상태 ID", "CHECK_DT": "점검 일시", "METRIC_SUMMARY": "지표 요약",
    "EVENT_ID": "이벤트 ID", "EVENT_TITLE": "이벤트 제목", "EVENT_TYPE": "이벤트 유형",
    "SOURCE_OPS_ID": "감지 운영상태 ID", "EVENT_STATUS": "이벤트 상태",
    "ESCALATED_INCIDENT_ID": "확대 장애 ID",
    "TEST_ID": "테스트 ID", "TEST_TYPE": "테스트 유형", "TEST_RESULT": "테스트 결과",
    "TESTED_DT": "테스트 일시", "TESTER_TEAM": "테스트 담당 부서",
    "INTERFACE_ID": "연계 ID", "INTERFACE_NAME": "연계명",
    "EXTERNAL_SYSTEM_NAME": "외부 시스템명", "PROTOCOL": "프로토콜",
    "LAST_CHECK_DT": "최종 점검 일시", "VALIDATED_BY_TEST_ID": "검증 테스트 ID",
    "BACKUP_ID": "백업 ID", "ACTION_TYPE": "조치 유형", "BACKUP_DT": "백업 일시",
    "RETENTION_UNTIL_DT": "보관 만료일", "RESTORED_FROM_BACKUP_ID": "복원 원본 백업 ID",
}

# 각 도메인: key(URL slug) / 한글 타이틀 / 폴더 / 마스터 CSV / PK 컬럼 / 신규 ID 접두어 / 대표 제목 컬럼 / 아이콘(lucide)
DOMAINS = [
    {"key": "change",    "title": "변경관리",       "folder": "1_변경관리",       "csv": "CHANGE.csv",    "id_field": "CHG_TICKET_ID", "prefix": "CHG", "title_field": "CHG_TITLE",     "icon": "GitBranch"},
    {"key": "incident",  "title": "장애관리",       "folder": "2_장애관리",       "csv": "INCIDENT.csv",  "id_field": "INCIDENT_ID",   "prefix": "INC", "title_field": "INCIDENT_TITLE", "icon": "AlertTriangle"},
    {"key": "config",    "title": "구성관리",       "folder": "3_구성관리",       "csv": "CI.csv",        "id_field": "CI_ID",         "prefix": "CI",  "title_field": "CI_NAME",       "icon": "Boxes"},
    {"key": "problem",   "title": "문제관리",       "folder": "6_문제관리",       "csv": "PROBLEM.csv",   "id_field": "PROBLEM_ID",    "prefix": "PRB", "title_field": "PROBLEM_TITLE",  "icon": "Search"},
    {"key": "deploy",    "title": "배포관리",       "folder": "7_배포관리",       "csv": "DEPLOY.csv",    "id_field": "DEPLOY_ID",     "prefix": "DEP", "title_field": "DEPLOY_NAME",    "icon": "Rocket"},
    {"key": "request",   "title": "요청관리",       "folder": "8_요청관리",       "csv": "REQUEST.csv",   "id_field": "REQ_ID",        "prefix": "REQ", "title_field": "REQ_TITLE",      "icon": "Inbox"},
    {"key": "sla",       "title": "서비스수준관리", "folder": "9_서비스수준관리", "csv": "SLA.csv",       "id_field": "SLA_ID",        "prefix": "SLA", "title_field": "SERVICE_NAME",   "icon": "Gauge"},
    {"key": "baseline",  "title": "형상관리",       "folder": "10_형상관리",      "csv": "BASELINE.csv",  "id_field": "BASELINE_ID",   "prefix": "BSL", "title_field": "BASELINE_NAME",  "icon": "Layers"},
    {"key": "ops",       "title": "운영상태관리",   "folder": "11_운영상태관리",  "csv": "OPS_STATUS.csv","id_field": "OPS_ID",        "prefix": "OPS", "title_field": "METRIC_SUMMARY", "icon": "Activity"},
    {"key": "event",     "title": "이벤트관리",     "folder": "12_이벤트관리",    "csv": "EVENT.csv",     "id_field": "EVENT_ID",      "prefix": "EVT", "title_field": "EVENT_TITLE",    "icon": "Bell"},
    {"key": "test",      "title": "테스트관리",     "folder": "13_테스트관리",    "csv": "TEST_CASE.csv", "id_field": "TEST_ID",       "prefix": "TST", "title_field": "TEST_TYPE",      "icon": "FlaskConical"},
    {"key": "interface", "title": "연계관리",       "folder": "14_연계관리",      "csv": "INTERFACE.csv", "id_field": "INTERFACE_ID",  "prefix": "IFC", "title_field": "INTERFACE_NAME", "icon": "Cable"},
    {"key": "backup",    "title": "백업관리",       "folder": "15_백업관리",      "csv": "BACKUP.csv",    "id_field": "BACKUP_ID",     "prefix": "BKP", "title_field": "ACTION_TYPE",    "icon": "DatabaseBackup"},
]

DOMAINS_BY_KEY = {d["key"]: d for d in DOMAINS}


# N:M 매핑 테이블 (도메인 폴더 하위 *이력/*.csv)
# owner_field = 부모 마스터 PK, related_field = 연결 대상 PK, related_domain = 옵션 소스 도메인
DOMAIN_MAPS = {
    "change": [
        {
            "key": "change_ci",
            "title": "변경 ↔ 구성",
            "rel_path": "변경히스토리/CHANGE_CI_MAP.csv",
            "owner_field": "CHG_TICKET_ID",
            "related_field": "CI_ID",
            "related_domain": "config",
            "extra_fields": ["APPLIED_DT", "WORK_NOTE"],
        },
    ],
    "incident": [
        {
            "key": "incident_ci",
            "title": "장애 ↔ 구성",
            "rel_path": "장애이력/INCIDENT_CI_MAP.csv",
            "owner_field": "INCIDENT_ID",
            "related_field": "CI_ID",
            "related_domain": "config",
            "extra_fields": ["IMPACT_DESC"],
        },
    ],
    "problem": [
        {
            "key": "problem_incident",
            "title": "문제 ↔ 장애",
            "rel_path": "문제이력/PROBLEM_INCIDENT_MAP.csv",
            "owner_field": "PROBLEM_ID",
            "related_field": "INCIDENT_ID",
            "related_domain": "incident",
            "extra_fields": ["NOTE"],
        },
    ],
    "deploy": [
        {
            "key": "deploy_chg",
            "title": "배포 ↔ 변경",
            "rel_path": "배포이력/DEPLOY_CHG_MAP.csv",
            "owner_field": "DEPLOY_ID",
            "related_field": "CHG_TICKET_ID",
            "related_domain": "change",
            "extra_fields": ["NOTE"],
        },
    ],
    "request": [
        {
            "key": "request_ci",
            "title": "요청 ↔ 구성",
            "rel_path": "요청이력/REQUEST_CI_MAP.csv",
            "owner_field": "REQ_ID",
            "related_field": "CI_ID",
            "related_domain": "config",
            "extra_fields": ["NOTE"],
        },
        {
            "key": "request_incident",
            "title": "요청 ↔ 장애",
            "rel_path": "요청이력/REQUEST_INCIDENT_MAP.csv",
            "owner_field": "REQ_ID",
            "related_field": "INCIDENT_ID",
            "related_domain": "incident",
            "extra_fields": ["NOTE"],
        },
    ],
    "sla": [
        {
            "key": "sla_incident",
            "title": "SLA ↔ 장애",
            "rel_path": "SLA이력/SLA_INCIDENT_MAP.csv",
            "owner_field": "SLA_ID",
            "related_field": "INCIDENT_ID",
            "related_domain": "incident",
            "extra_fields": ["BREACH_YN", "NOTE"],
        },
        {
            "key": "sla_ops",
            "title": "SLA ↔ 운영상태",
            "rel_path": "SLA이력/SLA_OPS_MAP.csv",
            "owner_field": "SLA_ID",
            "related_field": "OPS_ID",
            "related_domain": "ops",
            "extra_fields": ["NOTE"],
        },
    ],
    "baseline": [
        {
            "key": "baseline_ci",
            "title": "형상 ↔ 구성",
            "rel_path": "형상이력/BASELINE_CI_MAP.csv",
            "owner_field": "BASELINE_ID",
            "related_field": "CI_ID",
            "related_domain": "config",
            "extra_fields": ["BASELINE_VERSION", "BASELINE_AREA", "APPLIED_DT", "NOTE"],
        },
    ],
    "ops": [
        {
            "key": "ops_ci",
            "title": "운영상태 ↔ 구성",
            "rel_path": "운영이력/OPS_CI_MAP.csv",
            "owner_field": "OPS_ID",
            "related_field": "CI_ID",
            "related_domain": "config",
            "extra_fields": ["NOTE"],
        },
    ],
    "interface": [
        {
            "key": "interface_ci",
            "title": "연계 ↔ 구성",
            "rel_path": "연계이력/INTERFACE_CI_MAP.csv",
            "owner_field": "INTERFACE_ID",
            "related_field": "CI_ID",
            "related_domain": "config",
            "extra_fields": ["NOTE"],
        },
    ],
    "backup": [
        {
            "key": "backup_ci",
            "title": "백업 ↔ 구성",
            "rel_path": "백업이력/BACKUP_CI_MAP.csv",
            "owner_field": "BACKUP_ID",
            "related_field": "CI_ID",
            "related_domain": "config",
            "extra_fields": ["NOTE"],
        },
    ],
}

# 마스터 행의 FK 필드 → 참조 도메인 (등록/수정 시 셀렉트)
# ref_domain == 자기 key 이면 동일 CSV 셀프 참조
DOMAIN_FKS = {
    "change": [
        {"field": "TRIGGERED_BY_INCIDENT_ID", "ref_domain": "incident", "optional": True},
    ],
    "incident": [
        {"field": "CAUSED_BY_CHG_TICKET_ID", "ref_domain": "change", "optional": True},
    ],
    "config": [
        {"field": "PARENT_CI_ID", "ref_domain": "config", "optional": True},
        {"field": "CHG_TICKET_ID", "ref_domain": "change", "optional": True},
    ],
    "sla": [
        {"field": "DEPLOY_ID", "ref_domain": "deploy", "optional": True},
    ],
    "baseline": [
        {"field": "RESOLVED_PROBLEM_ID", "ref_domain": "problem", "optional": True},
    ],
    "event": [
        {"field": "CI_ID", "ref_domain": "config", "optional": True},
        {"field": "SOURCE_OPS_ID", "ref_domain": "ops", "optional": True},
        {"field": "ESCALATED_INCIDENT_ID", "ref_domain": "incident", "optional": True},
    ],
    "test": [
        {"field": "DEPLOY_ID", "ref_domain": "deploy", "optional": False},
    ],
    "interface": [
        {"field": "VALIDATED_BY_TEST_ID", "ref_domain": "test", "optional": True},
        {"field": "BASELINE_ID", "ref_domain": "baseline", "optional": True},
    ],
    "backup": [
        {"field": "RESTORED_FROM_BACKUP_ID", "ref_domain": "backup", "optional": True},
    ],
}


def ko_label(column):
    return COLUMN_LABELS_KO.get(column, column)


def maps_for(domain_key):
    return DOMAIN_MAPS.get(domain_key, [])


def fks_for(domain_key):
    return DOMAIN_FKS.get(domain_key, [])


def map_by_key(domain_key, map_key):
    for m in maps_for(domain_key):
        if m["key"] == map_key:
            return m
    return None
