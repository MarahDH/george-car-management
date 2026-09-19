import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AxiosError } from 'axios'
import { useAuth } from '../auth/AuthContext'

const inputClass =
  'w-full rounded-lg border border-line bg-white/70 px-3 py-2.5 text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-cyan/30'

export default function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@warsha.test')
  const [password, setPassword] = useState('password')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await login(email, password, remember)
      navigate('/', { replace: true })
    } catch (err) {
      const axiosErr = err as AxiosError<{ errors?: Record<string, string[]>; message?: string }>
      setError(
        axiosErr.response?.data?.errors?.email?.[0] ??
        axiosErr.response?.data?.message ??
        'تعذّر الاتصال بالخادم.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="ocean-grad flex min-h-full">
      {/* Brand panel (right in RTL) */}
      <div className="relative hidden flex-1 flex-col items-center justify-center overflow-hidden p-10 md:flex">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="aqua-blob absolute -right-24 top-8 h-80 w-80 rounded-full bg-cyan/30 blur-3xl" />
          <div className="aqua-blob absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-accent/25 blur-3xl [animation-delay:-6s]" />
          <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:44px_44px]" />
        </div>
        <div className="relative flex flex-col items-center text-center">
          <img src="/george-logo.png" alt="GEORGE" className="h-40 w-40 rounded-3xl ring-1 ring-white/20 drop-shadow-[0_10px_40px_rgba(28,196,216,0.45)]" />
          <h1 className="mt-6 bg-gradient-to-b from-white via-sky-200 to-cyan-300 bg-clip-text text-6xl font-extrabold tracking-[0.22em] text-transparent">GEORGE</h1>
          <p className="mt-3 text-sm tracking-[0.25em] text-petrol-faint">إدارة مركز صيانة السيارات</p>
          <div className="mt-6 h-1 w-28 rounded-full bg-gradient-to-r from-transparent via-cyan-300 to-transparent" />
        </div>
        {/* Water surface */}
        <svg aria-hidden viewBox="0 0 1440 120" preserveAspectRatio="none" className="wave-bob absolute inset-x-0 bottom-0 h-16 w-full">
          <path fill="#ffffff" fillOpacity="0.06" d="M0 64 C 240 112, 480 16, 720 48 S 1200 112, 1440 56 L 1440 120 L 0 120 Z" />
          <path fill="#ffffff" fillOpacity="0.04" d="M0 88 C 260 120, 520 48, 780 72 S 1220 120, 1440 84 L 1440 120 L 0 120 Z" />
        </svg>
      </div>

      {/* Form panel (left in RTL) */}
      <div className="app-canvas flex w-full flex-col items-center justify-center p-6 md:w-[460px] md:shadow-2xl">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center md:hidden">
            <img src="/george-logo.png" alt="GEORGE" className="h-16 w-16 rounded-2xl" />
            <h1 className="mt-3 text-2xl font-extrabold tracking-[0.22em] text-ink">GEORGE</h1>
          </div>

          <form onSubmit={handleSubmit} className="glass space-y-4 rounded-2xl p-6">
            <div>
              <h2 className="text-xl font-bold text-ink">تسجيل الدخول</h2>
              <p className="mt-1 text-sm text-muted">أهلاً بك، سجّل الدخول للمتابعة.</p>
            </div>

            {error && (
              <div className="rounded-lg border border-bad/30 bg-bad/5 px-3 py-2 text-sm text-bad">{error}</div>
            )}

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-muted">البريد الإلكتروني</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" autoComplete="username" className={`${inputClass} text-right`} required />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-muted">كلمة المرور</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" className={inputClass} required />
            </label>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-line text-accent accent-accent focus:ring-2 focus:ring-cyan/30"
              />
              تذكّرني على هذا الجهاز
            </label>

            <button
              type="submit"
              disabled={busy}
              className="aqua-grad w-full rounded-lg px-4 py-2.5 font-semibold text-white shadow-md shadow-cyan/30 transition-transform hover:-translate-y-0.5 disabled:opacity-60"
            >
              {busy ? 'جارٍ الدخول…' : 'دخول'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
