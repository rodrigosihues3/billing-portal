import { Check } from 'lucide-react'
import { plans, type Plan } from '../types/billing'

export function Pricing({ onSelect }: { onSelect: (plan: Plan) => void }) {
  return (
    <section id="planes" className="page-shell py-20">
      <div className="max-w-2xl">
        <p className="font-mono text-xs text-emerald-700 dark:text-emerald-400">SUSCRIPCIONES EN SOLES</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
          Una tarifa plana para cada etapa de tu operación.
        </h2>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          Sin porcentaje por pedido. Sin cargos sorpresa cuando tu negocio crece.
        </p>
      </div>

      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        {plans.filter(p => p.id !== 'trial').map(plan => {
          const featured = plan.id === 'growth'
          return (
            <article
              key={plan.id}
              className={`relative flex flex-col overflow-hidden rounded-[5px] border bg-white p-6 transition-shadow dark:bg-slate-900 ${
                featured
                  ? 'border-emerald-600 bg-emerald-50/30 shadow-xl ring-2 ring-emerald-500/20 dark:bg-emerald-950/20 lg:-translate-y-2'
                  : 'border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:hover:border-slate-700'
              }`}
            >
              {featured && <div className="absolute inset-x-0 top-0 h-1 bg-emerald-600" />}
              {featured && (
                <span className="absolute right-4 top-4 rounded-[5px] bg-emerald-600 px-2 py-1 font-mono text-[10px] font-semibold tracking-wider text-white">
                  RECOMENDADO
                </span>
              )}
              <h3 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">{plan.name}</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{plan.description}</p>
              <p className="my-6 font-mono text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                S/ {plan.price}
                <span className="text-sm font-normal text-slate-500"> / mes</span>
              </p>
              <ul className="space-y-3 border-t border-slate-200 pt-5 text-sm text-slate-700 dark:border-slate-800 dark:text-slate-300">
                {plan.features.map(f => (
                  <li key={f} className="flex gap-2">
                    <Check size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-emerald-600" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => onSelect(plan.id)}
                className={
                  featured
                    ? 'btn-cta mt-8 w-full py-3'
                    : 'mt-8 w-full rounded-[5px] border border-slate-300 bg-slate-100 py-3 font-semibold text-slate-800 hover:bg-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700'
                }
              >
                Elegir {plan.name}
              </button>
            </article>
          )
        })}
      </div>

      <div className="mt-6 flex flex-col gap-4 rounded-[5px] border border-slate-200 bg-slate-50 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900">
        <div>
          <p className="font-mono text-xs text-emerald-700 dark:text-emerald-400">PRUEBA GRATUITA · 14 DÍAS</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Explora la plataforma completa sin tarjeta y sin compromiso.
          </p>
        </div>
        <button
          onClick={() => onSelect('trial')}
          className="shrink-0 rounded-[5px] border border-emerald-600 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 dark:bg-transparent dark:text-emerald-400 dark:hover:bg-emerald-950/30"
        >
          Activar prueba gratuita
        </button>
      </div>
    </section>
  )
}
