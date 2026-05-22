import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AppShell } from "../../components/v2/AppShell";
import { useAuth } from "../../lib/v2/auth";

/* EMON Med® — Emergency Multi-modal Orchestrated Network
 * Split-screen 로그인 — 좌: 아이디+비밀번호 폼, 우: 브레인 + HUD 브랜드 히어로(정적 이미지). */
export default function LoginPage() {
  const nav = useNavigate();
  const loc = useLocation();
  const { signIn, demoLogin } = useAuth();

  const [empId, setEmpId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectTo =
    (loc.state as { from?: string } | null)?.from || "/demo/triage";

  const cognitoReady =
    !!import.meta.env.VITE_COGNITO_DOMAIN &&
    !!import.meta.env.VITE_COGNITO_CLIENT_ID;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!empId.trim() || !password) {
      setError("아이디와 비밀번호를 입력하세요.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      if (cognitoReady) {
        signIn();
      } else {
        const role = empId.toUpperCase().startsWith("NR") ? "nurse" : "doctor";
        await new Promise((r) => setTimeout(r, 400));
        demoLogin(role);
        nav(redirectTo, { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell bare>
      <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-white">
        {/* ─── 좌측: 로그인 폼 (전체 가운데 정렬) ─── */}
        <section className="min-h-screen flex items-center justify-center px-12 sm:px-16 bg-white">
          <div className="w-full max-w-[420px] flex flex-col">
            {/* 브랜드명 — 가운데 (조금 위로) */}
            <Wordmark className="text-slate-900 self-center mb-24" />
            <h1 className="text-[40px] leading-none font-bold text-slate-900 mb-10">Login</h1>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="empId" className="block text-[15px] font-bold text-slate-800 mb-2">
                    아이디
                  </label>
                  <input
                    id="empId"
                    type="text"
                    value={empId}
                    onChange={(e) => setEmpId(e.target.value)}
                    autoComplete="username"
                    autoFocus
                    disabled={loading}
                    className="w-full h-14 px-4 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-[15px] font-bold text-slate-800 mb-2">
                    비밀번호
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    disabled={loading}
                    className="w-full h-14 px-4 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all disabled:bg-slate-50"
                  />
                </div>

                {error && <p className="text-sm text-red-600 -mt-2">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 mt-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white text-[17px] font-bold rounded-lg transition-colors"
                >
                  {loading ? "로그인 중…" : "로그인"}
                </button>

                <div className="pt-2 flex items-center justify-end gap-3 text-[14px] text-slate-500">
                  <button type="button" className="hover:text-slate-700">아이디 찾기</button>
                  <span className="text-slate-300">|</span>
                  <button type="button" className="hover:text-slate-700">비밀번호 찾기</button>
                </div>
            </form>
          </div>
        </section>

        {/* ─── 우측: 브레인 배경 + EMON 아이콘 (lg부터) ─── */}
        <section className="hidden lg:flex relative overflow-hidden items-center justify-center bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-700">
          {/* 브레인 배경 (정적) */}
          <img
            src="/AI.jpg"
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-90"
          />
          {/* 인디고 틴트 (앱 히어로와 동일한 브랜드 톤) */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(to bottom, rgba(55,48,163,0.4) 0%, rgba(55,48,163,0) 55%)" }}
          />
          {/* 가장자리 비네팅 */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(30,27,75,0.5) 100%)" }}
          />

          {/* 중앙 — 브레인 속 'AI' 박스 가리기 + EMON 아이콘 (그리드 스택으로 정중앙 강제) */}
          <div className="relative grid place-items-center">
            {/* 글로우 */}
            <div className="[grid-area:1/1] h-80 w-80 rounded-full bg-indigo-300/15 blur-3xl" />
            {/* 'AI' 박스 마스킹 — 정중앙, 불투명 브레인 톤 + 블러 */}
            <div className="[grid-area:1/1] h-44 w-72 rounded-full blur-2xl" style={{ background: "rgb(26,52,104)" }} />
            {/* EMON 아이콘 — 정중앙 */}
            <img
              src="/EMON.jpg"
              alt="EMON"
              className="[grid-area:1/1] w-56 object-contain"
              style={{ mixBlendMode: "screen" }}
            />
          </div>
        </section>
      </div>
    </AppShell>
  );
}

/* EMON Med® 워드마크 — 레터스페이스 텍스트(+다크 배경에선 로고 아이콘) */
function Wordmark({ className = "", icon = false }: { className?: string; icon?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-3 text-[52px] font-extrabold tracking-[0.08em] ${className}`}>
      {icon && <img src="/EMON.jpg" alt="" className="h-14 w-14 object-contain" style={{ mixBlendMode: "screen" }} />}
      <span>EMON Med<sup className="text-[22px] align-super">®</sup></span>
    </span>
  );
}
