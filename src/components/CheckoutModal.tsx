import { useEffect, useState } from 'react'
import {
  AlertCircle,
  Check,
  CheckCircle2,
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
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">

        {/* Cabecera y Barra de Progreso Contextual */}
        <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] tracking-wider text-emerald-700 dark:text-emerald-400 font-semibold uppercase">
              {result ? 'REGISTRO COMPLETADO' : `PASO ${step} · ${step === 0 ? 'PLAN' : step === 1 ? 'ACCESO' : step === 2 ? 'VERIFICACIÓN' : step === 3 ? 'COMERCIO' : 'PAGO'}`}
            </span>
            <button type="button" onClick={onClose} aria-label="Cerrar" className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
              <X size={18} />
            </button>
          </div>

          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
            <span className={step >= 1 ? 'font-semibold text-slate-900 dark:text-white' : ''}>1. Acceso</span>
            <span>→</span>
            <span className={step >= 3 ? 'font-semibold text-slate-900 dark:text-white' : ''}>2. Comercio</span>
            <span>→</span>
            <span className={step >= 4 || result ? 'font-semibold text-slate-900 dark:text-white' : ''}>3. Activación</span>
          </div>

          <div className="mt-3 inline-flex items-center gap-1.5 border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <span>Plan:</span>
            <strong className="font-semibold text-slate-900 dark:text-white">{selectedPlan.name}</strong>
            <span>({isTrial ? '14 días gratis' : `S/ ${selectedPlan.price}/mes`})</span>
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
            <section className="text-center py-2">
              <CheckCircle2 className="mx-auto text-emerald-600" size={46} strokeWidth={1.5} />
              <h3 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">Cuenta Activada Correctamente</h3>
              <p className="mt-1 text-sm text-slate-500">Tu comercio y suscripción están aprovisionados en Supabase.</p>

              <dl className="mt-6 border border-slate-200 text-left text-sm dark:border-slate-800">
                <div className="flex justify-between p-3 border-b border-slate-200 dark:border-slate-800">
                  <dt className="text-slate-500">Razón Social</dt>
                  <dd className="font-mono text-xs font-semibold text-slate-900 dark:text-white">{result.businessName}</dd>
                </div>
                <div className="flex justify-between p-3 border-b border-slate-200 dark:border-slate-800">
                  <dt className="text-slate-500">Correo Confirmado</dt>
                  <dd className="font-mono text-xs text-slate-900 dark:text-white">{result.email}</dd>
                </div>
                <div className="flex justify-between p-3 border-b border-slate-200 dark:border-slate-800">
                  <dt className="text-slate-500">Plan</dt>
                  <dd className="font-mono text-xs font-semibold uppercase text-slate-900 dark:text-white">{result.plan}</dd>
                </div>
                <div className="flex justify-between p-3">
                  <dt className="text-slate-500">Comprobante</dt>
                  <dd className="font-mono text-xs text-slate-900 dark:text-white">{result.id}</dd>
                </div>
              </dl>

              <a
                href={ADMIN_URL}
                className="btn-primary mt-6 flex items-center justify-center gap-2 w-full py-3"
              >
                Ingresar al Panel de Despacho <ExternalLink size={16} />
              </a>
            </section>
          ) : step === 0 ? (
            /* PASO 0: SELECTOR DE PLAN */
            <section className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Selecciona tu Plan</h3>
              {plans.map(p => (
                <div
                  key={p.id}
                  onClick={() => setCurrentPlan(p.id)}
                  className={`cursor-pointer border p-3.5 transition-all ${currentPlan === p.id
                    ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-800'
                    }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-sm text-slate-900 dark:text-white">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.description}</p>
                    </div>
                    <span className="font-mono text-sm font-semibold text-slate-900 dark:text-white">
                      {p.price === 0 ? 'S/ 0' : `S/ ${p.price}/mes`}
                    </span>
                  </div>
                </div>
              ))}
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
                  className="field"
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
                  className="field"
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
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-40"
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