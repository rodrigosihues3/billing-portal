import { useEffect, useState } from 'react'
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  CreditCard,
  ExternalLink,
  FileText,
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

const ADMIN_URL = import.meta.env.VITE_ADMIN_PANEL_URL || '/admin'

// Estándar RFC 5322 para validación de correo electrónico
const RFC5322_EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/

const ALPHA_NAME_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/

const initialForm: BillingForm = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  document: '',
  businessName: '',
  phone: '',
  otp: '',
  card: '',
  cardHolder: '',
  expiry: '',
  cvv: ''
}

const onlyNumbers = (v: string, max: number) => v.replace(/\D/g, '').slice(0, max)
const onlyAlphabetic = (v: string) => v.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '')

interface SubscriptionEmailPayload {
  customer_email: string
  customer_name: string
  plan_id: string
  plan_name: string
  amount: number
  order_number: string
  invoice_data?: {
    type: 'boleta' | 'factura'
    document_number: string
    business_name: string
  }
  app_url?: string
}

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
      className="inline-flex shrink-0 items-center gap-1 rounded-[5px] border border-slate-300 bg-white px-2.5 py-1 font-mono text-[10px] font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
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
  // Pasos del flujo principal:
  // 0: Selección de Plan (si se abrió sin plan previo)
  // 1: Paso 1 - Registro de Cuenta (Nombre, Email, Contraseña, Confirmar Contraseña)
  // 2: Paso 2 - Datos Fiscales Previos al Pago (RUC opcional y Razón Social)
  // 3: Paso 3 - Pasarela de Pago (Tarjeta / Yape o Transferencia)
  // 4: Paso 4 - Ticket Post-Pago y Comprobante Condicional
  const [currentPlan, setCurrentPlan] = useState<Plan>(initialPlan || 'growth')
  const [step, setStep] = useState<number>(initialPlan ? 1 : 0)
  const [form, setForm] = useState<BillingForm>(initialForm)

  // Ciclo de validaciones reactivas: ningún campo muestra error en estado pristine
  const [dirty, setDirty] = useState<Record<string, boolean>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // Estados de sesión y verificación de correo
  const [userId, setUserId] = useState<string | null>(null)
  const [awaitingEmailConfirmation, setAwaitingEmailConfirmation] = useState(false)
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Estados de validación fiscal en Paso 2 (RUC opcional)
  const [searchingDoc, setSearchingDoc] = useState(false)
  const [verifiedDoc, setVerifiedDoc] = useState(false)
  const [rucAvailable, setRucAvailable] = useState<boolean | null>(null)
  const [docFeedback, setDocFeedback] = useState('')
  const [hadPrePaymentRuc, setHadPrePaymentRuc] = useState(false)

  // Estados de pasarela (Paso 3) y ticket (Paso 4)
  const [method, setMethod] = useState<PaymentMethod>('card')
  const [result, setResult] = useState<Transaction | null>(null)

  // Estados del acordeón de comprobante condicional en Paso 4 (Caso B)
  const [invoiceAccordionOpen, setInvoiceAccordionOpen] = useState(false)
  const [invoiceType, setInvoiceType] = useState<'boleta' | 'factura'>('boleta')
  const [invoiceDoc, setInvoiceDoc] = useState('')
  const [invoiceName, setInvoiceName] = useState('')
  const [invoiceEmail, setInvoiceEmail] = useState('')
  const [invoiceSubmitting, setInvoiceSubmitting] = useState(false)
  const [invoiceEmitted, setInvoiceEmitted] = useState<{
    type: 'boleta' | 'factura'
    document_number: string
    business_name: string
    email: string
  } | null>(null)

  const selectedPlan = plans.find(p => p.id === currentPlan)!
  const isTrial = currentPlan === 'trial'

  const markDirty = (field: string) => setDirty(prev => (prev[field] ? prev : { ...prev, [field]: true }))
  const markTouched = (field: string) => setTouched(prev => (prev[field] ? prev : { ...prev, [field]: true }))
  const hasInteracted = (field: string) => Boolean(dirty[field] || touched[field])

  const update = (key: keyof BillingForm, value: string) => {
    markDirty(key)
    setForm(c => ({ ...c, [key]: value }))
  }

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
          if (awaitingEmailConfirmation) {
            setAwaitingEmailConfirmation(false)
            setStep(2)
          }
        }
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [awaitingEmailConfirmation])

  /* ──────────────────────────────────────────────────────────
     VALIDACIONES REACTIVAS Y DINÁMICAS POR PASO
  ────────────────────────────────────────────────────────── */

  // PASO 1: Registro de Cuenta
  const cleanNameLetters = form.name.replace(/\s+/g, '')
  const nameValid = cleanNameLetters.length >= 3 && ALPHA_NAME_REGEX.test(form.name.trim())

  const emailTrimmed = form.email.trim()
  const emailValid = RFC5322_EMAIL_REGEX.test(emailTrimmed)
  const getEmailFeedback = (): string => {
    if (!emailTrimmed) return 'Ingresa tu correo electrónico.'
    if (!emailTrimmed.includes('@')) return 'Falta el símbolo "@" en la estructura del correo.'
    const [localPart, domainPart] = emailTrimmed.split('@')
    if (!localPart) return 'Ingresa el nombre de usuario antes del símbolo "@".'
    if (!domainPart || !domainPart.includes('.')) {
      return 'Falta completar el dominio del correo (ej. @tuempresa.pe).'
    }
    const domainSegments = domainPart.split('.')
    if (domainSegments.some(seg => seg.length === 0) || domainSegments[domainSegments.length - 1].length < 2) {
      return 'La extensión del dominio es incompleta (ej. .pe, .com).'
    }
    return 'Estructura de correo inválida según formato RFC 5322.'
  }

  const passLength = form.password.length >= 8
  const passNumOrSpecial = /[0-9!@#$%^&*(),.?":{}|<>_\-+=/\\[\]~`]/.test(form.password)
  const passwordValid = passLength && passNumOrSpecial
  const confirmPasswordValid = form.confirmPassword.length > 0 && form.confirmPassword === form.password

  const step1Valid = nameValid && emailValid && passwordValid && confirmPasswordValid

  // PASO 2: Datos Fiscales Previos al Pago (RUC opcional)
  const rucStartsValid = /^(10|20)/.test(form.document)
  const rucValid = form.document.length === 11 && /^(10|20)\d{9}$/.test(form.document)
  const rucHasErrorOnBlur =
    Boolean(touched.document) &&
    (form.document.length !== 11 || !rucStartsValid || rucAvailable === false)

  const businessNameValid = form.businessName.trim().length >= 3
  // Si el usuario ingresó RUC válido, la Razón Social es obligatoria; si dejó el RUC vacío, es opcional
  const step2Valid =
    form.document.length === 0
      ? true
      : rucValid && rucAvailable !== false && businessNameValid

  // PASO 3: Pasarela de Pago
  const cardNumberValid = /^\d{16}$/.test(form.card)
  const cardHolderClean = form.cardHolder.replace(/\s+/g, '')
  const cardHolderValid =
    cardHolderClean.length >= 3 && ALPHA_NAME_REGEX.test(form.cardHolder.trim())

  const expiryFormatValid = /^(0[1-9]|1[0-2])\/\d{2}$/.test(form.expiry)
  const expiryNotExpired = (() => {
    if (!expiryFormatValid) return false
    const [m, y] = form.expiry.split('/').map(Number)
    const now = new Date()
    const currentYear = now.getFullYear() % 100
    const currentMonth = now.getMonth() + 1
    return y > currentYear || (y === currentYear && m >= currentMonth)
  })()
  const expiryValid = expiryFormatValid && expiryNotExpired

  const cvvValid = /^\d{3,4}$/.test(form.cvv)
  const cardPaymentValid = cardNumberValid && cardHolderValid && expiryValid && cvvValid

  const yapeOtpValid = /^\d{6,12}$/.test(form.otp)
  const step3Valid = method === 'card' ? cardPaymentValid : yapeOtpValid

  // PASO 4 (Caso B): Comprobante Condicional Inline
  const expectedInvoiceDocDigits = invoiceType === 'boleta' ? 8 : 11
  const invoiceDocValid =
    invoiceType === 'boleta'
      ? /^\d{8}$/.test(invoiceDoc)
      : /^(10|20)\d{9}$/.test(invoiceDoc)
  const invoiceDocErrorOnBlur =
    Boolean(touched.invoiceDoc) && !invoiceDocValid
  const invoiceNameValid = invoiceName.trim().length >= 3
  const invoiceEmailValid = RFC5322_EMAIL_REGEX.test(invoiceEmail.trim())
  const invoiceFormValid = invoiceDocValid && invoiceNameValid && invoiceEmailValid

  // Helper de clases dinámicas de borde para inputs (5px estricto)
  const getFieldClass = (field: string, isValid: boolean, extra = '') => {
    const interacted = hasInteracted(field)
    const stateClasses = !interacted
      ? 'border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700'
      : isValid
        ? 'border-emerald-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 dark:border-emerald-500'
        : 'border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-rose-500'

    return `field rounded-[5px] bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 ${stateClasses} ${extra}`
  }

  /* ──────────────────────────────────────────────────────────
     DESPACHO DE EDGE FUNCTION (EN SEGUNDO PLANO)
  ────────────────────────────────────────────────────────── */
  const triggerSubscriptionEmail = (payload: SubscriptionEmailPayload) => {
    void supabase.functions
      .invoke('send-subscription-email', {
        body: payload
      })
      .then(({ error }) => {
        if (error) {
          console.warn('Aviso: Edge Function send-subscription-email devolvió error:', error.message)
        }
      })
      .catch(err => {
        console.warn('Aviso: No se pudo invocar send-subscription-email en segundo plano:', err)
      })
  }

  /* ──────────────────────────────────────────────────────────
     MANEJADORES DE FLUJO
  ────────────────────────────────────────────────────────── */

  // Paso 1: Registro de cuenta
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!step1Valid) return

    setErrorMessage(null)
    setLoading(true)
    try {
      const authResponse = await registerAdminUser(form.email, form.password)
      if (authResponse.user) {
        setUserId(authResponse.user.id)
        setInvoiceEmail(form.email.trim())
        if (!form.cardHolder) {
          setForm(prev => ({ ...prev, cardHolder: prev.name.trim() }))
        }
        if (authResponse.session || authResponse.user.email_confirmed_at) {
          setAwaitingEmailConfirmation(false)
          setStep(2)
        } else {
          // Avanzamos al Paso 2 (Datos Fiscales) permitiendo continuar fluido
          setStep(2)
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrar credenciales.'
      setErrorMessage(msg)
    } finally {
      setLoading(false)
    }
  }

  // Comprobación manual de correo si se activa la vista de espera
  async function handleManualCheck() {
    setLoading(true)
    setErrorMessage(null)
    try {
      const res = await checkEmailVerified()
      if (res.verified && res.userId) {
        setUserId(res.userId)
        setAwaitingEmailConfirmation(false)
        setStep(2)
      } else {
        setErrorMessage('Tu correo aún no figura como verificado. Abre el enlace que enviamos a tu bandeja.')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error comprobando verificación.'
      setErrorMessage(msg)
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (cooldown > 0) return
    setErrorMessage(null)
    try {
      await resendVerificationEmail(form.email)
      setCooldown(60)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error reenviando correo.'
      setErrorMessage(msg)
    }
  }

  // Paso 2: Búsqueda de RUC (Anti-duplicidad en Supabase + SUNAT Decolecta)
  async function handleSearchRuc() {
    markTouched('document')
    if (!rucValid) {
      setDocFeedback('El RUC debe tener 11 dígitos numéricos e iniciar con 10 o 20.')
      return
    }

    setSearchingDoc(true)
    setDocFeedback('')
    setErrorMessage(null)

    try {
      const isAvailable = await checkRucAvailability(form.document)
      if (!isAvailable) {
        setVerifiedDoc(false)
        setRucAvailable(false)
        setDocFeedback('Este RUC ya se encuentra registrado en el sistema.')
        return
      }

      setRucAvailable(true)
      const res = await buscarDocumentoFiscal(form.document)
      update('businessName', res.nombre)
      markTouched('businessName')
      setVerifiedDoc(true)
      if (form.document === RUC_DEMO) {
        setDocFeedback(`✓ RUC de Prueba UTP detectado: ${res.nombre}`)
      } else {
        setDocFeedback(`✓ Razón social verificada ante SUNAT: ${res.nombre}`)
      }
    } catch (err: unknown) {
      setVerifiedDoc(false)
      const msg = err instanceof Error ? err.message : 'No se pudo consultar el RUC ingresado.'
      setDocFeedback(msg)
    } finally {
      setSearchingDoc(false)
    }
  }

  // Paso 3 -> Paso 4: Aprovisionamiento y envío de correo transaccional
  async function handleFinalizeProvisioning(withPreRuc?: boolean) {
    setLoading(true)
    setErrorMessage(null)

    const effectiveRuc =
      (withPreRuc ?? rucValid) && rucValid ? form.document : undefined
    const cleanBusiness =
      form.businessName.trim() ||
      form.name.trim() ||
      form.email.split('@')[0].toUpperCase()

    try {
      let tx: Transaction
      if (userId) {
        try {
          tx = await executeProvisioning({
            userId,
            businessName: cleanBusiness,
            phone: form.phone || undefined,
            plan: currentPlan,
            method: isTrial ? 'TRIAL' : method === 'yape' ? 'YAPE' : 'TARJETA',
            ruc: effectiveRuc,
            cardLastFour: method === 'card' && !isTrial ? form.card.slice(-4) : undefined,
            yapePhone: method === 'yape' && !isTrial ? form.phone : undefined
          })
        } catch (rpcError) {
          console.warn('Fallback local de ticket tras error de RPC:', rpcError)
          const txCode = `TX-${Math.random().toString(36).slice(2, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`
          tx = {
            id: txCode,
            businessName: cleanBusiness,
            email: form.email.trim(),
            plan: currentPlan
          }
        }
      } else {
        const txCode = `TX-${Math.random().toString(36).slice(2, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`
        tx = {
          id: txCode,
          businessName: cleanBusiness,
          email: form.email.trim(),
          plan: currentPlan
        }
      }

      const hasValidPreRuc = Boolean(effectiveRuc)
      setHadPrePaymentRuc(hasValidPreRuc)
      setInvoiceEmail(form.email.trim())
      setInvoiceName(form.name.trim())
      setResult(tx)
      setStep(4)

      // Invocar Edge Function en segundo plano
      triggerSubscriptionEmail({
        customer_email: form.email.trim(),
        customer_name: form.name.trim() || cleanBusiness,
        plan_id: currentPlan,
        plan_name: selectedPlan.name,
        amount: isTrial ? 0 : selectedPlan.price,
        order_number: tx.id,
        invoice_data: hasValidPreRuc
          ? {
              type: 'factura',
              document_number: effectiveRuc!,
              business_name: cleanBusiness
            }
          : undefined,
        app_url: ADMIN_URL
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error en el aprovisionamiento de la suscripción.'
      setErrorMessage(msg)
    } finally {
      setLoading(false)
    }
  }

  // Paso 4 (Caso B): Confirmar y Emitir Comprobante desde acordeón inline
  async function handleEmitInvoice(e: React.FormEvent) {
    e.preventDefault()
    markTouched('invoiceDoc')
    markTouched('invoiceName')
    markTouched('invoiceEmail')
    if (!invoiceFormValid || !result) return

    setInvoiceSubmitting(true)
    try {
      const cleanName = invoiceName.trim()
      const cleanEmail = invoiceEmail.trim()

      triggerSubscriptionEmail({
        customer_email: cleanEmail,
        customer_name: form.name.trim() || cleanName,
        plan_id: currentPlan,
        plan_name: selectedPlan.name,
        amount: isTrial ? 0 : selectedPlan.price,
        order_number: result.id,
        invoice_data: {
          type: invoiceType,
          document_number: invoiceDoc,
          business_name: cleanName
        },
        app_url: ADMIN_URL
      })

      await new Promise(r => setTimeout(r, 350))

      setInvoiceEmitted({
        type: invoiceType,
        document_number: invoiceDoc,
        business_name: cleanName,
        email: cleanEmail
      })
      setInvoiceAccordionOpen(false)
    } finally {
      setInvoiceSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 backdrop-blur-sm p-4"
    >
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[5px] border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        {/* Cabecera compacta */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-5 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
          <div className="flex min-w-0 items-center gap-2.5">
            <h2 className="truncate text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
              {step === 4 && result ? 'Ticket de Suscripción' : 'Suscripción'}
            </h2>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-[5px] border border-emerald-600/30 bg-emerald-50 px-2 py-0.5 font-mono text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-[5px] bg-emerald-500" />
              {isTrial ? 'Prueba 14 días (Plan Growth)' : `Plan ${selectedPlan.name} · S/ ${selectedPlan.price}/mes`}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {step > 0 && (
              <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                Paso {step} de 4
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
            <div className="mb-4 flex items-center gap-2 rounded-[5px] border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {awaitingEmailConfirmation ? (
            /* VISTA DE VERIFICACIÓN DE CORREO */
            <section className="text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-[5px] bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60">
                <Mail size={24} />
              </div>

              <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
                Confirma tu correo electrónico
              </h3>
              <p className="mt-1 text-xs text-slate-500">Enviamos un enlace de validación a:</p>
              <p className="mt-1 inline-block rounded-[5px] bg-slate-100 px-2.5 py-1 font-mono text-xs font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                {form.email}
              </p>

              <div className="mt-6 space-y-2">
                <button
                  type="button"
                  onClick={handleManualCheck}
                  disabled={loading}
                  className="btn-primary flex w-full items-center justify-center gap-2 rounded-[5px] py-3"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : 'Ya confirmé mi correo'}
                </button>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    disabled={cooldown > 0}
                    onClick={handleResend}
                    className="btn-secondary flex items-center justify-center gap-1.5 rounded-[5px] py-2.5 text-xs disabled:opacity-40"
                  >
                    <RefreshCw size={13} /> {cooldown > 0 ? `Reenviar en ${cooldown}s` : 'Reenviar enlace'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAwaitingEmailConfirmation(false)
                      setStep(1)
                    }}
                    className="btn-secondary rounded-[5px] py-2.5 text-xs text-slate-600"
                  >
                    Corregir correo
                  </button>
                </div>
              </div>
            </section>
          ) : step === 0 ? (
            /* PASO 0: SELECTOR DE PLAN */
            <section className="space-y-3">
              <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
                Selecciona tu Plan
              </h3>
              <p className="text-sm text-slate-500">
                Todos los planes incluyen conexión directa por API y despacho en tiempo real.
              </p>
              {plans.map(p => {
                const active = currentPlan === p.id
                return (
                  <div
                    key={p.id}
                    onClick={() => setCurrentPlan(p.id)}
                    className={`relative cursor-pointer rounded-[5px] border p-3.5 transition-all ${
                      active
                        ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20 dark:bg-emerald-950/20'
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-sm dark:border-slate-800'
                    }`}
                  >
                    {active && (
                      <span className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-[5px] bg-emerald-600 text-white shadow-sm">
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                          {p.name}
                          {p.id === 'growth' && (
                            <span className="rounded-[5px] bg-emerald-600 px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-wider text-white">
                              RECOMENDADO
                            </span>
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
                className="btn-primary mt-4 w-full rounded-[5px] py-3"
              >
                Continuar con {selectedPlan.name}
              </button>
            </section>
          ) : step === 1 ? (
            /* PASO 1: REGISTRO DE CUENTA */
            <form onSubmit={handleRegister} noValidate>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Paso 1 · Registro de Cuenta
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Configura las credenciales del administrador principal del comercio.
              </p>

              {/* Nombre */}
              <div className="mt-4">
                <label className="field-label">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => update('name', onlyAlphabetic(e.target.value))}
                  onBlur={() => markTouched('name')}
                  placeholder="Ej. Carlos Mendoza"
                  className={getFieldClass('name', nameValid)}
                />
                {hasInteracted('name') && !nameValid && (
                  <p className="mt-1 text-[11px] text-rose-500">
                    Ingresa al menos 3 caracteres alfabéticos (solo letras y espacios).
                  </p>
                )}
              </div>

              {/* Email RFC 5322 */}
              <div className="mt-3.5">
                <label className="field-label">Correo Corporativo</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => update('email', e.target.value)}
                  onBlur={() => markTouched('email')}
                  placeholder="admin@tucomercio.pe"
                  className={getFieldClass('email', emailValid)}
                />
                {hasInteracted('email') && (
                  <p
                    className={`mt-1 text-[11px] ${
                      emailValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                    }`}
                  >
                    {emailValid ? '✓ Formato de correo electrónico válido.' : getEmailFeedback()}
                  </p>
                )}
              </div>

              {/* Contraseña */}
              <div className="mt-3.5">
                <label className="field-label">Contraseña</label>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={e => update('password', e.target.value)}
                  onBlur={() => markTouched('password')}
                  placeholder="Mínimo 8 caracteres, 1 número o símbolo"
                  className={getFieldClass('password', passwordValid)}
                />
                {hasInteracted('password') && !passwordValid && (
                  <p className="mt-1 text-[11px] text-rose-500">
                    La contraseña requiere mínimo 8 caracteres y al menos 1 número o carácter especial.
                  </p>
                )}
              </div>

              {/* Confirmar Contraseña */}
              <div className="mt-3.5">
                <label className="field-label">Confirmar Contraseña</label>
                <input
                  type="password"
                  required
                  value={form.confirmPassword}
                  onChange={e => update('confirmPassword', e.target.value)}
                  onBlur={() => markTouched('confirmPassword')}
                  placeholder="Repite exactamente tu contraseña"
                  className={getFieldClass('confirmPassword', confirmPasswordValid)}
                />
                {hasInteracted('confirmPassword') && (
                  <p
                    className={`mt-1 text-[11px] ${
                      confirmPasswordValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                    }`}
                  >
                    {confirmPasswordValid
                      ? '✓ Las contraseñas coinciden exactamente.'
                      : 'La confirmación no coincide con la contraseña ingresada.'}
                  </p>
                )}
              </div>

              {/* Indicadores de seguridad de contraseña */}
              <div className="mt-3.5 grid grid-cols-2 gap-1.5 rounded-[5px] border border-slate-200 bg-slate-50 p-2.5 font-mono text-[11px] dark:border-slate-800 dark:bg-slate-800/40">
                <div
                  className={`flex items-center gap-1.5 ${
                    passLength ? 'font-medium text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                  }`}
                >
                  <Check size={12} /> 8+ caracteres
                </div>
                <div
                  className={`flex items-center gap-1.5 ${
                    passNumOrSpecial ? 'font-medium text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                  }`}
                >
                  <Check size={12} /> 1+ número o símbolo
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                {!initialPlan && (
                  <button
                    type="button"
                    onClick={() => setStep(0)}
                    className="btn-secondary rounded-[5px] px-4 py-3 text-xs"
                  >
                    Atrás
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!step1Valid || loading}
                  className="btn-primary flex w-full items-center justify-center gap-2 rounded-[5px] bg-slate-900 py-3 text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : 'Continuar a Datos Fiscales'}
                </button>
              </div>
            </form>
          ) : step === 2 ? (
            /* PASO 2: DATOS FISCALES PREVIOS AL PAGO (RUC OPCIONAL) */
            <section>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Paso 2 · Datos Fiscales Previos al Pago
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Ingresa tu RUC si deseas emitir Factura Electrónica automáticamente. Este paso es opcional.
              </p>

              <div className="mt-4">
                <label className="field-label">RUC del Comercio (Opcional)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.document}
                    onChange={e => {
                      update('document', onlyNumbers(e.target.value, 11))
                      setVerifiedDoc(false)
                      setRucAvailable(null)
                      setDocFeedback('')
                    }}
                    onBlur={() => markTouched('document')}
                    placeholder="Ej: 20601234567 o 10456789012"
                    className={`field rounded-[5px] font-mono ${
                      rucHasErrorOnBlur
                        ? 'border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-rose-500'
                        : rucValid
                          ? 'border-emerald-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 dark:border-emerald-500'
                          : 'border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700'
                    }`}
                  />
                  <button
                    type="button"
                    disabled={searchingDoc || !rucValid}
                    onClick={handleSearchRuc}
                    className="btn-secondary grid w-12 shrink-0 place-items-center rounded-[5px] disabled:opacity-40"
                    title="Consultar RUC en SUNAT"
                  >
                    {searchingDoc ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
                  </button>
                </div>

                {/* Contador dinámico en JetBrains Mono */}
                <div className="mt-1.5 flex items-center justify-between gap-2 font-mono text-[11px]">
                  <span
                    className={
                      rucHasErrorOnBlur
                        ? 'text-rose-500 font-semibold'
                        : rucValid
                          ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                          : 'text-slate-400'
                    }
                  >
                    [ {form.document.length} / 11 dígitos ]
                  </span>
                  {rucHasErrorOnBlur && (
                    <span className="text-right text-rose-500">
                      {rucAvailable === false
                        ? 'RUC ya registrado'
                        : 'Debe tener 11 dígitos e iniciar con 10 o 20'}
                    </span>
                  )}
                </div>

                {docFeedback && (
                  <p
                    className={`mt-1.5 font-mono text-xs ${
                      rucAvailable === false
                        ? 'text-rose-500'
                        : verifiedDoc
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600'
                    }`}
                  >
                    {docFeedback}
                  </p>
                )}
              </div>

              <div className="mt-4">
                <label className="field-label">
                  Razón Social {rucValid && <span className="text-rose-500">*</span>}
                </label>
                <input
                  type="text"
                  value={form.businessName}
                  onChange={e => update('businessName', e.target.value)}
                  onBlur={() => markTouched('businessName')}
                  placeholder={
                    rucValid
                      ? 'Ingresa o consulta la Razón Social en SUNAT'
                      : 'Opcional si no requieres factura ahora'
                  }
                  className={
                    rucValid
                      ? getFieldClass('businessName', businessNameValid)
                      : 'field rounded-[5px] border-slate-300 dark:border-slate-700'
                  }
                />
                {rucValid && hasInteracted('businessName') && !businessNameValid && (
                  <p className="mt-1 text-[11px] text-rose-500">
                    La Razón Social es obligatoria cuando el RUC es válido (mínimo 3 caracteres).
                  </p>
                )}
              </div>

              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-secondary rounded-[5px] px-4 py-3 text-xs"
                >
                  Atrás
                </button>
                <button
                  type="button"
                  disabled={!step2Valid || loading}
                  onClick={() => {
                    if (isTrial) {
                      void handleFinalizeProvisioning(rucValid)
                    } else {
                      setStep(3)
                    }
                  }}
                  className="btn-primary flex w-full items-center justify-center gap-2 rounded-[5px] py-3 disabled:opacity-40"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : isTrial ? (
                    'Activar Prueba Gratuita (14 Días)'
                  ) : (
                    'Continuar a Pasarela de Pago'
                  )}
                </button>
              </div>

              {!isTrial && (
                <button
                  type="button"
                  onClick={() => {
                    setForm(prev => ({ ...prev, document: '', businessName: '' }))
                    setTouched(prev => ({ ...prev, document: false, businessName: false }))
                    setDocFeedback('')
                    setStep(3)
                  }}
                  className="mt-3 block w-full rounded-[5px] py-1.5 text-center text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  Omitir RUC y continuar al pago
                </button>
              )}
            </section>
          ) : step === 3 ? (
            /* PASO 3: PASARELA DE PAGO */
            <section>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Paso 3 · Pasarela de Pago
              </h3>
              <p className="mt-1 font-mono text-xs text-slate-500">
                Plan {selectedPlan.name} · Total: S/ {selectedPlan.price}.00 (Incluye IGV)
              </p>

              {/* Selector de método de pago con esquinas 5px */}
              <div className="mt-4 grid grid-cols-2 gap-1.5 rounded-[5px] border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-800/60">
                <button
                  type="button"
                  onClick={() => setMethod('card')}
                  className={`flex items-center justify-center gap-2 rounded-[5px] py-2 text-xs font-semibold transition-all ${
                    method === 'card'
                      ? 'bg-slate-900 text-white shadow-xs dark:bg-emerald-600 dark:text-white'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                  }`}
                >
                  <CreditCard size={15} /> Tarjeta
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('yape')}
                  className={`flex items-center justify-center gap-2 rounded-[5px] py-2 text-xs font-semibold transition-all ${
                    method === 'yape'
                      ? 'bg-slate-900 text-white shadow-xs dark:bg-emerald-600 dark:text-white'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                  }`}
                >
                  <Smartphone size={15} /> Yape / Transferencia
                </button>
              </div>

              {method === 'card' ? (
                <div className="mt-4 space-y-3.5">
                  {/* Número de tarjeta */}
                  <div>
                    <label className="field-label">Número de Tarjeta</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.card.replace(/(\d{4})(?=\d)/g, '$1 ')}
                      onChange={e => update('card', onlyNumbers(e.target.value, 16))}
                      onBlur={() => markTouched('card')}
                      placeholder="4111 1111 1111 1111"
                      className={getFieldClass('card', cardNumberValid, 'font-mono')}
                    />
                    <div className="mt-1 flex items-center justify-between font-mono text-[11px]">
                      <span
                        className={
                          !hasInteracted('card')
                            ? 'text-slate-400'
                            : cardNumberValid
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-500'
                        }
                      >
                        [ {form.card.length} / 16 dígitos ]
                      </span>
                      {hasInteracted('card') && !cardNumberValid && (
                        <span className="text-rose-500">Ingresa los 16 dígitos numéricos</span>
                      )}
                    </div>
                  </div>

                  {/* Nombre del titular */}
                  <div>
                    <label className="field-label">Nombre del Titular</label>
                    <input
                      type="text"
                      value={form.cardHolder}
                      onChange={e => update('cardHolder', onlyAlphabetic(e.target.value))}
                      onBlur={() => markTouched('cardHolder')}
                      placeholder="Como figura en la tarjeta"
                      className={getFieldClass('cardHolder', cardHolderValid)}
                    />
                    {hasInteracted('cardHolder') && !cardHolderValid && (
                      <p className="mt-1 text-[11px] text-rose-500">
                        Ingresa el nombre alfabético del titular (mínimo 3 letras).
                      </p>
                    )}
                  </div>

                  {/* Expiración y CVV */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="field-label">Expiración (MM/AA)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={form.expiry}
                        onChange={e =>
                          update(
                            'expiry',
                            onlyNumbers(e.target.value, 4).replace(/(\d{2})(\d)/, '$1/$2')
                          )
                        }
                        onBlur={() => markTouched('expiry')}
                        placeholder="08/28"
                        className={getFieldClass('expiry', expiryValid, 'font-mono')}
                      />
                      {hasInteracted('expiry') && !expiryValid && (
                        <p className="mt-1 text-[11px] text-rose-500">
                          {!expiryFormatValid
                            ? 'Usa formato MM/AA (mes 01-12).'
                            : 'La tarjeta figura vencida.'}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="field-label">CVV</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={4}
                        value={form.cvv}
                        onChange={e => update('cvv', onlyNumbers(e.target.value, 4))}
                        onBlur={() => markTouched('cvv')}
                        placeholder="123"
                        className={getFieldClass('cvv', cvvValid, 'font-mono')}
                      />
                      {hasInteracted('cvv') && !cvvValid && (
                        <p className="mt-1 text-[11px] text-rose-500">CVV de 3 o 4 dígitos.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-3.5">
                  <div className="rounded-[5px] border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-slate-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-slate-300">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      Pago rápido por Yape o Transferencia Bancaria
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                      Realiza el abono por <strong className="font-mono">S/ {selectedPlan.price}.00</strong> e ingresa el código numérico de operación para validar tu suscripción.
                    </p>
                  </div>

                  <div>
                    <label className="field-label">Código de Operación (Mínimo 6 dígitos)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.otp}
                      onChange={e => update('otp', onlyNumbers(e.target.value, 12))}
                      onBlur={() => markTouched('otp')}
                      placeholder="Ej. 148920"
                      className={getFieldClass('otp', yapeOtpValid, 'font-mono')}
                    />
                    <div className="mt-1 flex items-center justify-between font-mono text-[11px]">
                      <span
                        className={
                          !hasInteracted('otp')
                            ? 'text-slate-400'
                            : yapeOtpValid
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-500'
                        }
                      >
                        [ {form.otp.length} / mín. 6 dígitos ]
                      </span>
                      {hasInteracted('otp') && !yapeOtpValid && (
                        <span className="text-rose-500">Obligatorio: mínimo 6 dígitos numéricos</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="field-label">Celular de contacto / Yape (Opcional)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.phone}
                      onChange={e => update('phone', onlyNumbers(e.target.value, 9))}
                      placeholder="987654321"
                      className="field rounded-[5px] font-mono"
                    />
                  </div>
                </div>
              )}

              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn-secondary rounded-[5px] px-4 py-3 text-xs"
                >
                  Atrás
                </button>
                <button
                  type="button"
                  disabled={!step3Valid || loading}
                  onClick={() => void handleFinalizeProvisioning()}
                  className="btn-primary flex w-full items-center justify-center gap-2 rounded-[5px] py-3 disabled:opacity-40"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    `Confirmar Pago · S/ ${selectedPlan.price}.00`
                  )}
                </button>
              </div>
            </section>
          ) : (
            /* PASO 4: TICKET POST-PAGO Y COMPROBANTE CONDICIONAL */
            result && (
              <section className="py-1">
                <div className="text-center">
                  <CheckCircle2 className="mx-auto text-emerald-600" size={40} strokeWidth={1.5} />
                  <h3 className="mt-3 text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
                    Suscripción Activada Correctamente
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Tu entorno de despacho y credenciales ya están operativos.
                  </p>
                </div>

                {/* Ticket Post-Pago */}
                <div className="relative mt-5 rounded-[5px] border border-slate-200 bg-slate-50 shadow-sm dark:border-slate-700 dark:bg-slate-800/40">
                  <div
                    className="h-1.5 rounded-t-[5px] bg-gradient-to-r from-emerald-600 via-emerald-500 to-slate-900"
                    aria-hidden="true"
                  />
                  <div className="flex items-center justify-between px-4 pb-2 pt-3.5">
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                      ID de Transacción / Ticket
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-[5px] bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                      <Check size={11} strokeWidth={2.5} /> {isTrial ? 'TRIAL ACTIVO' : 'PAGADO'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 px-4 pb-4">
                    <p className="break-all font-mono text-sm font-bold text-slate-900 dark:text-white">
                      {result.id}
                    </p>
                    <CopyButton value={result.id} />
                  </div>

                  <div className="relative border-t border-dashed border-slate-300 dark:border-slate-600">
                    <span className="ticket-notch l" />
                    <span className="ticket-notch r" />
                  </div>

                  <dl className="space-y-2 px-4 py-4 font-mono text-xs">
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Titular / Comercio</dt>
                      <dd className="break-words text-right font-semibold text-slate-900 dark:text-white">
                        {result.businessName}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Correo</dt>
                      <dd className="break-all text-right text-slate-900 dark:text-white">
                        {result.email}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Plan</dt>
                      <dd className="text-right font-semibold uppercase text-slate-900 dark:text-white">
                        {selectedPlan.name} (S/ {isTrial ? 0 : selectedPlan.price}.00)
                      </dd>
                    </div>
                  </dl>

                  {/* SECCIÓN DE COMPROBANTE CONDICIONAL DENTRO DEL TICKET */}
                  <div className="border-t border-slate-200/80 px-4 py-3.5 dark:border-slate-700/80">
                    {hadPrePaymentRuc ? (
                      /* CASO A: El usuario ya ingresó RUC en el Paso 2 */
                      <div className="flex items-start gap-2.5 rounded-[5px] border border-emerald-300 bg-emerald-50/80 p-3 text-xs text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
                        <FileText size={16} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <div>
                          <p className="font-semibold">
                            Factura Electrónica generada para RUC{' '}
                            <span className="font-mono">{form.document}</span> - {form.businessName}
                          </p>
                          <p className="mt-0.5 text-[11px] text-emerald-700 dark:text-emerald-300/90">
                            Enviada automáticamente a <span className="font-mono">{result.email}</span>.
                          </p>
                        </div>
                      </div>
                    ) : invoiceEmitted ? (
                      /* CASO B COMPLETADO: Comprobante emitido desde el acordeón inline */
                      <div className="flex items-start gap-2.5 rounded-[5px] border border-emerald-300 bg-emerald-50/80 p-3 text-xs text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
                        <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <div>
                          <p className="font-semibold">
                            {invoiceEmitted.type === 'factura'
                              ? 'Factura Electrónica'
                              : 'Boleta de Venta'}{' '}
                            emitida para{' '}
                            <span className="font-mono">
                              {invoiceEmitted.type === 'factura' ? 'RUC' : 'DNI'}{' '}
                              {invoiceEmitted.document_number}
                            </span>{' '}
                            - {invoiceEmitted.business_name}
                          </p>
                          <p className="mt-0.5 text-[11px] text-emerald-700 dark:text-emerald-300/90">
                            Comprobante despachado a <span className="font-mono">{invoiceEmitted.email}</span>.
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* CASO B: Acordeón desplegable inline "¿Deseas comprobante de pago?" */
                      <div>
                        <button
                          type="button"
                          onClick={() => setInvoiceAccordionOpen(prev => !prev)}
                          className="flex w-full items-center justify-between rounded-[5px] border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                        >
                          <span className="flex items-center gap-2">
                            <FileText size={15} className="text-emerald-600 dark:text-emerald-400" />
                            ¿Deseas comprobante de pago?
                          </span>
                          {invoiceAccordionOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </button>

                        {invoiceAccordionOpen && (
                          <form
                            onSubmit={handleEmitInvoice}
                            noValidate
                            className="mt-3 space-y-3 rounded-[5px] border border-slate-200 bg-white p-3.5 dark:border-slate-700 dark:bg-slate-900"
                          >
                            {/* Selector Boleta (DNI) | Factura (RUC) */}
                            <div className="grid grid-cols-2 gap-1.5 rounded-[5px] border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-800">
                              <button
                                type="button"
                                onClick={() => {
                                  setInvoiceType('boleta')
                                  setInvoiceDoc(prev => prev.slice(0, 8))
                                  setTouched(prev => ({ ...prev, invoiceDoc: false }))
                                }}
                                className={`rounded-[5px] py-1.5 text-xs font-semibold transition-all ${
                                  invoiceType === 'boleta'
                                    ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white'
                                    : 'text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                Boleta (DNI)
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setInvoiceType('factura')
                                  setTouched(prev => ({ ...prev, invoiceDoc: false }))
                                }}
                                className={`rounded-[5px] py-1.5 text-xs font-semibold transition-all ${
                                  invoiceType === 'factura'
                                    ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white'
                                    : 'text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                Factura (RUC)
                              </button>
                            </div>

                            {/* Documento con contador dinámico */}
                            <div>
                              <label className="field-label">
                                {invoiceType === 'boleta' ? 'Número de DNI' : 'Número de RUC'}
                              </label>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={invoiceDoc}
                                onChange={e => {
                                  markDirty('invoiceDoc')
                                  setInvoiceDoc(onlyNumbers(e.target.value, expectedInvoiceDocDigits))
                                }}
                                onBlur={() => markTouched('invoiceDoc')}
                                placeholder={
                                  invoiceType === 'boleta' ? '8 dígitos numéricos' : '11 dígitos (10 o 20...)'
                                }
                                className={`field rounded-[5px] font-mono ${
                                  invoiceDocErrorOnBlur
                                    ? 'border-rose-500 focus:border-rose-500'
                                    : invoiceDocValid
                                      ? 'border-emerald-500 focus:border-emerald-600'
                                      : 'border-slate-300 dark:border-slate-700'
                                }`}
                              />
                              <div className="mt-1 flex items-center justify-between font-mono text-[11px]">
                                <span
                                  className={
                                    invoiceDocErrorOnBlur
                                      ? 'text-rose-500 font-semibold'
                                      : invoiceDocValid
                                        ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                                        : 'text-slate-400'
                                  }
                                >
                                  [ {invoiceDoc.length} / {expectedInvoiceDocDigits} dígitos ]
                                </span>
                                {invoiceDocErrorOnBlur && (
                                  <span className="text-rose-500">
                                    {invoiceType === 'boleta'
                                      ? 'DNI requiere 8 dígitos'
                                      : 'RUC requiere 11 dígitos (10 o 20)'}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Nombre o Razón Social */}
                            <div>
                              <label className="field-label">
                                {invoiceType === 'boleta' ? 'Nombre Completo' : 'Razón Social'}
                              </label>
                              <input
                                type="text"
                                value={invoiceName}
                                onChange={e => {
                                  markDirty('invoiceName')
                                  setInvoiceName(e.target.value)
                                }}
                                onBlur={() => markTouched('invoiceName')}
                                placeholder={
                                  invoiceType === 'boleta'
                                    ? 'Nombre del titular'
                                    : 'Nombre oficial de la empresa'
                                }
                                className={getFieldClass('invoiceName', invoiceNameValid)}
                              />
                            </div>

                            {/* Correo electrónico de envío */}
                            <div>
                              <label className="field-label">Correo Electrónico de Envío</label>
                              <input
                                type="email"
                                value={invoiceEmail}
                                onChange={e => {
                                  markDirty('invoiceEmail')
                                  setInvoiceEmail(e.target.value)
                                }}
                                onBlur={() => markTouched('invoiceEmail')}
                                placeholder="facturacion@tuempresa.pe"
                                className={getFieldClass('invoiceEmail', invoiceEmailValid)}
                              />
                            </div>

                            <button
                              type="submit"
                              disabled={!invoiceFormValid || invoiceSubmitting}
                              className="flex w-full items-center justify-center gap-2 rounded-[5px] bg-emerald-600 py-2.5 text-xs font-bold text-white transition-colors hover:bg-emerald-500 disabled:opacity-40"
                            >
                              {invoiceSubmitting ? (
                                <Loader2 className="animate-spin" size={15} />
                              ) : (
                                'Confirmar y Emitir Comprobante'
                              )}
                            </button>
                          </form>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Botón Principal Post-Pago con clases exactas */}
                <a
                  href={ADMIN_URL}
                  className="group mt-6 flex w-full items-center justify-center gap-2 rounded-[5px] bg-slate-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-emerald-600 dark:text-white dark:hover:bg-emerald-500"
                >
                  Ingresar al Panel de Despacho
                  <ExternalLink
                    size={16}
                    className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </a>
              </section>
            )
          )}
        </div>
      </div>
    </div>
  )
}
