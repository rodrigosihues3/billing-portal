import { useEffect, useState } from 'react'
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  ExternalLink,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  Smartphone,
  X
} from 'lucide-react'
import { supabase } from '../services/supabaseClient'
import {
  checkEmailVerified,
  checkRucAvailability,
  executeProvisioning,
  registerAdminUser,
  resendVerificationEmail
} from '../services/billingService'
import { buscarDocumentoFiscal, RUC_DEMO } from '../services/decolectaService'
import { plans, type BillingForm, type PaymentMethod, type Plan, type Transaction } from '../types/billing'

const ADMIN_URL = import.meta.env.VITE_ADMIN_PANEL_URL || 'http://localhost:3000/admin'

const initialForm: BillingForm = {
  email: '',
  password: '',
  document: '',
  businessName: '',
  phone: '',
  otp: '',
  card: '',
  expiry: '',
  cvv: ''
}

const onlyNumbers = (v: string, max: number) => v.replace(/\D/g, '').slice(0, max)

// Botón para copiar el código de transacción (estado local, independiente del flujo)
function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(value).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        })
      }}
      aria-label="Copiar código de transacción"
      className="inline-flex shrink-0 items-center gap-1 rounded-[5px] border border-slate-300 bg-white px-2 py-1 font-mono text-[10px] font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
    >
      {copied ? <Check size={12} strokeWidth={1.75} /> : <Copy size={12} strokeWidth={1.75} />}
      {copied ? 'COPIADO' : 'COPIAR'}
    </button>
  )
}

interface Props {
  initialPlan?: Plan | null
  onClose: () => void
}

export function CheckoutModal({ initialPlan, onClose }: Props) {
  // Pasos del flujo:
  // 0: Selección de Plan (si se abrió sin plan previo)
  // 1: Credenciales (Correo y Contraseña estricta)
  // 2: Espera de Verificación por Correo
  // 3: Identificación Fiscal (RUC y Razón Social)
  // 4: Pasarela de Pago Simulada
  const [currentPlan, setCurrentPlan] = useState<Plan>(initialPlan || 'growth')
  const [step, setStep] = useState<number>(initialPlan ? 1 : 0)
  const [form, setForm] = useState<BillingForm>(initialForm)

  // Estados de sesión y verificación
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Estados de validación fiscal (100% RUC)
  const [searchingDoc, setSearchingDoc] = useState(false)
  const [verifiedDoc, setVerifiedDoc] = useState(false)
  const [rucAvailable, setRucAvailable] = useState<boolean | null>(null)
  const [docFeedback, setDocFeedback] = useState('')

  // Estados de pasarela y resultado
  const [method, setMethod] = useState<PaymentMethod>('yape')
  const [result, setResult] = useState<Transaction | null>(null)

  const selectedPlan = plans.find(p => p.id === currentPlan)!
  const isTrial = currentPlan === 'trial'
  const update = (key: keyof BillingForm, value: string) => setForm(c => ({ ...c, [key]: value }))

  // Temporizador regresivo para reenvío de correo
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldown])

  // Escucha reactiva en caso de que el usuario verifique el enlace en esta misma pestaña
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
        if (session.user.email_confirmed_at) {
          setUserId(session.user.id)
          if (step === 2) {
            setStep(3)
          }
        }
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [step])

  // Validaciones rigurosas de contraseña
  const passLength = form.password.length >= 8
  const passUpper = /[A-Z]/.test(form.password)
  const passLower = /[a-z]/.test(form.password)
  const passNumber = /[0-9]/.test(form.password)
  const passSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(form.password)
  const passwordValid = passLength && passUpper && passLower && passNumber && passSpecial
  const credentialsValid = /\S+@\S+\.\S+/.test(form.email) && passwordValid

  // Validaciones de formulario fiscal
  const fiscalValid = isTrial
    ? verifiedDoc && rucAvailable === true && form.businessName.trim().length >= 3
    : form.businessName.trim().length >= 3 && rucAvailable !== false

  // Validaciones de pasarela
  const cardValid =
    form.card.length === 16 &&
    form.cvv.length === 3 &&
    /^(0[1-9]|1[0-2])\/\d{2}$/.test(form.expiry) &&
    (() => {
      const [m, y] = form.expiry.split('/').map(Number)
      const d = new Date()
      return y > d.getFullYear() % 100 || (y === d.getFullYear() % 100 && m >= d.getMonth() + 1)
    })()

  const paymentValid =
    method === 'yape'
      ? /^9\d{8}$/.test(form.phone) && form.otp.length === 6
      : cardValid

  // Manejador: Registro inicial en Supabase Auth
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setErrorMessage(null)
    setLoading(true)
    try {
      const authResponse = await registerAdminUser(form.email, form.password)
      if (authResponse.user) {
        setUserId(authResponse.user.id)
        if (authResponse.session || authResponse.user.email_confirmed_at) {
          setStep(3)
        } else {
          setStep(2)
          setCooldown(60)
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al registrar credenciales.')
    } finally {
      setLoading(false)
    }
  }

  // Manejador: Comprobación manual de correo
  async function handleManualCheck() {
    setLoading(true)
    setErrorMessage(null)
    try {
      const res = await checkEmailVerified()
      if (res.verified && res.userId) {
        setUserId(res.userId)
        setStep(3)
      } else {
        setErrorMessage('Tu correo aún no figura como verificado. Abre el enlace que enviamos a tu bandeja.')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error comprobando verificación.')
    } finally {
      setLoading(false)
    }
  }

  // Manejador: Reenviar correo de confirmación
  async function handleResend() {
    if (cooldown > 0) return
    setErrorMessage(null)
    try {
      await resendVerificationEmail(form.email)
      setCooldown(60)
    } catch (err: any) {
      setErrorMessage(err.message || 'Error reenviando correo.')
    }
  }

  // Manejador: Búsqueda de RUC en dos pasos (Anti-duplicidad en Supabase + SUNAT Decolecta)
  async function handleSearchRuc() {
    if (form.document.length !== 11) {
      setDocFeedback('El RUC debe contener exactamente 11 dígitos numéricos.')
      return
    }

    setSearchingDoc(true)
    setDocFeedback('')
    setErrorMessage(null)

    try {
      // 1. Validar duplicidad en Supabase
      const isAvailable = await checkRucAvailability(form.document)
      if (!isAvailable) {
        setVerifiedDoc(false)
        setRucAvailable(false)
        setDocFeedback('Este RUC ya se encuentra registrado en el sistema. Ingresa un número distinto o inicia sesión.')
        return
      }

      setRucAvailable(true)

      // 2. Consulta oficial a SUNAT (con bypass local si es RUC_DEMO)
      const res = await buscarDocumentoFiscal(form.document)
      update('businessName', res.nombre)
      setVerifiedDoc(true)
      if (form.document === RUC_DEMO) {
        setDocFeedback(`✓ RUC de Prueba UTP detectado: ${res.nombre}`)
      } else {
        setDocFeedback(`✓ Razón social verificada ante SUNAT: ${res.nombre}`)
      }
    } catch (err: any) {
      setVerifiedDoc(false)
      setDocFeedback(err.message || 'No se pudo consultar el RUC ingresado.')
    } finally {
      setSearchingDoc(false)
    }
  }

  // Manejador: Aprovisionamiento atómico tras pago o confirmación de Trial
  async function handleFinalizeProvisioning() {
    if (!userId) {
      setErrorMessage('No se encontró una sesión activa de usuario. Reinicia el registro.')
      return
    }

    setLoading(true)
    setErrorMessage(null)

    try {
      const cleanBusiness = form.businessName.trim() || form.email.split('@')[0].toUpperCase()
      const tx = await executeProvisioning({
        userId,
        businessName: cleanBusiness,
        phone: form.phone || undefined,
        plan: currentPlan,
        method: isTrial ? 'TRIAL' : method === 'yape' ? 'YAPE' : 'TARJETA',
        ruc: form.document.length === 11 ? form.document : undefined,
        cardLastFour: method === 'card' && !isTrial ? form.card.slice(-4) : undefined,
        yapePhone: method === 'yape' && !isTrial ? form.phone : undefined
      })
      setResult(tx)
    } catch (err: any) {
      setErrorMessage(err.message || 'Error en el aprovisionamiento de la base de datos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 backdrop-blur-sm p-4">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[5px] border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">

        {/* Cabecera compacta */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-5 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
          <div className="flex min-w-0 items-center gap-2.5">
            <h2 className="truncate text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
              {result ? 'Registro completado' : 'Suscripción'}
            </h2>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-[5px] border border-emerald-600/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {isTrial ? 'Prueba 14 días' : `Plan ${selectedPlan.name} · S/ ${selectedPlan.price}/mes`}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {!result && step > 0 && (
              <span className="font-mono text-[11px] text-slate-500">
                Paso {step === 4 ? 3 : step === 3 ? 2 : 1} de 3
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="grid h-7 w-7 place-items-center rounded-[5px] border border-slate-200 text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 flex items-center gap-2 border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {result ? (
            /* PANTALLA DE ÉXITO */
            <section className="py-1">
              <div className="text-center">
                <CheckCircle2 className="mx-auto text-emerald-600" size={40} strokeWidth={1.5} />
                <h3 className="mt-3 text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Cuenta Activada Correctamente</h3>
                <p className="mt-1 text-sm text-slate-500">Tu comercio y suscripción están aprovisionados.</p>
              </div>

              {/* Comprobante digital troquelado */}
              <div className="relative mt-6 rounded-[5px] border border-slate-200 bg-slate-50 shadow-sm dark:border-slate-700 dark:bg-slate-800/40">
                <div className="h-1.5 rounded-t-[4px] bg-gradient-to-r from-emerald-500 via-teal-500 to-slate-900" aria-hidden="true" />
                <div className="flex items-center justify-between px-4 pb-3 pt-4">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-slate-500">Comprobante digital</span>
                  {isTrial ? (
                    <span className="inline-flex items-center gap-1 rounded-[5px] bg-blue-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                      <Check size={11} strokeWidth={2.5} /> PRUEBA ACTIVA
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-[5px] bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                      <Check size={11} strokeWidth={2.5} /> PAGADO
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-3 px-4 pb-4">
                  <p className="break-all font-mono text-sm font-semibold text-slate-900 dark:text-white">{result.id}</p>
                  <CopyButton value={result.id} />
                </div>

                <div className="relative border-t border-dashed border-slate-300 dark:border-slate-600">
                  <span className="ticket-notch l" />
                  <span className="ticket-notch r" />
                </div>

                <dl className="space-y-2.5 px-4 py-4 font-mono text-xs">
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Razón social</dt>
                    <dd className="break-words text-right font-semibold text-slate-900 dark:text-white">{result.businessName}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">RUC</dt>
                    <dd className="text-right text-slate-900 dark:text-white">{form.document.length === 11 ? form.document : '—'}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Correo</dt>
                    <dd className="break-all text-right text-slate-900 dark:text-white">{result.email}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Plan</dt>
                    <dd className="text-right font-semibold uppercase text-slate-900 dark:text-white">{result.plan}</dd>
                  </div>
                </dl>
              </div>

              <a
                href={ADMIN_URL}
                className="btn-cta group mt-6 flex w-full items-center justify-center gap-2 py-3"
              >
                Ingresar al Panel de Despacho
                <ExternalLink size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </section>
          ) : step === 0 ? (
            /* PASO 0: SELECTOR DE PLAN */
            <section className="space-y-3">
              <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Selecciona tu Plan</h3>
              <p className="text-sm text-slate-500">Puedes cambiar de plan en cualquier momento.</p>
              {plans.map(p => {
                const active = currentPlan === p.id
                return (
                  <div
                    key={p.id}
                    onClick={() => setCurrentPlan(p.id)}
                    className={`relative cursor-pointer rounded-[5px] border p-3.5 transition-all ${active
                      ? 'border-emerald-600 bg-emerald-50/30 ring-2 ring-emerald-500/20 dark:bg-emerald-950/20'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-sm dark:border-slate-800'
                      }`}
                  >
                    {active && (
                      <span className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-emerald-600 text-white shadow-sm">
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                          {p.name}
                          {p.id === 'growth' && (
                            <span className="rounded-[5px] bg-emerald-600 px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-wider text-white">RECOMENDADO</span>
                          )}
                        </p>
                        <p className="text-xs text-slate-500">{p.description}</p>
                      </div>
                      <span className="font-mono text-sm font-semibold text-slate-900 dark:text-white">
                        {p.price === 0 ? 'S/ 0' : `S/ ${p.price}/mes`}
                      </span>
                    </div>
                  </div>
                )
              })}
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn-primary mt-4 w-full py-3"
              >
                Continuar con Plan {selectedPlan.name}
              </button>
            </section>
          ) : step === 1 ? (
            /* PASO 1: CREDENCIALES */
            <form onSubmit={handleRegister}>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Credenciales del Administrador</h3>
              <p className="text-xs text-slate-500 mt-1">Con esta cuenta administrarás los pedidos y la flota.</p>

              <div className="mt-4">
                <label className="field-label">Correo Corporativo</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => update('email', e.target.value)}
                  placeholder="admin@tucomercio.pe"
                  className="field bg-white text-slate-900 border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 dark:bg-slate-900 dark:border-slate-700"
                />
              </div>

              <div className="mt-4">
                <label className="field-label">Contraseña</label>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={e => update('password', e.target.value)}
                  placeholder="Mínimo 8 caracteres seguros"
                  className="field bg-white text-slate-900 border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 dark:bg-slate-900 dark:border-slate-700"
                />
              </div>

              {/* Indicadores de requisitos de contraseña */}
              <div className="mt-3 grid grid-cols-2 gap-1.5 border border-slate-200 bg-slate-50 p-2.5 text-[11px] dark:border-slate-800 dark:bg-slate-800/40">
                <div className={`flex items-center gap-1 ${passLength ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                  <Check size={12} /> 8+ caracteres
                </div>
                <div className={`flex items-center gap-1 ${passUpper ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                  <Check size={12} /> Mayúscula
                </div>
                <div className={`flex items-center gap-1 ${passLower ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                  <Check size={12} /> Minúscula
                </div>
                <div className={`flex items-center gap-1 ${passNumber ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                  <Check size={12} /> Número
                </div>
                <div className={`col-span-2 flex items-center gap-1 ${passSpecial ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                  <Check size={12} /> Símbolo especial (!@#$%^&*)
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                {!initialPlan && (
                  <button type="button" onClick={() => setStep(0)} className="btn-secondary py-3 px-4 text-xs">
                    Atrás
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!credentialsValid || loading}
                  className="btn-primary w-full flex items-center justify-center gap-2 bg-slate-900 py-3 text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : 'Registrar y Continuar →'}
                </button>
              </div>
            </form>
          ) : step === 2 ? (
            /* PASO 2: ESPERA DE VALIDACIÓN POR CORREO */
            <section className="text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60">
                <Mail size={24} />
              </div>

              <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">Confirma tu correo electrónico</h3>
              <p className="mt-1 text-xs text-slate-500">
                Enviamos un enlace de validación a:
              </p>
              <p className="mt-1 font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 py-1 px-2 inline-block">
                {form.email}
              </p>

              <div className="mt-6 space-y-2">
                <button
                  type="button"
                  onClick={handleManualCheck}
                  disabled={loading}
                  className="btn-primary flex items-center justify-center gap-2 w-full py-3"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : 'Ya confirmé mi correo'}
                </button>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    disabled={cooldown > 0}
                    onClick={handleResend}
                    className="btn-secondary flex items-center justify-center gap-1.5 py-2.5 text-xs disabled:opacity-40"
                  >
                    <RefreshCw size={13} /> {cooldown > 0 ? `Reenviar en ${cooldown}s` : 'Reenviar enlace'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="btn-secondary py-2.5 text-xs text-slate-600"
                  >
                    Corregir correo
                  </button>
                </div>
              </div>
            </section>
          ) : step === 3 ? (
            /* PASO 3: IDENTIFICACIÓN FISCAL (100% RUC) */
            <section>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Identificación Fiscal del Comercio</h3>
              <p className="text-xs text-slate-500 mt-1">
                {isTrial
                  ? 'La prueba gratuita requiere RUC verificado ante SUNAT de forma obligatoria.'
                  : 'Ingresa el RUC de 11 dígitos para autocompletar la razón social.'}
              </p>

              <div className="mt-4">
                <label className="field-label">
                  RUC (11 dígitos) {isTrial && <span className="text-rose-500">*</span>}
                </label>
                <div className="flex gap-2">
                  <input
                    value={form.document}
                    onChange={e => {
                      update('document', onlyNumbers(e.target.value, 11))
                      setVerifiedDoc(false)
                      setRucAvailable(null)
                      setDocFeedback('')
                    }}
                    placeholder="Ej: 20601234567 o 20000000001"
                    className="field font-mono"
                  />
                  <button
                    type="button"
                    disabled={searchingDoc || form.document.length !== 11}
                    onClick={handleSearchRuc}
                    className="btn-secondary grid w-12 place-items-center disabled:opacity-40"
                    title="Consultar RUC"
                  >
                    {searchingDoc ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
                  </button>
                </div>

                {docFeedback && (
                  <p className={`mt-1.5 text-xs font-mono ${rucAvailable === false ? 'text-rose-600 dark:text-rose-400' : verifiedDoc ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'}`}>
                    {docFeedback}
                  </p>
                )}
              </div>

              <div className="mt-4">
                <label className="field-label">Razón Social</label>
                <input
                  value={form.businessName}
                  onChange={e => update('businessName', e.target.value)}
                  disabled={verifiedDoc || isTrial}
                  placeholder={isTrial ? 'Se autocompleta con la consulta SUNAT' : 'Nombre de la empresa'}
                  className={`field ${verifiedDoc || isTrial ? 'bg-slate-100 dark:bg-slate-800 cursor-not-allowed text-slate-600' : ''}`}
                />
              </div>

              <button
                type="button"
                disabled={!fiscalValid || loading}
                onClick={() => {
                  if (isTrial) {
                    void handleFinalizeProvisioning()
                  } else {
                    setStep(4)
                  }
                }}
                className="btn-primary mt-6 w-full flex items-center justify-center gap-2 py-3 disabled:opacity-40"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : isTrial ? (
                  'Activar Prueba Gratuita de 14 Días →'
                ) : (
                  'Continuar al Pago →'
                )}
              </button>

              {!isTrial && (
                <button
                  type="button"
                  onClick={() => {
                    if (!form.businessName) update('businessName', form.email.split('@')[0].toUpperCase())
                    setStep(4)
                  }}
                  className="mt-3 block w-full text-center text-xs text-slate-400 hover:text-slate-600"
                >
                  Omitir validación fiscal por ahora
                </button>
              )}
            </section>
          ) : (
            /* PASO 4: PASARELA SIMULADA */
            <section>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Pago de Suscripción</h3>
              <p className="text-xs text-slate-500 mt-1">Plan {selectedPlan.name} · Total: S/ {selectedPlan.price}.00 PEN</p>

              <div className="mt-4 grid grid-cols-2 border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setMethod('yape')}
                  className={`flex items-center justify-center gap-2 py-2.5 text-xs font-medium ${method === 'yape' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950' : 'text-slate-600'
                    }`}
                >
                  <Smartphone size={15} /> Yape
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('card')}
                  className={`flex items-center justify-center gap-2 py-2.5 text-xs font-medium ${method === 'card' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950' : 'text-slate-600'
                    }`}
                >
                  <CreditCard size={15} /> Tarjeta
                </button>
              </div>

              {method === 'yape' ? (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="field-label">Celular Yape (9 dígitos)</label>
                    <input
                      value={form.phone}
                      onChange={e => update('phone', onlyNumbers(e.target.value, 9))}
                      placeholder="987654321"
                      className="field font-mono"
                    />
                  </div>
                  <div>
                    <label className="field-label">Código de Aprobación (OTP)</label>
                    <input
                      value={form.otp}
                      onChange={e => update('otp', onlyNumbers(e.target.value, 6))}
                      placeholder="6 dígitos numéricos"
                      className="field font-mono"
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="field-label">Número de Tarjeta</label>
                    <input
                      value={form.card.replace(/(\d{4})(?=\d)/g, '$1 ')}
                      onChange={e => update('card', onlyNumbers(e.target.value, 16))}
                      placeholder="4111 1111 1111 1111"
                      className="field font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="field-label">Vencimiento (MM/AA)</label>
                      <input
                        value={form.expiry}
                        onChange={e => update('expiry', onlyNumbers(e.target.value, 4).replace(/(\d{2})(\d)/, '$1/$2'))}
                        placeholder="12/28"
                        className="field font-mono"
                      />
                    </div>
                    <div>
                      <label className="field-label">CVV</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={3}
                        value={form.cvv}
                        onChange={e => update('cvv', onlyNumbers(e.target.value, 3))}
                        placeholder="123"
                        className="field font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-6">
                <button type="button" onClick={() => setStep(3)} className="btn-secondary py-3 px-4 text-xs">
                  Atrás
                </button>
                <button
                  type="button"
                  disabled={!paymentValid || loading}
                  onClick={handleFinalizeProvisioning}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-40"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : `Pagar S/ ${selectedPlan.price}`}
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}