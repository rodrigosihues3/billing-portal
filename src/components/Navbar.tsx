import { Moon, Sun, Truck } from 'lucide-react'

interface Props {
    dark: boolean
    onThemeChange: () => void
    onSubscribe: () => void
}

export function Navbar({ dark, onThemeChange, onSubscribe }: Props) {
    return (
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
            <nav className="page-shell flex h-16 items-center justify-between gap-4">
                <a href="#inicio" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
                    <span className="grid h-8 w-8 place-items-center bg-slate-900 text-white dark:bg-white dark:text-slate-950">
                        <Truck size={17} strokeWidth={1.7} />
                    </span>
                    Delivery Tracker{' '}
                    <span className="hidden border border-slate-300 px-1.5 py-0.5 font-mono text-[10px] font-normal text-slate-500 sm:inline dark:border-slate-700">
                        SaaS B2B
                    </span>
                </a>

                <div className="hidden items-center gap-6 text-sm text-slate-600 md:flex dark:text-slate-300">
                    <a href="#planes" className="hover:text-slate-900 dark:hover:text-white transition-colors">Planes</a>
                    <a href="#como-funciona" className="hover:text-slate-900 dark:hover:text-white transition-colors">Cómo funciona</a>
                    <a href="#beneficios" className="hover:text-slate-900 dark:hover:text-white transition-colors">Beneficios</a>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        aria-label="Cambiar tema"
                        onClick={onThemeChange}
                        className="grid h-9 w-9 place-items-center border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                    >
                        {dark ? <Sun size={16} /> : <Moon size={16} />}
                    </button>
                    <button type="button" onClick={onSubscribe} className="btn-primary px-3 py-2 text-sm">
                        Suscribirme
                    </button>
                </div>
            </nav>
        </header>
    )
}