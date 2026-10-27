import { useState } from 'react'
import { Navbar } from './components/Navbar'
import { Hero } from './components/Hero'
import { Metrics } from './components/Metrics'
import { Pricing } from './components/Pricing'
import { Modules } from './components/Modules'
import { Footer } from './components/Footer'
import { CheckoutModal } from './components/CheckoutModal'
import type { Plan } from './types/billing'

export function App() {
  const [dark, setDark] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)

  const toggleTheme = () => {
    setDark(prev => {
      const next = !prev
      if (next) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      return next
    })
  }

  // Desde los botones de planes o Hero: abre con plan definido
  const handleOpenWithPlan = (plan: Plan) => {
    setSelectedPlan(plan)
    setModalOpen(true)
  }

  // Desde el botón "Suscribirme" de la Navbar: abre con selector de plan (Paso 0)
  const handleOpenGeneral = () => {
    setSelectedPlan(null)
    setModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50/60 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100 transition-colors">
      <Navbar dark={dark} onThemeChange={toggleTheme} onSubscribe={handleOpenGeneral} />
      <Hero onStart={handleOpenWithPlan} />
      <Metrics />
      <Pricing onSelect={handleOpenWithPlan} />
      <Modules />
      <Footer />

      {modalOpen && (
        <CheckoutModal
          initialPlan={selectedPlan}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}

export default App