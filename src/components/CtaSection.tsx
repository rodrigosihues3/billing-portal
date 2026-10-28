import { ArrowRight, ShieldCheck } from 'lucide-react'
import type { Plan } from '../types/billing'

interface CtaSectionProps {
    onStart: (plan: Plan) => void
}

export function CtaSection({ onStart }: CtaSectionProps) {
    return (
        <section className="border-t border-slate-200/80 bg-slate-50/50 py-16 sm:py-20 dark:border-slate-800/80 dark:bg-slate-900/30 transition-colors">
            <div className="page-shell">
                <div className="rounded-[5px] border border-slate-200 bg-white p-8 sm:p-12 shadow-sm dark:border-slate-800 dark:bg-slate-900 text-center max-w-3xl mx-auto">
                    <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                        Toma el control de tus repartos y deja de regalar tus márgenes.
                    </h2>

                    <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
                        Activa tu cuenta en menos de 2 minutos y empieza a despachar con tu propio equipo y sin comisiones por pedido.
                    </p>

                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                        <button
                            type="button"
                            onClick={() => onStart('growth')}
                            className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 rounded-[5px] px-6 py-3.5 text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md transition-all"
                        >
                            Contratar Plan Growth · S/ 199/mes
                            <ArrowRight size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={() => onStart('trial')}
                            className="btn-secondary w-full sm:w-auto rounded-[5px] px-6 py-3.5 text-xs sm:text-sm font-semibold transition-all hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            Probar 14 días gratis
                        </button>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-6 text-xs text-slate-500 font-mono">
                        <span className="flex items-center gap-1.5">
                            <ShieldCheck size={14} className="text-emerald-600" />
                            Sin tarjeta para la prueba
                        </span>
                        <span>·</span>
                        <span>0% comisión por venta</span>
                        <span>·</span>
                        <span>Cancela cuando quieras</span>
                    </div>
                </div>
            </div>
        </section>
    )
}
