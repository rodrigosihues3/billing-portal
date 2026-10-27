import { useState, type ReactNode } from 'react'
import {
    ArrowRight,
    Bell,
    Check,
    ChefHat,
    GripVertical,
    LayoutDashboard,
    Lock,
    MapPin,
    Navigation,
    PhoneCall,
    ShieldCheck,
    Smartphone,
    UserRound
} from 'lucide-react'
import type { Plan } from '../types/billing'

interface HeroProps {
    onStart: (plan: Plan) => void
}

const SLIDE_MS = 7000
const TOTAL_SLIDES = 4
const SLIDE_NAMES = ['Panel de control', 'Módulo de preparación', 'App del repartidor', 'Seguimiento del cliente']

/* Animaciones propias del carrusel (desactivadas con prefers-reduced-motion) */
const HERO_STYLES = `
@keyframes hero-progress { from { width: 0% } to { width: 100% } }
@keyframes hero-dash { to { stroke-dashoffset: -22 } }
@keyframes hero-float { 0%, 100% { transform: translateY(0) rotate(-2deg) } 50% { transform: translateY(-4px) rotate(-2deg) } }
@keyframes hero-pulse-ring { 0%, 100% { opacity: .35 } 50% { opacity: 1 } }
@keyframes hero-toast { 0%, 35% { opacity: 0; transform: translateY(8px) } 55%, 100% { opacity: 1; transform: translateY(0) } }
.hero-progress { animation-name: hero-progress; animation-timing-function: linear; animation-fill-mode: forwards }
.hero-dash { animation: hero-dash 1s linear infinite }
.hero-float { animation: hero-float 2.4s ease-in-out infinite }
.hero-blink { animation: hero-pulse-ring 1.6s ease-in-out infinite }
.hero-toast { animation: hero-toast 3.2s ease-out both }
@media (prefers-reduced-motion: reduce) {
  .hero-progress { animation: none; width: 100% }
  .hero-dash, .hero-float, .hero-blink, .hero-toast { animation: none }
}
`

const prefersReducedMotion = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* ───────────── Piezas reutilizables ───────────── */

interface SlideShellProps {
    active: boolean
    icon: ReactNode
    module: string
    badge: string
    badgeClass: string
    title: string
    subtitle: string
    children: ReactNode
}

function SlideShell({ active, icon, module, badge, badgeClass, title, subtitle, children }: SlideShellProps) {
    return (
        <div
            aria-hidden={!active}
            inert={!active}
            className={`absolute inset-0 flex flex-col transition-all duration-700 ease-out ${active ? 'translate-x-0 opacity-100' : 'pointer-events-none translate-x-6 opacity-0'}`}
        >
            <div className="flex items-center justify-between gap-2 border-b border-slate-200/90 px-4 py-2.5 dark:border-slate-800 sm:px-5">
                <span className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    <span className="grid h-5 w-5 place-items-center rounded-[4px] bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                        {icon}
                    </span>
                    {module}
                </span>
                <span className={`flex items-center gap-1.5 rounded-[3px] border px-2 py-0.5 font-mono text-[10px] font-bold ${badgeClass}`}>
                    {badge}
                </span>
            </div>

            <div className="px-4 pt-3 sm:px-5">
                <p className="text-[15px] font-semibold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-base">{title}</p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
            </div>

            <div className="flex min-h-0 flex-1 flex-col px-4 pb-4 pt-3 sm:px-5">{children}</div>
        </div>
    )
}

const EMERALD_BADGE =
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
const INDIGO_BADGE =
    'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400'
const AMBER_BADGE =
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400'

function Stepper({ steps, current }: { steps: string[]; current: number }) {
    return (
        <ol className="flex items-start">
            {steps.map((label, i) => {
                const done = i < current
                const isCurrent = i === current
                return (
                    <li key={label} className="relative flex flex-1 flex-col items-center">
                        {i < steps.length - 1 && (
                            <span
                                className={`absolute left-1/2 top-[9px] h-0.5 w-full ${i < current ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                            />
                        )}
                        <span
                            className={`relative z-10 grid h-[18px] w-[18px] place-items-center rounded-full border-2 ${done
                                ? 'border-emerald-500 bg-emerald-500 text-white'
                                : isCurrent
                                    ? 'border-emerald-500 bg-white text-emerald-600 ring-4 ring-emerald-500/20 dark:bg-slate-950'
                                    : 'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-950'
                                }`}
                        >
                            {done && <Check size={10} strokeWidth={3} />}
                            {isCurrent && <span className="hero-blink h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                        </span>
                        <span
                            className={`mt-1 text-center text-[9px] font-semibold leading-tight sm:text-[10px] ${isCurrent ? 'text-emerald-700 dark:text-emerald-400' : done ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}`}
                        >
                            {label}
                        </span>
                    </li>
                )
            })}
        </ol>
    )
}

/* Mapa vectorial de calles con ruta animada y repartidor en movimiento */
const ROUTE = 'M50 40 H150 V100 H320'

function MapCanvas({ animate }: { animate: boolean }) {
    return (
        <svg viewBox="0 0 400 160" preserveAspectRatio="xMidYMid slice" className="h-full w-full" role="img" aria-label="Mapa con la ruta del repartidor">
            <rect width="400" height="160" className="fill-[#eef2f1] dark:fill-slate-900" />
            {/* Manzanas y parque */}
            <rect x="170" y="52" width="68" height="36" rx="4" className="fill-emerald-100 dark:fill-emerald-950/60" />
            <rect x="60" y="52" width="82" height="36" rx="3" className="fill-slate-200/70 dark:fill-slate-800/70" />
            <rect x="260" y="52" width="52" height="36" rx="3" className="fill-slate-200/70 dark:fill-slate-800/70" />
            <rect x="60" y="110" width="82" height="22" rx="3" className="fill-slate-200/70 dark:fill-slate-800/70" />
            <rect x="160" y="110" width="82" height="22" rx="3" className="fill-slate-200/70 dark:fill-slate-800/70" />
            <rect x="262" y="110" width="50" height="22" rx="3" className="fill-slate-200/70 dark:fill-slate-800/70" />
            {/* Calles */}
            <g className="stroke-white dark:stroke-slate-800" strokeWidth="9" fill="none" strokeLinecap="round">
                <path d="M0 40 H400" />
                <path d="M0 100 H400" />
                <path d="M0 142 H400" />
                <path d="M50 0 V160" />
                <path d="M150 0 V160" />
                <path d="M250 0 V160" />
                <path d="M320 0 V160" />
            </g>
            <g className="fill-slate-400 font-mono dark:fill-slate-500" fontSize="7" fontWeight="600" letterSpacing=".6">
                <text x="170" y="144">AV. JAVIER PRADO</text>
                <text x="258" y="74">AV. AREQUIPA</text>
            </g>
            {/* Ruta */}
            <path d={ROUTE} fill="none" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" className="stroke-emerald-200 dark:stroke-emerald-900" />
            <path d={ROUTE} fill="none" stroke="#059669" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 5" className="hero-dash" />
            {/* Origen (negocio) */}
            <circle cx="50" cy="40" r="8" className="fill-slate-900 stroke-white dark:fill-white dark:stroke-slate-900" strokeWidth="2" />
            <rect x="46.5" y="36.5" width="7" height="7" rx="1.5" className="fill-white dark:fill-slate-900" />
            {/* Destino */}
            <circle cx="320" cy="100" r="9" fill="#f43f5e" stroke="white" strokeWidth="2" />
            <circle cx="320" cy="100" r="3" fill="white" />
            {/* Repartidor */}
            {animate ? (
                <g>
                    <animateMotion dur="7s" repeatCount="indefinite" rotate="auto" path={ROUTE} />
                    <circle r="14" fill="#34d399" opacity=".35" />
                    <circle r="8.5" fill="#059669" stroke="white" strokeWidth="2" />
                    <path d="M-3 -3.5 L4 0 L-3 3.5 Z" fill="white" />
                </g>
            ) : (
                <g transform="translate(150 78)">
                    <circle r="14" fill="#34d399" opacity=".35" />
                    <circle r="8.5" fill="#059669" stroke="white" strokeWidth="2" />
                    <path d="M-3 -3.5 L4 0 L-3 3.5 Z" fill="white" transform="rotate(90)" />
                </g>
            )}
        </svg>
    )
}

function Avatar({ initials, size = 'md' }: { initials: string; size?: 'sm' | 'md' }) {
    return (
        <span
            className={`grid shrink-0 place-items-center rounded-full border border-slate-200 bg-slate-100 font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-white ${size === 'sm' ? 'h-7 w-7 text-[10px]' : 'h-8 w-8 text-xs'}`}
        >
            {initials}
        </span>
    )
}

/* ───────────── Slide 1: Panel de control ───────────── */

function PanelSlide({ active, animate }: { active: boolean; animate: boolean }) {
    return (
        <SlideShell
            active={active}
            icon={<LayoutDashboard size={12} />}
            module="Panel de control"
            badge="EN VIVO"
            badgeClass={EMERALD_BADGE}
            title="Controla cada pedido desde un solo panel"
            subtitle="Estado, repartidor y ruta en tiempo real."
        >
            <div className="grid grid-cols-3 gap-2">
                {[
                    ['38', 'Pedidos hoy', ''],
                    ['5', 'En ruta', 'text-emerald-600 dark:text-emerald-400'],
                    ['31', 'Entregados', '']
                ].map(([value, label, tone]) => (
                    <div key={label} className="rounded-[4px] border border-slate-200 bg-slate-50 px-2.5 py-1.5 dark:border-slate-800 dark:bg-slate-900">
                        <p className={`font-mono text-base font-bold leading-none text-slate-900 dark:text-white ${tone}`}>{value}</p>
                        <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">{label}</p>
                    </div>
                ))}
            </div>

            <div className="mt-2.5 flex min-h-0 flex-1 flex-col rounded-[5px] border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2 dark:border-slate-800">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">PEDIDO #A-1048</span>
                    <span className="rounded-[3px] border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
                        EN RUTA
                    </span>
                </div>
                <div className="px-3 pb-1 pt-2.5">
                    <Stepper steps={['Recibido', 'Preparado', 'En ruta', 'Entregado']} current={2} />
                </div>
                <div className="relative mx-3 my-2 min-h-[84px] flex-1 overflow-hidden rounded-[4px] border border-slate-200 dark:border-slate-800">
                    <MapCanvas animate={animate} />
                    <span className="absolute bottom-1.5 left-1.5 rounded bg-white/95 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-700 shadow-xs dark:bg-slate-800 dark:text-emerald-400">
                        Jorge · 450 m · 6 min
                    </span>
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-3 py-2 dark:border-slate-800">
                    <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">2x Polo oversize · 1x Gorra negra</p>
                        <p className="truncate font-mono text-[10px] text-slate-400">Carlos Mendoza · Av. Arequipa 2190</p>
                    </div>
                    <span className="shrink-0 font-mono text-[11px] font-bold text-slate-900 dark:text-white">S/ 60.00</span>
                </div>
            </div>
        </SlideShell>
    )
}

/* ───────────── Slide 2: Módulo de preparación (Kanban) ───────────── */

function KanbanCard({ id, items, meta, className = '' }: { id: string; items: string; meta: string; className?: string }) {
    return (
        <div className={`rounded-[4px] border border-slate-200 bg-white p-2 shadow-xs dark:border-slate-700 dark:bg-slate-900 ${className}`}>
            <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold text-slate-900 dark:text-white">{id}</span>
                <GripVertical size={11} className="text-slate-300" />
            </div>
            <p className="mt-1 text-[11px] font-medium leading-snug text-slate-700 dark:text-slate-300">{items}</p>
            <p className="mt-1 font-mono text-[9px] text-slate-400">{meta}</p>
        </div>
    )
}

function KanbanColumn({ title, count, tone, children }: { title: string; count: number; tone: string; children: ReactNode }) {
    return (
        <div className="flex min-w-0 flex-col rounded-[5px] border border-slate-200 bg-slate-50/80 p-1.5 dark:border-slate-800 dark:bg-slate-900/50">
            <div className="mb-1.5 flex items-center justify-between gap-1 px-0.5">
                <span className="flex items-center gap-1 truncate text-[10px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${tone}`} />
                    <span className="truncate">{title}</span>
                </span>
                <span className="rounded-full bg-white px-1.5 font-mono text-[9px] font-bold text-slate-500 dark:bg-slate-800">{count}</span>
            </div>
            <div className="space-y-1.5">{children}</div>
        </div>
    )
}

function KitchenSlide({ active }: { active: boolean }) {
    return (
        <SlideShell
            active={active}
            icon={<ChefHat size={12} />}
            module="Módulo de preparación"
            badge="TABLERO"
            badgeClass={AMBER_BADGE}
            title="Tu equipo prepara, tus repartidores se enteran solos"
            subtitle="Arrastra el pedido a Para despacho y se avisa a toda tu flota."
        >
            <div className="grid flex-1 grid-cols-3 content-start gap-2">
                <KanbanColumn title="Por preparar" count={2} tone="bg-slate-400">
                    <KanbanCard id="#A-1051" items="1x Combo familiar" meta="hace 1 min" />
                    <KanbanCard id="#A-1050" items="2x Polo oversize" meta="hace 3 min" />
                </KanbanColumn>

                <KanbanColumn title="En preparación" count={2} tone="bg-amber-400">
                    <KanbanCard id="#A-1049" items="1x Mochila urbana" meta="hace 6 min" />
                    <div className={active ? 'hero-float' : ''} style={{ transform: 'rotate(-2deg)' }}>
                        <KanbanCard
                            id="#A-1048"
                            items="2x Polo oversize + 1x Gorra"
                            meta="Arrastrando…"
                            className="shadow-lg ring-2 ring-emerald-400"
                        />
                    </div>
                </KanbanColumn>

                <KanbanColumn title="Para despacho" count={1} tone="bg-emerald-500">
                    <div className="rounded-[4px] border-2 border-dashed border-emerald-400/70 bg-emerald-50/60 px-2 py-4 text-center text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                        Suelta aquí
                    </div>
                    <KanbanCard id="#A-1046" items="3x Zapatillas urbanas" meta="Listo · notificado" className="opacity-70" />
                </KanbanColumn>
            </div>

            <div
                key={active ? 'on' : 'off'}
                className={`mt-2 flex items-center gap-2.5 rounded-[5px] border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-900 dark:bg-emerald-950/40 ${active ? 'hero-toast' : ''}`}
            >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-600 text-white">
                    <Bell size={12} />
                </span>
                <p className="text-[11px] leading-snug text-emerald-900 dark:text-emerald-200">
                    <span className="font-bold">Pedido listo.</span> Se notificó a 4 repartidores disponibles.
                </p>
            </div>
        </SlideShell>
    )
}

/* ───────────── Slide 3: App del repartidor ───────────── */

function DriverSlide({ active }: { active: boolean }) {
    return (
        <SlideShell
            active={active}
            icon={<Smartphone size={12} />}
            module="App del repartidor"
            badge="EXCLUSIVA"
            badgeClass={EMERALD_BADGE}
            title="Cada repartidor, con su propia app"
            subtitle="Toma pedidos, navega al destino y valida con el PIN."
        >
            <div className="flex flex-1 items-center justify-center gap-5">
                <div className="flex h-full max-h-[330px] w-[210px] shrink-0 flex-col overflow-hidden rounded-[24px] border-[5px] border-slate-800 bg-white shadow-2xl dark:border-slate-600 dark:bg-slate-950">
                    <div className="flex h-4 items-center justify-center bg-slate-800 dark:bg-slate-600">
                        <span className="h-1 w-10 rounded-full bg-slate-600 dark:bg-slate-400" />
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2 dark:border-slate-800">
                        <span className="text-[11px] font-bold text-slate-900 dark:text-white">Para despacho</span>
                        <span className="rounded-full bg-emerald-600 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white">2 nuevos</span>
                    </div>

                    <div className="flex-1 space-y-2 overflow-hidden bg-slate-50 p-2 dark:bg-slate-900/60">
                        <div className="rounded-[6px] border border-emerald-300 bg-white p-2 shadow-sm dark:border-emerald-800 dark:bg-slate-900">
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-[10px] font-bold text-slate-900 dark:text-white">#A-1048</span>
                                <span className="font-mono text-[10px] font-bold text-emerald-600">+ S/ 6.00</span>
                            </div>
                            <p className="mt-1 flex items-center gap-1 truncate text-[10px] text-slate-600 dark:text-slate-300">
                                <MapPin size={10} className="shrink-0 text-rose-500" />
                                <span className="truncate">Av. Arequipa 2190</span>
                            </p>
                            <p className="font-mono text-[9px] text-slate-400">1.2 km · 8 min</p>
                            <span className="mt-1.5 block rounded-[4px] bg-emerald-600 py-1 text-center text-[10px] font-bold text-white">
                                Tomar pedido
                            </span>
                        </div>
                        <div className="rounded-[6px] border border-slate-200 bg-white p-2 opacity-80 dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-[10px] font-bold text-slate-900 dark:text-white">#A-1049</span>
                                <span className="font-mono text-[10px] font-bold text-emerald-600">+ S/ 5.00</span>
                            </div>
                            <p className="mt-1 flex items-center gap-1 truncate text-[10px] text-slate-600 dark:text-slate-300">
                                <MapPin size={10} className="shrink-0 text-rose-500" />
                                <span className="truncate">Jr. Los Olivos 340</span>
                            </p>
                            <p className="font-mono text-[9px] text-slate-400">2.0 km · 12 min</p>
                        </div>
                    </div>

                    <div className="space-y-1 border-t border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-950">
                        <p className="font-mono text-[9px] font-semibold uppercase text-slate-400">En curso · #A-1043</p>
                        <div className="grid grid-cols-2 gap-1.5">
                            <span className="flex items-center justify-center gap-1 rounded-[4px] border border-slate-200 py-1 text-[9px] font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">
                                <Navigation size={9} className="text-blue-600" /> Navegar
                            </span>
                            <span className="flex items-center justify-center gap-1 rounded-[4px] bg-slate-900 py-1 text-[9px] font-bold text-white dark:bg-white dark:text-slate-900">
                                <ShieldCheck size={9} /> Validar PIN
                            </span>
                        </div>
                    </div>
                </div>

                <ul className="hidden min-w-0 flex-1 space-y-3.5 sm:block">
                    {[
                        [Bell, 'Aviso inmediato', 'Le suena cuando un pedido está listo para despacho.'],
                        [Navigation, 'Ruta al destino', 'Abre la navegación con Google Maps en un toque.'],
                        [ShieldCheck, 'Entrega verificada', 'Solo se cierra con el PIN que le da el cliente.']
                    ].map(([Icon, label, text]) => {
                        const I = Icon as typeof Bell
                        return (
                            <li key={label as string} className="flex items-start gap-2.5">
                                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-[5px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                                    <I size={13} />
                                </span>
                                <span>
                                    <span className="block text-xs font-bold text-slate-900 dark:text-white">{label as string}</span>
                                    <span className="block text-[11px] leading-snug text-slate-500 dark:text-slate-400">{text as string}</span>
                                </span>
                            </li>
                        )
                    })}
                </ul>
            </div>
        </SlideShell>
    )
}

/* ───────────── Slide 4: Seguimiento del cliente ───────────── */

function TrackingSlide({ active, animate }: { active: boolean; animate: boolean }) {
    return (
        <SlideShell
            active={active}
            icon={<UserRound size={12} />}
            module="Seguimiento del cliente"
            badge="SIN INSTALAR APPS"
            badgeClass={INDIGO_BADGE}
            title="Un enlace para que tu cliente siga su pedido"
            subtitle="Estados en vivo, repartidor, mapa y PIN de entrega."
        >
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[6px] border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-2.5 py-1.5 dark:border-slate-800 dark:bg-slate-900">
                    <span className="flex gap-1">
                        <span className="h-2 w-2 rounded-full bg-rose-300" />
                        <span className="h-2 w-2 rounded-full bg-amber-300" />
                        <span className="h-2 w-2 rounded-full bg-emerald-300" />
                    </span>
                    <span className="flex min-w-0 flex-1 items-center gap-1 rounded-[4px] border border-slate-200 bg-white px-2 py-0.5 font-mono text-[10px] text-slate-500 dark:border-slate-700 dark:bg-slate-950">
                        <Lock size={9} className="shrink-0 text-emerald-600" />
                        <span className="truncate">seguimiento.tunegocio.pe/p/A-1048</span>
                    </span>
                </div>

                <div className="flex min-h-0 flex-1 flex-col gap-2 p-2.5">
                    <Stepper steps={['Confirmado', 'Preparando', 'En camino', 'Entregado']} current={2} />

                    <div className="relative min-h-[72px] flex-1 overflow-hidden rounded-[4px] border border-slate-200 dark:border-slate-800">
                        <MapCanvas animate={animate} />
                        <span className="absolute bottom-1.5 left-1.5 rounded bg-white/95 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-700 shadow-xs dark:bg-slate-800 dark:text-emerald-400">
                            Repartidor a 450 m · ~6 min
                        </span>
                    </div>

                    <div className="rounded-[5px] border-2 border-emerald-500 bg-emerald-50/70 px-3 py-2 text-center dark:border-emerald-600 dark:bg-emerald-950/30">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
                            Tu PIN de entrega
                        </p>
                        <div className="mt-1.5 flex justify-center gap-1.5 font-mono">
                            {['7', '4', '1', '2'].map((digit, i) => (
                                <span
                                    key={i}
                                    className="grid h-8 w-8 place-items-center rounded-[4px] border border-emerald-300 bg-white text-lg font-bold text-slate-900 dark:border-emerald-800 dark:bg-slate-900 dark:text-white"
                                >
                                    {digit}
                                </span>
                            ))}
                        </div>
                        <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">Díctaselo al repartidor al recibir.</p>
                    </div>

                    <div className="flex items-center justify-between gap-2 rounded-[4px] border border-slate-200 bg-slate-50 px-2.5 py-1.5 dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex min-w-0 items-center gap-2">
                            <Avatar initials="JR" size="sm" />
                            <div className="min-w-0">
                                <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">Jorge Ramírez</p>
                                <p className="truncate font-mono text-[9px] text-slate-400">2x Polo oversize + 1x Gorra</p>
                            </div>
                        </div>
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-[3px] border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-emerald-700 dark:border-slate-700 dark:bg-slate-800 dark:text-emerald-400">
                            <PhoneCall size={11} /> Llamar
                        </span>
                    </div>
                </div>
            </div>
        </SlideShell>
    )
}

/* ───────────── Hero ───────────── */

export function Hero({ onStart }: HeroProps) {
    const [activeSlide, setActiveSlide] = useState<number>(0)
    const [isPaused, setIsPaused] = useState<boolean>(false)
    const [reduced] = useState<boolean>(prefersReducedMotion)

    const nextSlide = () => setActiveSlide((prev) => (prev + 1) % TOTAL_SLIDES)

    return (
        <section id="inicio" className="page-shell grid gap-12 py-14 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:py-20">
            <style>{HERO_STYLES}</style>

            {/* Columna Izquierda: Copy Principal */}
            <div className="flex flex-col justify-center">
                <h1 className="max-w-2xl text-4xl font-semibold leading-[1.08] tracking-[-.04em] text-slate-900 sm:text-5xl lg:text-6xl dark:text-white">
                    Tus repartos. Tus clientes. Sin comisiones abusivas.
                </h1>

                <p className="mt-6 max-w-lg text-base leading-7 text-slate-600 sm:text-lg dark:text-slate-300">
                    Centraliza la comanda en cocina, el ruteo de tu flota y el tracking en vivo para tus clientes. Monitoreo web directo mediante PIN seguro, sin pagar comisiones por pedido.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <button
                        type="button"
                        onClick={() => onStart('growth')}
                        className="btn-primary flex items-center justify-center gap-2 rounded-[5px] px-6 py-3.5 text-sm font-semibold shadow-sm transition-all hover:shadow-md"
                    >
                        Contratar Plan Growth · S/ 199/mes <ArrowRight size={17} />
                    </button>
                    <button
                        type="button"
                        onClick={() => onStart('trial')}
                        className="btn-secondary rounded-[5px] px-6 py-3.5 text-sm font-semibold transition-all hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        Probar 14 días gratis
                    </button>
                </div>

                <div className="mt-10 grid grid-cols-3 gap-4 border-t border-slate-200/80 pt-6 font-mono dark:border-slate-800/80">
                    <div>
                        <p className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">0%</p>
                        <p className="text-[11px] text-slate-500 font-sans mt-0.5">Comisión por venta</p>
                    </div>
                    <div>
                        <p className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">&lt; 15 seg</p>
                        <p className="text-[11px] text-slate-500 font-sans mt-0.5">Asignación de orden</p>
                    </div>
                    <div>
                        <p className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">100%</p>
                        <p className="text-[11px] text-slate-500 font-sans mt-0.5">Web sin apps cliente</p>
                    </div>
                </div>
            </div>

            {/* Columna Derecha: Carrusel de módulos del sistema */}
            <div
                className="flex w-full flex-col items-center gap-4"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                <div
                    className="relative h-[560px] w-full overflow-hidden rounded-[5px] border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950 sm:h-[540px]"
                    aria-roledescription="carrusel"
                    aria-label="Módulos del sistema de delivery"
                >
                    <PanelSlide active={activeSlide === 0} animate={!reduced} />
                    <KitchenSlide active={activeSlide === 1} />
                    <DriverSlide active={activeSlide === 2} />
                    <TrackingSlide active={activeSlide === 3} animate={!reduced} />
                </div>

                {/* Indicadores: el progreso del punto activo dispara el cambio de slide */}
                <nav
                    aria-label="Selector de módulos"
                    className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 shadow-xs backdrop-blur-md transition-all hover:border-emerald-500/40 dark:border-emerald-400/20 dark:bg-emerald-950/40"
                >
                    {SLIDE_NAMES.map((name, idx) => {
                        const isActive = activeSlide === idx
                        return (
                            <button
                                key={name}
                                type="button"
                                title={name}
                                aria-label={`Ver ${name}`}
                                aria-current={isActive}
                                onClick={() => setActiveSlide(idx)}
                                className="group relative flex items-center justify-center p-0.5 focus:outline-hidden"
                            >
                                <span
                                    className={`relative block h-2 overflow-hidden rounded-full transition-all duration-500 ${isActive
                                        ? 'w-9 bg-emerald-800/20 dark:bg-emerald-300/20'
                                        : 'w-2 bg-emerald-800/30 group-hover:bg-emerald-700/60 dark:bg-emerald-300/30 dark:group-hover:bg-emerald-300/70'
                                        }`}
                                >
                                    {isActive && (
                                        <span
                                            key={`progress-${activeSlide}`}
                                            className="hero-progress absolute inset-y-0 left-0 rounded-full bg-emerald-600 dark:bg-emerald-400"
                                            style={{
                                                animationDuration: `${SLIDE_MS}ms`,
                                                animationPlayState: isPaused ? 'paused' : 'running'
                                            }}
                                            onAnimationEnd={(e) => {
                                                if (e.target === e.currentTarget) nextSlide()
                                            }}
                                        />
                                    )}
                                </span>
                            </button>
                        )
                    })}
                </nav>
            </div>
        </section>
    )
}