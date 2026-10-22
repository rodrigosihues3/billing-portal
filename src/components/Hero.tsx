import { ArrowRight, CheckCircle2, MapPinned } from 'lucide-react'
import type { Plan } from '../types/billing'

export function Hero({ onStart }: { onStart: (plan: Plan) => void }) {
    return (
        <section id="inicio" className="page-shell grid gap-12 py-16 lg:grid-cols-[1.1fr_.9fr] lg:py-24">
            <div>
                <p className="mb-6 inline-flex items-center gap-2 border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <CheckCircle2 size={14} /> 0% comisiones intermedias · Conserva el 100% de tus ventas directas
                </p>
                <h1 className="max-w-3xl text-4xl font-semibold leading-[1.05] tracking-[-.045em] sm:text-6xl text-slate-900 dark:text-white">
                    Tus repartos. Tus clientes. Sin comisiones abusivas.
                </h1>
                <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                    Coordina despachos, empaque de órdenes, flota de motorizados y seguimiento web desde un único panel centralizado. El cliente final monitorea su entrega en tiempo real sin tener que instalar aplicaciones.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <button
                        type="button"
                        onClick={() => onStart('growth')}
                        className="btn-primary flex items-center justify-center gap-2 px-5 py-3.5"
                    >
                        Contratar Plan Growth · S/ 199/mes <ArrowRight size={17} />
                    </button>
                    <button
                        type="button"
                        onClick={() => onStart('trial')}
                        className="btn-secondary px-5 py-3.5"
                    >
                        Probar 14 días gratis
                    </button>
                </div>
            </div>

            <div className="relative border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-700">
                    <span className="font-mono text-xs text-slate-500">ORDEN #A-1048</span>
                    <span className="flex items-center gap-1 font-mono text-xs text-emerald-700 dark:text-emerald-400">
                        <i className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> EN RUTA
                    </span>
                </div>
                <div className="relative mt-5 h-52 overflow-hidden border border-slate-200 bg-[#e8efe7] dark:border-slate-700">
                    <div className="absolute inset-0 opacity-50 map-grid" />
                    <div className="absolute left-[18%] top-[68%] h-3.5 w-3.5 rounded-full border-2 border-white bg-slate-900 shadow" />
                    <div className="absolute left-[63%] top-[30%] h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-600 shadow" />
                    <div className="absolute left-[24%] top-[35%] h-[2px] w-[39%] origin-left rotate-[-26deg] bg-emerald-600" />
                </div>
                <div className="mt-5 flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center bg-slate-900 text-white dark:bg-white dark:text-slate-950">
                        <MapPinned size={19} />
                    </span>
                    <div>
                        <p className="text-sm font-medium">Repartidor en trayecto final</p>
                        <p className="font-mono text-xs text-slate-500">Av. Arequipa 2190 · Lima</p>
                    </div>
                </div>
            </div>
        </section>
    )
}