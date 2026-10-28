import { Check, Info, ArrowRight } from 'lucide-react'
import type { Plan } from '../types/billing'

interface PricingProps {
    onSelect: (plan: Plan) => void
}

export function Pricing({ onSelect }: PricingProps) {
    const planItems = [
        {
            id: 'starter' as Plan,
            name: 'Starter',
            price: 99,
            description: 'Para negocios que inician su reparto propio por WhatsApp, mostrador o tienda web.',
            subtitle: 'Incluye toda la suite base:',
            features: [
                'Hasta 2 repartidores activos simultáneos',
                'Hasta 300 pedidos completados al mes',
                'Conexión directa por API con tu tienda web',
                'Panel de control administrativo general',
                'Módulo de preparación (tablero de despacho)',
                'App exclusiva para tus repartidores',
                'Enlace de seguimiento web con PIN de 4 dígitos'
            ],
            featured: false,
            cta: 'Contratar Starter'
        },
        {
            id: 'growth' as Plan,
            name: 'Growth',
            price: 199,
            description: 'Para negocios en expansión con volumen regular de entregas y flota activa.',
            subtitle: 'Todo lo de Starter, más:',
            features: [
                'Hasta 5 repartidores activos simultáneos',
                'Hasta 1,000 pedidos completados al mes',
                'Conexión directa por API y sincronización en tiempo real',
                'Asignación optimizada de repartidores',
                'Historial completo exportable de despachos',
                'Reportes operativos de tiempos y entregas'
            ],
            featured: true,
            badge: 'MÁS ELEGIDO',
            cta: 'Contratar Growth'
        },
        {
            id: 'enterprise' as Plan,
            name: 'Enterprise',
            price: 399,
            description: 'Para cadenas, franquicias o múltiples locales con flota amplia.',
            subtitle: 'Todo lo de Growth, más:',
            features: [
                'Repartidores activos ilimitados',
                'Hasta 3,000 pedidos completados al mes',
                'Gestión multisede para varias sucursales',
                'Prioridad en atención y soporte técnico directo',
                'Métricas operativas avanzadas por sede',
                'Acompañamiento en la puesta en marcha'
            ],
            featured: false,
            cta: 'Contratar Enterprise'
        }
    ]

    return (
        <section id="planes" className="page-shell py-16 sm:py-20 border-t border-slate-200/80 dark:border-slate-800/80">
            <div className="max-w-2xl">
                <span className="font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    TARIFAS PLANAS MENSUALES
                </span>
                <h2 className="mt-2.5 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                    Un plan adaptado a tu volumen. Sin cobros sorpresa.
                </h2>
                <p className="mt-3 text-base text-slate-600 dark:text-slate-300">
                    Elige el plan según la cantidad de motorizados y pedidos de tu operación. Todos los precios incluyen IGV.
                </p>
            </div>

            {/* Grid de 3 Planes */}
            <div className="mt-12 grid gap-6 lg:grid-cols-3 items-stretch">
                {planItems.map((plan) => {
                    return (
                        <article
                            key={plan.id}
                            className={`relative flex flex-col justify-between overflow-hidden rounded-[5px] border bg-white p-7 transition-all dark:bg-slate-900 ${plan.featured
                                    ? 'border-emerald-600 shadow-xl ring-2 ring-emerald-500/20 dark:border-emerald-500 lg:-translate-y-2'
                                    : 'border-slate-200 shadow-xs hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:hover:border-slate-700'
                                }`}
                        >
                            {plan.featured && (
                                <div className="absolute inset-x-0 top-0 h-1 bg-emerald-600" />
                            )}

                            <div>
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                                        {plan.name}
                                    </h3>
                                    {plan.featured && (
                                        <span className="rounded-[5px] bg-emerald-600 px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider text-white">
                                            {plan.badge}
                                        </span>
                                    )}
                                </div>

                                <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 min-h-[38px]">
                                    {plan.description}
                                </p>

                                <div className="my-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                                    <div className="flex items-baseline gap-1">
                                        <span className="font-mono text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                                            S/ {plan.price}
                                        </span>
                                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                            / mes
                                        </span>
                                    </div>
                                    <span className="mt-1 block text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
                                        Precio final (incluye IGV)
                                    </span>
                                </div>

                                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                                    {plan.subtitle}
                                </p>

                                <ul className="mt-3.5 space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-start gap-2.5">
                                            <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                                                <Check size={11} strokeWidth={2.5} />
                                            </span>
                                            <span className="leading-tight">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <button
                                type="button"
                                onClick={() => onSelect(plan.id)}
                                className={
                                    plan.featured
                                        ? 'btn-cta mt-8 w-full py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5'
                                        : 'mt-8 w-full rounded-[5px] border border-slate-300 bg-slate-100 py-3 text-xs sm:text-sm font-bold text-slate-800 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 transition-all'
                                }
                            >
                                {plan.cta}
                                <ArrowRight size={14} />
                            </button>
                        </article>
                    )
                })}
            </div>

            {/* Política de Límite de Pedidos Mensual */}
            <div className="mt-8 rounded-[5px] border border-slate-200 bg-slate-50/70 p-4 sm:p-5 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300 flex items-start gap-3">
                <Info size={18} className="text-slate-500 shrink-0 mt-0.5" />
                <div>
                    <strong className="text-slate-900 dark:text-white">¿Qué sucede si alcanzas el límite de pedidos de tu plan?</strong>
                    <p className="mt-1 leading-relaxed">
                        Al llegar al tope mensual, el sistema bloquea temporalmente la creación de nuevos pedidos para evitar cobros no autorizados. Tu acceso nunca se interrumpe: puedes seguir auditando el historial, consultando reportes y visualizando a tus repartidores hasta el inicio del próximo ciclo o al subir de plan en cualquier momento.
                    </p>
                </div>
            </div>

            {/* Banner de Prueba Gratuita (Equivalencia Plan Growth) */}
            <div className="mt-6 flex flex-col gap-4 rounded-[5px] border border-emerald-300/80 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between dark:border-emerald-800/80 dark:bg-slate-900">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="rounded-[5px] bg-emerald-100 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            14 DÍAS GRATIS
                        </span>
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">
                            100% Capacidades del Plan Growth
                        </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl">
                        La prueba gratuita de 14 días hereda el 100% de las capacidades del <strong>Plan Growth</strong>: hasta 1,000 pedidos al mes, 5 repartidores activos y conexión directa por API.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => onSelect('trial')}
                    className="shrink-0 rounded-[5px] border border-emerald-600 bg-emerald-50 px-5 py-3 text-xs sm:text-sm font-bold text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50 transition-colors"
                >
                    Probar 14 días gratis
                </button>
            </div>
        </section>
    )
}
