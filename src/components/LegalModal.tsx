import { X, ShieldCheck, FileText } from 'lucide-react'

export type LegalModalType = 'terms' | 'privacy' | null

interface LegalModalProps {
    type: LegalModalType
    onClose: () => void
}

export function LegalModal({ type, onClose }: LegalModalProps) {
    if (!type) return null

    const isTerms = type === 'terms'
    const title = isTerms ? 'Condiciones del Servicio' : 'Tratamiento de Datos Personales y Privacidad'
    const Icon = isTerms ? FileText : ShieldCheck

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="legal-modal-title"
        >
            <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-[5px] border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950 overflow-hidden">
                {/* Cabecera */}
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                        <span className="grid h-8 w-8 place-items-center rounded-[5px] bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                            <Icon size={18} strokeWidth={1.75} />
                        </span>
                        <div>
                            <h3 id="legal-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
                                {title}
                            </h3>
                            <span className="font-mono text-[10px] text-slate-400">
                                Versión oficial actualizada · Perú 2026
                            </span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Cerrar ventana legal"
                        className="grid h-8 w-8 place-items-center rounded-[5px] border border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Contenido scrolleable */}
                <div className="flex-1 overflow-y-auto p-6 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300 space-y-4">
                    {isTerms ? (
                        <>
                            <section className="space-y-1.5">
                                <h4 className="font-bold text-slate-900 dark:text-white">1. Objeto y Alcance del Servicio</h4>
                                <p>
                                    Delivery Tracker proporciona una solución tecnológica de software para la gestión, preparación, ruteo y seguimiento de pedidos de entrega a domicilio para negocios comerciales en Perú. La plataforma actúa estrictamente como intermediario tecnológico entre el comercio, sus repartidores y sus clientes finales.
                                </p>
                            </section>

                            <section className="space-y-1.5">
                                <h4 className="font-bold text-slate-900 dark:text-white">2. Planes, Tarifas y Facturación</h4>
                                <p>
                                    Los planes suscritos (Starter, Growth, Enterprise) operan bajo modalidad de tarifa plana mensual fija. Todos los precios detallados en la plataforma incluyen el Impuesto General a las Ventas (IGV). Al alcanzar el tope de pedidos mensual del plan seleccionado, el sistema bloquea temporalmente la creación de nuevos pedidos hasta el siguiente ciclo o hasta que el comercio decida escalar su plan. El acceso para consultas y auditoría se mantiene ininterrumpido.
                                </p>
                            </section>

                            <section className="space-y-1.5">
                                <h4 className="font-bold text-slate-900 dark:text-white">3. Responsabilidad de la Operación de Reparto</h4>
                                <p>
                                    El comercio usuario es el único responsable de la contratación, supervisión y relación laboral o comercial con sus repartidores, así como de la idoneidad, estado y manipulación de los productos despachados.
                                </p>
                            </section>

                            <section className="space-y-1.5">
                                <h4 className="font-bold text-slate-900 dark:text-white">4. Cancelación del Servicio</h4>
                                <p>
                                    El comercio puede dar de baja su suscripción en cualquier momento desde su panel de control sin penalidades ni plazos forzosos de permanencia.
                                </p>
                            </section>
                        </>
                    ) : (
                        <>
                            <section className="space-y-1.5">
                                <h4 className="font-bold text-slate-900 dark:text-white">1. Titularidad y Soberanía de los Datos</h4>
                                <p>
                                    Los datos de los clientes finales que el comercio ingrese (nombres, direcciones de entrega, números telefónicos) pertenecen única y exclusivamente al comercio titular. Delivery Tracker no comercializa, no transfiere ni utiliza dicha información para fines publicitarios propios ni de terceros.
                                </p>
                            </section>

                            <section className="space-y-1.5">
                                <h4 className="font-bold text-slate-900 dark:text-white">2. Cumplimiento de la Ley N° 29733</h4>
                                <p>
                                    En estricto apego a la Ley de Protección de Datos Personales del Perú (Ley N° 29733) y su reglamento, la plataforma implementa cifrado en tránsito y en reposo, garantizando el aislamiento de bases de datos por cada cuenta empresarial registrada.
                                </p>
                            </section>

                            <section className="space-y-1.5">
                                <h4 className="font-bold text-slate-900 dark:text-white">3. Geolocalización y Seguridad del PIN</h4>
                                <p>
                                    La ubicación satelital del repartidor se procesa exclusivamente durante el trayecto activo del despacho y deja de compartirse una vez validado el código PIN de 4 dígitos en el destino del cliente.
                                </p>
                            </section>

                            <section className="space-y-1.5">
                                <h4 className="font-bold text-slate-900 dark:text-white">4. Derechos ARCO</h4>
                                <p>
                                    Cualquier titular puede solicitar el acceso, rectificación, cancelación u oposición al tratamiento de sus datos escribiendo directamente a nuestro canal de soporte: <strong className="text-slate-900 dark:text-white">contacto@deliverytracker.pe</strong>.
                                </p>
                            </section>
                        </>
                    )}
                </div>

                {/* Pie */}
                <div className="flex items-center justify-end border-t border-slate-200 px-6 py-3.5 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn-primary rounded-[5px] px-4 py-2 text-xs font-semibold"
                    >
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    )
}
