import { useEffect } from "react";
import { Printer, X } from "lucide-react";
import type { Column } from "../api";
import { ORG_DEPT, ORG_NAME, docTitleFor, todayIso, todayKo } from "../lib/printDocs";

export interface OfficialDocPayload {
  domainKey: string;
  domainTitle: string;
  columns: Column[];
  row: Record<string, string>;
  idField: string;
  drafter: string;
}

const APPROVAL_COLS = ["기안", "검토", "협조", "승인"] as const;

export default function OfficialDocPrint({
  payload,
  onClose,
}: {
  payload: OfficialDocPayload;
  onClose: () => void;
}) {
  const docTitle = docTitleFor(payload.domainKey, payload.domainTitle);
  const docNo = payload.row[payload.idField] || "—";
  const fields = payload.columns.filter((c) => c.name !== payload.idField);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="official-print-overlay fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-slate-900/50 p-4">
      <div className="official-print-shell my-4 w-full max-w-[210mm]" onClick={(e) => e.stopPropagation()}>
        <div className="official-print-toolbar mb-3 flex items-center justify-between gap-2 rounded-xl bg-white px-4 py-3 shadow">
          <div>
            <p className="text-sm font-semibold text-slate-900">{docTitle} 미리보기</p>
            <p className="text-xs text-slate-500">공단 공통 양식 · 인쇄 시 본 화면만 출력됩니다</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-primary" onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> 인쇄 / PDF
            </button>
            <button className="btn-ghost" onClick={onClose} aria-label="닫기">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <article className="official-doc">
          {/* 헤더: flex로 좌측 기관정보 + 우측 결재란 — absolute 미사용 */}
          <header className="official-doc__header">
            <div className="official-doc__org">
              <p className="official-doc__org-name">{ORG_NAME}</p>
              <p className="official-doc__org-dept">{ORG_DEPT} · IT서비스관리(ITSM)</p>
              <p className="official-doc__meta">문서번호: {docNo}</p>
              <p className="official-doc__meta">작성일자: {todayIso()}</p>
            </div>

            <div className="official-doc__approval">
              <p className="official-doc__approval-label">전 자 결 재</p>
              <table className="official-doc__approval-table">
                <thead>
                  <tr>
                    {APPROVAL_COLS.map((label) => (
                      <th key={label}>{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="official-doc__approval-sign">
                    {APPROVAL_COLS.map((label) => (
                      <td key={label}>
                        {label === "기안" ? (
                          <span className="official-doc__drafter-name">{payload.drafter || "—"}</span>
                        ) : null}
                      </td>
                    ))}
                  </tr>
                  <tr className="official-doc__approval-date">
                    {APPROVAL_COLS.map((label) => (
                      <td key={label}>{label === "기안" ? todayIso() : ""}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </header>

          <h1 className="official-doc__title">{docTitle}</h1>

          <table className="official-doc__info">
            <tbody>
              <tr>
                <th>문서번호</th>
                <td className="mono">{docNo}</td>
                <th>관리영역</th>
                <td>{payload.domainTitle}</td>
              </tr>
              <tr>
                <th>기안자</th>
                <td>{payload.drafter || "—"}</td>
                <th>작성일</th>
                <td>{todayIso()}</td>
              </tr>
            </tbody>
          </table>

          <table className="official-doc__body">
            <thead>
              <tr>
                <th className="col-label">항목</th>
                <th>내용</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((c) => (
                <tr key={c.name}>
                  <th>{c.label}</th>
                  <td>{(payload.row[c.name] || "").trim() || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <section className="official-doc__note">
            <p className="official-doc__note-label">특기사항</p>
            <div className="official-doc__note-box">(해당 시 기재)</div>
          </section>

          <footer className="official-doc__footer">
            <p className="official-doc__closing">
              위와 같이 <strong>{docTitle}</strong>을(를) 제출하오니
              <br />
              검토하여 주시기 바랍니다.
            </p>
            <p className="official-doc__date">{todayKo()}</p>
            <div className="official-doc__sign">
              <p>
                기안자:{" "}
                <span className="official-doc__sign-name">{payload.drafter || "　　　"}</span>
                {" "}(인)
              </p>
              <p className="official-doc__sign-org">
                {ORG_NAME} {ORG_DEPT}
              </p>
            </div>
          </footer>
        </article>
      </div>
    </div>
  );
}
