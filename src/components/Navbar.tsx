import { useState } from 'react'
import { ExternalLink, Menu, Moon, Sun, X } from 'lucide-react'

const ADMIN_URL = import.meta.env.VITE_ADMIN_PANEL_URL || 'http://localhost:3000/admin'

interface Props {
    dark: boolean
    onThemeChange: () => void
    onSubscribe: () => void
}

export function Navbar({ dark, onThemeChange, onSubscribe }: Props) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const navLinks = [
        { href: '#para-quien', label: 'Para quién' },
        { href: '#como-funciona', label: 'Cómo funciona' },
        { href: '#beneficios', label: 'Beneficios' },
        { href: '#planes', label: 'Planes' }
    ]

    const handleLinkClick = () => {
        setMobileMenuOpen(false)
    }

    return (
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95 transition-colors">
            <nav className="page-shell flex h-16 items-center justify-between gap-4">
                {/* Logo e isotipo propio SVG */}
                <a href="#inicio" className="flex items-center gap-2.5 text-base font-semibold tracking-tight text-slate-900 dark:text-white">
                    <span className="grid h-8 w-8 place-items-center rounded-[5px] text-white dark:text-slate-950 shadow-xs">
                        <svg width="22" height="22" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <path d="M6 26 C 7 21, 16 25, 20.5 21.5" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="0.1 3.8" />
                            <path d="M21 20.5 C21 20.5 14.8 15 14.8 10.6 A6.2 6.2 0 0 1 27.2 10.6 C27.2 15 21 20.5 21 20.5Z" fill="#10b981" />
                            <circle cx="21" cy="10.6" r="2.3" fill="currentColor" />
                        </svg>
                    </span>
                    <span className="font-display font-bold tracking-tight">Delivery Tracker</span>
                </a>

                {/* Enlaces de navegación desktop */}
                <div className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex dark:text-slate-300">
                    {navLinks.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                        >
                            {link.label}
                        </a>
                    ))}
                </div>

                {/* Acciones principales */}
                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Botón Ingresar para clientes existentes */}
                    <a
                        href={ADMIN_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white transition-colors"
                        title="Acceso al panel de administración"
                    >
                        Ya tengo cuenta
                        <ExternalLink size={12} className="opacity-70" />
                    </a>

                    {/* Selector de tema */}
                    <button
                        type="button"
                        aria-label="Cambiar tema"
                        onClick={onThemeChange}
                        className="grid h-9 w-9 place-items-center rounded-[5px] border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                    >
                        {dark ? <Sun size={15} /> : <Moon size={15} />}
                    </button>

                    {/* Botón de conversión principal */}
                    <button
                        type="button"
                        onClick={onSubscribe}
                        className="btn-primary rounded-[5px] px-4 py-2 text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md transition-all"
                    >
                        Contratar
                    </button>

                    {/* Hamburguesa móvil */}
                    <button
                        type="button"
                        aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="grid h-9 w-9 place-items-center rounded-[5px] border border-slate-200 text-slate-700 md:hidden hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
                    >
                        {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
                    </button>
                </div>
            </nav>

            {/* Menú desplegable móvil */}
            {mobileMenuOpen && (
                <div className="border-b border-slate-200 bg-white/98 px-5 py-4 shadow-lg md:hidden dark:border-slate-800 dark:bg-slate-950/98 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex flex-col gap-3 font-medium text-sm text-slate-700 dark:text-slate-200">
                        {navLinks.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                onClick={handleLinkClick}
                                className="py-1.5 hover:text-emerald-600 dark:hover:text-emerald-400"
                            >
                                {link.label}
                            </a>
                        ))}
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            <a
                                href={ADMIN_URL}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 py-1"
                            >
                                Ingresar al Panel de Control
                                <ExternalLink size={12} />
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </header>
    )
}