import { Database, MessageSquare, Globe2, ShieldCheck } from 'lucide-react'

export function Audience() {
    return (
        <section id="para-quien" className="page-shell py-16 sm:py-20 border-t border-slate-200/80 dark:border-slate-800/80">
            <div className="max-w-2xl">
                <h2 className="mt-2.5 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                    Dos formas de operar, una misma flota bajo tu control.
                </h2>
                <p className="mt-3 text-base text-slate-600 dark:text-slate-300">
                    Tanto si tomas pedidos por chat como si ya cuentas con un e-commerce o sistema de facturación, Delivery Tracker se adapta sin obligarte a cambiar tu forma de vender.
                </p>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
                {/* Modalidad 1: Venta directa manual */}
                <div className="flex flex-col justify-between rounded-[5px] border border-slate-200 bg-white p-7 shadow-xs dark:border-slate-800 dark:bg-slate-900/90 transition-all hover:border-slate-300 dark:hover:border-slate-700">
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="grid h-10 w-10 place-items-center rounded-[5px] bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                                <MessageSquare size={20} strokeWidth={1.75} />
                            </span>
                            <span className="font-mono text-[10px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-[3px] dark:bg-slate-800 dark:text-slate-400">
                                DESDE PLAN STARTER
                            </span>
                        </div>
                        <h3 className="mt-5 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                            1. Venta por WhatsApp o mostrador
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                            Para restaurantes, pastelerías, tiendas de ropa o bodegas que reciben pedidos por mensajería o teléfono. Creas la comanda en segundos desde el panel y el sistema dispara el flujo automático a cocina y a tus repartidores.
                        </p>
                        <ul className="mt-5 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                            <li className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                Carga rápida con dirección, productos y datos del comprador.
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                Sin depender de desarrolladores ni código técnico.
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                Notificación instantánea al motorizado cuando el paquete esté listo.
                            </li>
                        </ul>
                    </div>

                    <div className="mt-7 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            Ideal para arrancar tu delivery propio hoy mismo
                        </span>
                    </div>
                </div>

                {/* Modalidad 2: Integración web automática */}
                <div className="flex flex-col justify-between rounded-[5px] border border-slate-200 bg-white p-7 shadow-xs dark:border-slate-800 dark:bg-slate-900/90 transition-all hover:border-slate-300 dark:hover:border-slate-700">
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="grid h-10 w-10 place-items-center rounded-[5px] bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                                <Globe2 size={20} strokeWidth={1.75} />
                            </span>
                            <span className="font-mono text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-[3px] border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800">
                                DESDE PLAN GROWTH
                            </span>
                        </div>
                        <h3 className="mt-5 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                            2. Conexión automática con tu tienda web
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                            Si tu negocio cuenta con página web, e-commerce propio o sistema POS, conecta tus órdenes por API. Cada compra web se registra en tiempo real en la pantalla de preparación sin intervención manual.
                        </p>
                        <ul className="mt-5 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                            <li className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                Integración fluida mediante API REST estructurada.
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                Sincronización automática de estados de entrega con tu sistema.
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                Cero digitación doble y menos margen de error humano.
                            </li>
                        </ul>
                    </div>

                    <div className="mt-7 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            Ideal para escalar volumen sin saturar tu personal
                        </span>
                    </div>
                </div>
            </div>

            {/* Banner de Diferenciador Clave: Base de Datos 100% propia */}
            <div className="mt-6 rounded-[5px] border border-emerald-300/80 bg-gradient-to-r from-emerald-50/70 via-white to-emerald-50/40 p-6 sm:p-7 dark:border-emerald-900/60 dark:bg-gradient-to-r dark:from-emerald-950/30 dark:via-slate-900 dark:to-emerald-950/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                    <div className="flex items-start gap-4">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[5px] bg-emerald-600 text-white shadow-xs">
                            <Database size={20} strokeWidth={1.75} />
                        </span>
                        <div>
                            <h4 className="text-base font-bold text-slate-900 dark:text-white">
                                Tus clientes son tuyos. Tu base de datos nunca se comparte.
                            </h4>
                            <p className="mt-1 max-w-2xl text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                A diferencia de los marketplaces de delivery convencionales, tus clientes compran bajo tu marca y sus datos quedan aislados exclusivamente para tu empresa. Construye relaciones directas, fideliza y retén el 100% del valor de cada venta.
                            </p>
                        </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                        <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400" />
                        <span>Datos aislados y privados</span>
                    </div>
                </div>
            </div>
        </section>
    )
}
