import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AxiosError } from 'axios'
import { useAuth } from '../auth/AuthContext'
import Logo from '../components/Logo'

const inputClass =
  'w-full rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-ink outline-none transition-colors focus:border-[#2a7de1] focus:ring-2 focus:ring-[#2a7de1]/25'

export default function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@warsha.test')
  const [password, setPassword] = useState('password')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await login(email, password)
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
    <div className="flex min-h-full bg-[#0f1216]">
      {/* Brand panel (right in RTL) */}
      <div className="relative hidden flex-1 flex-col items-center justify-center overflow-hidden p-10 md:flex">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -right-24 top-8 h-80 w-80 rounded-full bg-[#1e5fbf]/25 blur-3xl" />
          <div className="absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-[#2a7de1]/10 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:44px_44px]" />
        </div>
        <div className="relative flex flex-col items-center text-center">
          <Logo className="h-40 w-40 drop-shadow-[0_10px_35px_rgba(30,95,191,0.4)]" id="brand" />
          <h1 className="mt-6 bg-gradient-to-b from-white via-slate-300 to-slate-500 bg-clip-text text-6xl font-extrabold tracking-[0.22em] text-transparent">GEORGE</h1>
          <p className="mt-3 text-sm tracking-[0.25em] text-slate-400">إدارة مركز صيانة السيارات</p>
          <div className="mt-6 h-1 w-28 rounded-full bg-gradient-to-r from-transparent via-[#2a7de1] to-transparent" />
        </div>
      </div>

      {/* Form panel (left in RTL) */}
      <div className="flex w-full flex-col items-center justify-center bg-canvas p-6 md:w-[460px] md:shadow-2xl">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center md:hidden">
            <Logo className="h-16 w-16" id="mobile" />
            <h1 className="mt-3 text-2xl font-extrabold tracking-[0.22em] text-ink">GEORGE</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-line bg-surface p-6 shadow-lg">
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

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-[#1e5fbf] px-4 py-2.5 font-semibold text-white shadow-md shadow-[#1e5fbf]/20 transition-colors hover:bg-[#17509f] disabled:opacity-60"
            >
              {busy ? 'جارٍ الدخول…' : 'دخول'}
            </button>

            <p className="text-center text-xs text-faint">بيانات التجربة: admin@warsha.test / password</p>
          </form>
        </div>
      </div>
    </div>
  )
}
