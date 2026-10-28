import { ClipboardList, ChefHat, Bike, Navigation, ShieldCheck } from 'lucide-react'

export function Modules() {
    const steps = [
        {
            num: '01',
            role: 'Administrador / Ventas',
            title: 'Recibido',
            desc: 'La orden entra automáticamente desde tu tienda web o es registrada manualmente por tu equipo en el panel central.',
            icon: ClipboardList,
            badge: 'Panel de control',
            badgeClass: 'text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-300'
        },
        {
            num: '02',
            role: 'Cocina / Almacén',
            title: 'En preparación',
            desc: 'El área de despacho visualiza la orden en el tablero de preparación y la alista en cocina o empaque sin papeles perdidos.',
            icon: ChefHat,
            badge: 'Módulo de preparación',
            badgeClass: 'text-amber-800 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/60'
        },
        {
            num: '03',
            role: 'Repartidor',
            title: 'Despacho asignado',
            desc: 'Al pasar el pedido a despacho, tus repartidores reciben la alerta en su app móvil y toman la entrega en un toque.',
            icon: Bike,
            badge: 'App del repartidor',
            badgeClass: 'text-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/60'
        },
        {
            num: '04',
            role: 'Repartidor en ruta',
            title: 'En camino',
            desc: 'El motorizado abre la ruta en Google Maps y tu cliente visualiza el desplazamiento del repartidor en el mapa web en vivo.',
            icon: Navigation,
            badge: 'Ruta satelital en vivo',
            badgeClass: 'text-blue-800 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60'
        },
        {
            num: '05',
            role: 'Cliente y Repartidor',
            title: 'Entregado con PIN',
            desc: 'El cliente dicta su código seguro de 4 dígitos. La entrega se valida y se actualiza al instante en todo el sistema.',
            icon: ShieldCheck,
            badge: 'Validación en puerta',
            badgeClass: 'text-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/60'
        }
    ]

    return (
        <section id="como-funciona" className="border-y border-slate-200/90 bg-slate-50/60 py-16 sm:py-20 dark:border-slate-800 dark:bg-slate-900/40 transition-colors">
            <div className="page-shell">
                <div className="max-w-2xl">
                    <span className="font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                        FLUJO OPERATIVO COMPLETO
                    </span>
                    <h2 className="mt-2.5 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                        Cómo viaja cada pedido: del ingreso a la entrega final.
                    </h2>
                    <p className="mt-3 text-base text-slate-600 dark:text-slate-300">
                        Cada persona de tu equipo sabe con exactitud qué hacer en cada segundo. Sin llamadas innecesarias ni desorden.
                    </p>
                </div>

                {/* Secuencia de 5 pasos */}
                <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    {steps.map(({ num, role, title, desc, icon: Icon, badge, badgeClass }) => (
                        <article
                            key={title}
                            className="relative flex flex-col justify-between rounded-[5px] border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900/80 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                        >
                            <div>
                                <div className="flex items-center justify-between">
                                    <span className="font-mono text-xs font-bold text-slate-400 dark:text-slate-500">
                                        PASO {num}
                                    </span>
                                    <span className="grid h-8 w-8 place-items-center rounded-[4px] bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                                        <Icon size={16} strokeWidth={1.75} />
                                    </span>
                                </div>

                                <span className="mt-3 block font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                                    {role}
                                </span>
                                <h3 className="mt-1 text-base font-bold text-slate-900 dark:text-white">
                                    {title}
                                </h3>
                                <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300">
                                    {desc}
                                </p>
                            </div>

                            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                                <span className={`inline-block rounded-[3px] px-2 py-0.5 font-mono text-[9px] font-semibold ${badgeClass}`}>
                                    {badge}
                                </span>
                            </div>
                        </article>
                    ))}
                </div>

                {/* Nota de sincronización en tiempo real sin jerga técnica */}
                <div className="mt-8 rounded-[5px] border border-slate-200 bg-white p-4 text-xs sm:text-sm text-slate-600 shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>
                            <strong>Sincronización continua:</strong> Cada cambio de estado se refleja de inmediato en tu panel administrativo, en el celular de tu cliente y en tu sistema de ventas conectado.
                        </span>
                    </div>
                </div>
            </div>
        </section>
    )
}
