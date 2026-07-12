/** Mermaid erDiagram 파싱·도메인 필터 · 한글 테이블명 표시 */

export const DOMAIN_CORE_ENTITIES: Record<string, string[]> = {
  change: ["CHANGE", "CHANGE_CI_MAP"],
  incident: ["INCIDENT", "INCIDENT_CI_MAP"],
  config: ["CI", "CI_HISTORY"],
  problem: ["PROBLEM", "PROBLEM_INCIDENT_MAP"],
  deploy: ["DEPLOY", "DEPLOY_CHG_MAP"],
  request: ["REQUEST", "REQUEST_INCIDENT_MAP", "REQUEST_CI_MAP"],
  sla: ["SLA", "SLA_INCIDENT_MAP", "SLA_OPS_MAP"],
  baseline: ["BASELINE", "BASELINE_CI_MAP"],
  ops: ["OPS_STATUS", "OPS_CI_MAP"],
  event: ["EVENT"],
  test: ["TEST_CASE"],
  interface: ["INTERFACE", "INTERFACE_CI_MAP"],
  backup: ["BACKUP", "BACKUP_CI_MAP"],
};

/** 테이블(엔티티) 한글명 — 화면에는 (한글명/원래명) 으로 표시 */
export const ENTITY_LABELS_KO: Record<string, string> = {
  CHANGE: "변경관리",
  INCIDENT: "장애관리",
  CI: "구성관리",
  PROBLEM: "문제관리",
  DEPLOY: "배포관리",
  REQUEST: "요청관리",
  SLA: "서비스수준관리",
  BASELINE: "형상관리",
  OPS_STATUS: "운영상태관리",
  EVENT: "이벤트관리",
  TEST_CASE: "테스트관리",
  INTERFACE: "연계관리",
  BACKUP: "백업관리",
  CHANGE_CI_MAP: "변경-구성매핑",
  INCIDENT_CI_MAP: "장애-구성매핑",
  CI_HISTORY: "구성이력",
  PROBLEM_INCIDENT_MAP: "문제-장애매핑",
  DEPLOY_CHG_MAP: "배포-변경매핑",
  REQUEST_INCIDENT_MAP: "요청-장애매핑",
  REQUEST_CI_MAP: "요청-구성매핑",
  SLA_INCIDENT_MAP: "SLA-장애매핑",
  SLA_OPS_MAP: "SLA-운영매핑",
  BASELINE_CI_MAP: "형상-구성매핑",
  OPS_CI_MAP: "운영-구성매핑",
  INTERFACE_CI_MAP: "연계-구성매핑",
  BACKUP_CI_MAP: "백업-구성매핑",
};

export function entityDisplayName(name: string): string {
  const ko = ENTITY_LABELS_KO[name];
  return ko ? `(${ko}/${name})` : name;
}

const ENTITY_RE = /^\s*([A-Z][A-Z0-9_]*)\s*(?:\[[^\]]*\])?\s*\{([\s\S]*?)^\s*\}/gm;
const REL_RE = /^\s*([A-Z][A-Z0-9_]*)\s+([|}o{\-]+)\s+([A-Z][A-Z0-9_]*)\s*:\s*"(.*)"\s*$/;

function parseEntities(source: string): Map<string, string> {
  const entities = new Map<string, string>();
  let m: RegExpExecArray | null;
  const entityRe = new RegExp(ENTITY_RE.source, "gm");
  while ((m = entityRe.exec(source)) !== null) {
    entities.set(m[1], m[2].replace(/\s+$/, ""));
  }
  return entities;
}

function parseRelations(source: string) {
  const relations: { left: string; op: string; right: string; label: string }[] = [];
  for (const line of source.split("\n")) {
    const rm = line.match(REL_RE);
    if (rm) relations.push({ left: rm[1], op: rm[2], right: rm[3], label: rm[4] });
  }
  return relations;
}

function buildDiagram(
  entities: Map<string, string>,
  relations: { left: string; op: string; right: string; label: string }[],
  keep: Set<string> | null,
): string {
  const names = keep ? [...keep] : [...entities.keys()];
  const parts = ["erDiagram"];
  for (const name of names) {
    const body = entities.get(name);
    if (body === undefined) continue;
    // Mermaid: ENTITY["표시명"] { ... }  → 헤더에 (한글명/원래명)
    parts.push(`    ${name}["${entityDisplayName(name)}"] {`);
    parts.push(body.trimEnd());
    parts.push("    }");
  }
  for (const r of relations) {
    if (keep && !(keep.has(r.left) && keep.has(r.right))) continue;
    parts.push(`    ${r.left} ${r.op} ${r.right} : "${r.label}"`);
  }
  return parts.join("\n");
}

/** 도메인 필터 + 테이블명 (한글명/원래명) 표시 */
export function filterErdByDomain(source: string, domainKey: string | null): string {
  const entities = parseEntities(source);
  const relations = parseRelations(source);

  if (!domainKey) {
    return buildDiagram(entities, relations, null);
  }

  const core = new Set(DOMAIN_CORE_ENTITIES[domainKey] || []);
  if (!core.size) {
    return buildDiagram(entities, relations, null);
  }

  const keep = new Set<string>(core);
  const keptRels = relations.filter((r) => {
    const hit = core.has(r.left) || core.has(r.right);
    if (hit) {
      keep.add(r.left);
      keep.add(r.right);
    }
    return hit;
  });

  return buildDiagram(entities, keptRels, keep);
}
