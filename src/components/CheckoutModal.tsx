import { useState } from 'react'
import { CheckCircle2, CreditCard, Loader2, Search, Smartphone, X } from 'lucide-react'
import { processOnboarding } from '../services/billingService'
import { buscarDocumentoFiscal } from '../services/decolectaService'
import { plans, type BillingForm, type PaymentMethod, type Plan, type Transaction } from '../types/billing'

const initial: BillingForm = {
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
  // Si no se pasó un plan previo (ej. clic en "Suscribirme" de la Navbar), inicia en paso 0
  const [currentPlan, setCurrentPlan] = useState<Plan>(initialPlan || 'growth')
  const [step, setStep] = useState<number>(initialPlan ? 1 : 0)

  const [form, setForm] = useState<BillingForm>(initial)
  const [verified, setVerified] = useState(false)
  const [searchingDoc, setSearchingDoc] = useState(false)
  const [docFeedback, setDocFeedback] = useState<string>('')

  const [method, setMethod] = useState<PaymentMethod>('yape')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Transaction | null>(null)

  const selected = plans.find(p => p.id === currentPlan)!
  const update = (key: keyof BillingForm, value: string) => setForm(c => ({ ...c, [key]: value }))

  // Validaciones de contraseña rigurosas
  const passHasMinLength = form.password.length >= 8
  const passHasUpper = /[A-Z]/.test(form.password)
  const passHasNumber = /[0-9]/.test(form.password)
  const passwordValid = passHasMinLength && passHasUpper && passHasNumber
  const credentialsValid = /\S+@\S+\.\S+/.test(form.email) && passwordValid

  // Validaciones fiscales y de tarjeta
  const fiscalValid = form.businessName.trim().length >= 3
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

  // Búsqueda en API Decolecta
  async function handleSearchDocument() {
    setDocFeedback('')
    setSearchingDoc(true)
    try {
      const res = await buscarDocumentoFiscal(form.document)
      update('businessName', res.nombre)
      setVerified(true)
      setDocFeedback(`✓ Razón social verificada (${res.tipo}): ${res.nombre}`)
    } catch (err: any) {
      setVerified(false)
      setDocFeedback(err.message || 'Error consultando documento.')
    } finally {
      setSearchingDoc(false)
    }
  }

  async function pay() {
    setLoading(true)
    try {
      const transaction = await processOnboarding({
        form,
        plan: currentPlan,
        method
      })
      setResult(transaction)
    } catch (error: any) {
      alert(error.message || 'Error procesando el registro en Supabase.')
    } finally {
      setLoading(false)
    }
  }

  const nextFromBusiness = () => {
    if (currentPlan === 'trial') {
      void pay()
    } else {
      setStep(3)
    }
  }

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 backdrop-blur-sm p-4">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">

        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div>
            <p className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400">
              {result ? 'CUENTA ACTIVADA' : `PASO ${step === 0 ? 'SELECCIÓN' : `${step} DE ${currentPlan === 'trial' ? 2 : 3}`}`}
            </p>
            <h2 className="font-semibold text-slate-900 dark:text-white">
              {result ? 'Registro Exitoso' : `Plan ${selected.name}`}
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {result ? (
            <Success result={result} />
          ) : step === 0 ? (
            /* PASO 0: ELEGIR PLAN CUANDO SE DA CLIC EN NAVBAR */
            <section className="space-y-4">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Elige tu plan de suscripción</h3>
              <p className="text-sm text-slate-500">Selecciona el plan antes de continuar con la creación de tu cuenta.</p>

              <div className="space-y-3 pt-2">
                {plans.map(p => (
                  <div
                    key={p.id}
                    onClick={() => setCurrentPlan(p.id)}
                    className={`cursor-pointer border p-4 transition-all ${currentPlan === p.id
                      ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20'
                      : 'border-slate-200 hover:border-slate-300 dark:border-slate-800'
                      }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-sm text-slate-900 dark:text-white">{p.name}</span>
                        <p className="text-xs text-slate-500 mt-0.5">{p.description}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-semibold text-sm text-slate-900 dark:text-white">
                          {p.price === 0 ? 'Gratis' : `S/ ${p.price}`}
                        </span>
                        {p.price > 0 && <span className="text-[10px] text-slate-400"> /mes</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn-primary mt-6 w-full py-3"
              >
                Continuar con Plan {selected.name} →
              </button>
            </section>
          ) : step === 1 ? (
            /* PASO 1: CREDENCIALES CON VALIDACIÓN ESTRICTA */
            <section>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Crea tu acceso de administrador</h3>
              <p className="mt-1 text-sm text-slate-500">Credenciales para gestionar despachos en el panel administrativo.</p>

              <Field
                label="Correo corporativo"
                type="email"
                value={form.email}
                onChange={v => update('email', v)}
                placeholder="nombre@negocio.pe"
              />

              <Field
                label="Contraseña"
                type="password"
                value={form.password}
                onChange={v => update('password', v)}
                placeholder="Mínimo 8 caracteres, 1 mayúscula y 1 número"
              />

              {/* Indicadores de requisitos de contraseña */}
              <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                <p className="font-medium text-slate-600 dark:text-slate-300">Requisitos de seguridad:</p>
                <div className={`flex items-center gap-1.5 ${passHasMinLength ? 'text-emerald-600' : 'text-slate-400'}`}>
                  <span>{passHasMinLength ? '✓' : '○'}</span> Mínimo 8 caracteres
                </div>
                <div className={`flex items-center gap-1.5 ${passHasUpper ? 'text-emerald-600' : 'text-slate-400'}`}>
                  <span>{passHasUpper ? '✓' : '○'}</span> Al menos una letra mayúscula
                </div>
                <div className={`flex items-center gap-1.5 ${passHasNumber ? 'text-emerald-600' : 'text-slate-400'}`}>
                  <span>{passHasNumber ? '✓' : '○'}</span> Al menos un número
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                {!initialPlan && (
                  <button type="button" onClick={() => setStep(0)} className="btn-secondary py-3 px-4 text-sm">
                    Atrás
                  </button>
                )}
                <button
                  type="button"
                  disabled={!credentialsValid}
                  onClick={() => setStep(2)}
                  className="btn-primary w-full py-3 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Continuar
                </button>
              </div>
            </section>
          ) : step === 2 ? (
            /* PASO 2: CONSULTA RUC/DNI */
            <section>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Identifica tu comercio</h3>
              <p className="mt-1 text-sm text-slate-500">Validamos tu documento fiscal para autocompletar la razón social.</p>

              <label className="field-label mt-4">RUC (11 dígitos) o DNI (8 dígitos)</label>
              <div className="flex gap-2">
                <input
                  value={form.document}
                  onChange={e => {
                    update('document', onlyNumbers(e.target.value, 11))
                    setVerified(false)
                    setDocFeedback('')
                  }}
                  className="field font-mono"
                  placeholder="Ej: 20601234567 o 74589632"
                />
                <button
                  type="button"
                  disabled={searchingDoc || (form.document.length !== 8 && form.document.length !== 11)}
                  onClick={handleSearchDocument}
                  className="btn-secondary grid w-12 place-items-center disabled:opacity-40"
                  title="Buscar en Decolecta"
                >
                  {searchingDoc ? <Loader2 className="animate-spin" size={17} /> : <Search size={17} />}
                </button>
              </div>

              {docFeedback && (
                <p className={`mt-2 text-xs font-mono ${verified ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {docFeedback}
                </p>
              )}

              <Field
                label="Nombre Comercial / Razón Social"
                value={form.businessName}
                onChange={v => update('businessName', v)}
                disabled={verified}
                placeholder="Se autocompleta con el buscador"
              />

              <div className="flex gap-2 mt-6">
                <button type="button" onClick={() => setStep(1)} className="btn-secondary py-3 px-4 text-sm">
                  Atrás
                </button>
                <button
                  type="button"
                  onClick={nextFromBusiness}
                  disabled={!fiscalValid}
                  className="btn-primary w-full py-3 disabled:opacity-40"
                >
                  {currentPlan === 'trial' ? 'Activar prueba' : 'Continuar al pago'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!form.businessName) update('businessName', form.email.split('@')[0].toUpperCase())
                  nextFromBusiness()
                }}
                className="mt-3 w-full text-center text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              >
                Omitir validación fiscal por ahora →
              </button>
            </section>
          ) : (
            /* PASO 3: PASARELA DE COBRO */
            <section>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Pago seguro</h3>
              <p className="mt-1 text-sm text-slate-500">Plan {selected.name} · S/ {selected.price}/mes</p>

              <div className="mt-6 grid grid-cols-2 border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setMethod('yape')}
                  className={`flex items-center justify-center gap-2 py-3 text-sm ${method === 'yape' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-medium' : 'text-slate-600 dark:text-slate-400'
                    }`}
                >
                  <Smartphone size={16} /> Yape
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('card')}
                  className={`flex items-center justify-center gap-2 py-3 text-sm ${method === 'card' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-medium' : 'text-slate-600 dark:text-slate-400'
                    }`}
                >
                  <CreditCard size={16} /> Tarjeta
                </button>
              </div>

              {method === 'yape' ? (
                <>
                  <Field
                    label="Celular Yape (9 dígitos)"
                    value={form.phone}
                    onChange={v => update('phone', onlyNumbers(v, 9))}
                    placeholder="9XX XXX XXX"
                  />
                  <Field
                    label="Código de aprobación para compras por Internet"
                    value={form.otp}
                    onChange={v => update('otp', onlyNumbers(v, 6))}
                    placeholder="6 dígitos numéricos"
                  />
                </>
              ) : (
                <>
                  <Field
                    label="Número de tarjeta (16 dígitos)"
                    value={form.card.replace(/(\d{4})(?=\d)/g, '$1 ')}
                    onChange={v => update('card', onlyNumbers(v, 16))}
                    placeholder="4111 1111 1111 1111"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="Vencimiento"
                      value={form.expiry}
                      onChange={v => update('expiry', onlyNumbers(v, 4).replace(/(\d{2})(\d)/, '$1/$2'))}
                      placeholder="MM/AA"
                    />
                    <Field
                      label="CVV"
                      value={form.cvv}
                      onChange={v => update('cvv', onlyNumbers(v, 3))}
                      placeholder="123"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-2 mt-6">
                <button type="button" onClick={() => setStep(2)} className="btn-secondary py-3 px-4 text-sm">
                  Atrás
                </button>
                <button
                  type="button"
                  disabled={!paymentValid || loading}
                  onClick={pay}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-40"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={17} /> Procesando pago con Supabase...
                    </>
                  ) : (
                    `Pagar S/ ${selected.price}`
                  )}
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  ...props
}: {
  label: string
  value: string
  onChange: (value: string) => void
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return (
    <label className="mt-4 block">
      <span className="field-label">{label}</span>
      <input value={value} onChange={e => onChange(e.target.value)} className="field" {...props} />
    </label>
  )
}

function Success({ result }: { result: Transaction }) {
  return (
    <section className="text-center py-2">
      <CheckCircle2 className="mx-auto text-emerald-600" size={45} strokeWidth={1.5} />
      <h3 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">Tu cuenta ha sido activada</h3>
      <p className="mt-2 text-sm text-slate-500">La organización y suscripción fueron aprovisionadas en Supabase.</p>

      <dl className="mt-6 border border-slate-200 text-left text-sm dark:border-slate-800">
        <Row label="Comercio" value={result.businessName} />
        <Row label="Correo Admin" value={result.email} />
        <Row label="Plan" value={plans.find(p => p.id === result.plan)?.name ?? ''} />
        <Row label="Comprobante" value={result.id} />
      </dl>

      <a
        href="http://localhost:3000/admin"
        className="btn-primary mt-6 block w-full py-3 text-center"
      >
        Ingresar al Panel de Despacho (localhost:3000) →
      </a>
    </section>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-200 p-3 last:border-0 dark:border-slate-800">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-mono text-right text-xs text-slate-900 dark:text-white font-medium">{value}</dd>
    </div>
  )
}