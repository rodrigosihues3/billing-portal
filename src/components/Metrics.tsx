import { useState } from 'react'
import { Check, X, TrendingUp } from 'lucide-react'

export function Metrics() {
    // Calculadora interactiva de ahorro
    const [monthlySales, setMonthlySales] = useState<number>(6000)
    const commissionRate = 0.25 // 25% tasa típica de apps de delivery
    const traditionalCommission = Math.round(monthlySales * commissionRate)
    const fixedPlanCost = 199 // Tarifa plana Plan Growth
    const netSavings = Math.max(0, traditionalCommission - fixedPlanCost)

    const comparisons = [
        {
            topic: 'Recepción y comandas',
            before: 'Mensajes de WhatsApp dispersos, comandas en papel y riesgo de pedidos duplicados u olvidados.',
            after: 'Panel unificado que registra y organiza cada orden con estatus claro en cocina y despacho.'
        },
        {
            topic: 'Atención y dudas del cliente',
            before: 'El cliente llama o escribe insistentemente preguntando "¿a qué hora llega mi pedido?".',
            after: 'Enlace web con mapa en tiempo real, tiempo estimado y nombre de su repartidor.'
        },
        {
            topic: 'Seguridad en la entrega',
            before: 'Entregas sin respaldo claro; confusiones sobre si el pedido fue recibido o no en puerta.',
            after: 'Código PIN de 4 dígitos generado para el cliente que el repartidor valida en su app.'
        },
        {
            topic: 'Comisiones por venta',
            before: 'Pagas entre 20% y 30% de comisión por cada orden a las aplicaciones intermediarias.',
            after: '0% comisión por pedido. Tarifa fija mensual sin sorpresas cuando tu volumen crece.'
        },
        {
            topic: 'Propiedad de tus clientes',
            before: 'Los datos quedan en manos del intermediario.',
            after: 'Base de datos 100% tuya y privada para comunicarte directamente.'
        }
    ]

    return (
        <section id="beneficios" className="page-shell py-16 sm:py-20">
            <div className="max-w-2xl">
                <h2 className="mt-2.5 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                    La diferencia entre depender de terceros y tener tu propia operación.
                </h2>
                <p className="mt-3 text-base text-slate-600 dark:text-slate-300">
                    Compara los problemas cotidianos del delivery tradicional frente a la tranquilidad de operar con un sistema propio.
                </p>
            </div>

            {/* Tabla Comparativa: Antes vs Con Delivery Tracker */}
            <div className="mt-10 overflow-hidden rounded-[5px] border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="grid grid-cols-1 divide-y divide-slate-200 md:grid-cols-2 md:divide-x md:divide-y-0 dark:divide-slate-800">
                    {/* Columna: Con apps intermediarias / Manual */}
                    <div className="p-6 sm:p-8 bg-slate-50/60 dark:bg-slate-950/40">
                        <div className="flex items-center gap-2 pb-5 border-b border-slate-200 dark:border-slate-800">
                            <span className="grid h-7 w-7 place-items-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                                <X size={15} strokeWidth={2.5} />
                            </span>
                            <span className="font-display text-base font-bold text-slate-800 dark:text-slate-200">
                                Con apps tradicionales o gestión informal
                            </span>
                        </div>
                        <ul className="mt-6 space-y-6">
                            {comparisons.map((item) => (
                                <li key={item.topic} className="space-y-1">
                                    <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                        {item.topic}
                                    </p>
                                    <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                        {item.before}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Columna: Con Delivery Tracker */}
                    <div className="p-6 sm:p-8 bg-emerald-50/20 dark:bg-emerald-950/10">
                        <div className="flex items-center gap-2 pb-5 border-b border-emerald-200/80 dark:border-emerald-900/60">
                            <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-600 text-white shadow-xs">
                                <Check size={15} strokeWidth={2.5} />
                            </span>
                            <span className="font-display text-base font-bold text-emerald-950 dark:text-emerald-200">
                                Con Delivery Tracker en tu negocio
                            </span>
                        </div>
                        <ul className="mt-6 space-y-6">
                            {comparisons.map((item) => (
                                <li key={item.topic} className="space-y-1">
                                    <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                                        {item.topic}
                                    </p>
                                    <p className="text-xs sm:text-sm leading-relaxed font-medium text-slate-800 dark:text-slate-200">
                                        {item.after}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Micro-calculadora interactiva de ahorro en comisiones */}
            <div className="mt-10 rounded-[5px] border border-slate-200 bg-white p-6 sm:p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="max-w-xl">
                        <h3 className="mt-1.5 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                            ¿Cuánto dinero conservas al eliminar el 25% de comisión?
                        </h3>
                        <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                            Ajusta el volumen mensual de ventas que despachas a domicilio y mira la diferencia frente a la tarifa plana del Plan Growth (S/ 199/mes).
                        </p>
                    </div>

                    <div className="w-full lg:w-auto flex flex-col items-start lg:items-end">
                        <span className="text-[11px] font-mono text-slate-400">Ventas estimadas por mes</span>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono text-2xl font-bold text-slate-900 dark:text-white">
                                S/ {monthlySales.toLocaleString('es-PE')}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mt-6">
                    <label htmlFor="sales-slider" className="sr-only">
                        Ventas mensuales estimadas
                    </label>
                    <input
                        id="sales-slider"
                        type="range"
                        min="1000"
                        max="25000"
                        step="500"
                        value={monthlySales}
                        onChange={(e) => setMonthlySales(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 dark:bg-slate-800"
                    />
                    <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-2">
                        <span>S/ 1,000</span>
                        <span>S/ 10,000</span>
                        <span>S/ 25,000</span>
                    </div>
                </div>

                {/* Métricas resultantes del ahorro */}
                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-[4px] border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            Comisión típica que te cobran otras apps (25%)
                        </p>
                        <p className="mt-1.5 font-mono text-xl font-bold text-rose-600 dark:text-rose-400">
                            - S/ {traditionalCommission.toLocaleString('es-PE')}
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-400">Dinero que se descuenta de tus ventas</p>
                    </div>

                    <div className="rounded-[4px] border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            Costo fijo único en nuestra app Delivery Tracker
                        </p>
                        <p className="mt-1.5 font-mono text-xl font-bold text-slate-900 dark:text-white">
                            S/ {fixedPlanCost}
                            <span className="text-xs font-normal text-slate-400"> /mes</span>
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-400">Tarifa fija Growth (incluye IGV)</p>
                    </div>

                    <div className="rounded-[4px] border border-emerald-300 bg-emerald-50/70 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
                        <div className="flex items-center gap-1.5">
                            <TrendingUp size={14} className="text-emerald-600 dark:text-emerald-400" />
                            <p className="text-[11px] font-bold text-emerald-900 dark:text-emerald-300">
                                Ganancia conservada
                            </p>
                        </div>
                        <p className="mt-1.5 font-mono text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                            + S/ {netSavings.toLocaleString('es-PE')}
                            <span className="text-xs font-normal text-emerald-600 dark:text-emerald-400"> /mes</span>
                        </p>
                        <p className="mt-0.5 text-[10px] text-emerald-800 dark:text-emerald-400">Margen neto adicional para tu negocio</p>
                    </div>
                </div>
            </div>
        </section>
    )
}
