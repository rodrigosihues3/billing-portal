import { Mail, MessageCircle, MapPin } from 'lucide-react'
import type { LegalModalType } from './LegalModal'

interface FooterProps {
    onOpenLegal: (type: LegalModalType) => void
}

export function Footer({ onOpenLegal }: FooterProps) {
    const whatsappUrl =
        'https://wa.me/51961211119?text=Hola%20Delivery%20Tracker,%20deseo%20recibir%20m%C3%A1s%20informaci%C3%B3n%20sobre%20el%20sistema%20de%20delivery.'

    return (
        <footer className="border-t border-slate-200 bg-white py-14 dark:border-slate-800 dark:bg-slate-950 transition-colors">
            <div className="page-shell">
                <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Columna Marca */}
                    <div className="space-y-3">
                        <a href="#inicio" className="flex items-center gap-2.5 text-base font-semibold tracking-tight text-slate-900 dark:text-white">
                            <span className="grid h-8 w-8 place-items-center rounded-[5px] bg-slate-900 text-white dark:bg-white dark:text-slate-950">
                                <svg width="22" height="22" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                    <path d="M6 26 C 7 21, 16 25, 20.5 21.5" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="0.1 3.8" />
                                    <path d="M21 20.5 C21 20.5 14.8 15 14.8 10.6 A6.2 6.2 0 0 1 27.2 10.6 C27.2 15 21 20.5 21 20.5Z" fill="#10b981" />
                                    <circle cx="21" cy="10.6" r="2.3" fill="currentColor" />
                                </svg>
                            </span>
                            <span className="font-display font-bold">Delivery Tracker</span>
                        </a>
                        <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
                            Infraestructura de delivery independiente para restaurantes y comercios en Perú. Sin comisiones abusivas por venta.
                        </p>
                        <div className="pt-2 flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                            <MapPin size={13} className="text-emerald-600 shrink-0" />
                            <span>Lima, Perú</span>
                        </div>
                    </div>

                    {/* Columna Módulos de la Solución */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-mono">
                            Módulos del Sistema
                        </h4>
                        <ul className="mt-3.5 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                            <li>
                                <a href="#como-funciona" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                                    Panel de control central
                                </a>
                            </li>
                            <li>
                                <a href="#como-funciona" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                                    Módulo de preparación (despacho)
                                </a>
                            </li>
                            <li>
                                <a href="#como-funciona" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                                    App móvil para repartidores
                                </a>
                            </li>
                            <li>
                                <a href="#como-funciona" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                                    Seguimiento web en vivo con PIN
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Columna Navegación y Legales */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-mono">
                            Plataforma y Legal
                        </h4>
                        <ul className="mt-3.5 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                            <li>
                                <a href="#para-quien" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                                    Para quién está diseñado
                                </a>
                            </li>
                            <li>
                                <a href="#beneficios" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                                    Comparativa y calculadora
                                </a>
                            </li>
                            <li>
                                <a href="#planes" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                                    Planes y tarifas mensuales
                                </a>
                            </li>
                            <li>
                                <button
                                    type="button"
                                    onClick={() => onOpenLegal('terms')}
                                    className="text-left hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                                >
                                    Condiciones del servicio
                                </button>
                            </li>
                            <li>
                                <button
                                    type="button"
                                    onClick={() => onOpenLegal('privacy')}
                                    className="text-left hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                                >
                                    Tratamiento de datos personales
                                </button>
                            </li>
                        </ul>
                    </div>

                    {/* Columna Atención y Soporte Comercial */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-mono">
                            Atención Comercial
                        </h4>
                        <div className="mt-3.5 space-y-3 text-xs text-slate-600 dark:text-slate-400">
                            <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-[5px] border border-emerald-300 bg-emerald-50/70 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/40 transition-colors"
                            >
                                <MessageCircle size={15} className="text-emerald-600" />
                                <span>WhatsApp: +51 961 211 119</span>
                            </a>

                            <div className="flex items-center gap-2 pt-1">
                                <Mail size={14} className="text-slate-400 shrink-0" />
                                <a
                                    href="mailto:contacto@deliverytracker.pe"
                                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-mono"
                                >
                                    contacto@deliverytracker.pe
                                </a>
                            </div>

                            <p className="text-[11px] text-slate-400 leading-snug">
                                Horario de atención: Lunes a Sábado de 8:00 a.m. a 9:00 p.m.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Subfooter */}
                <div className="mt-12 flex flex-col gap-3 border-t border-slate-200/90 pt-6 font-mono text-[11px] text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                    <span>© {new Date().getFullYear()} Delivery Tracker. Todos los derechos reservados.</span>
                    <span className="text-slate-400">Precios expresados en Soles (PEN · S/) · Incluyen IGV</span>
                </div>
            </div>
        </footer>
    )
}
