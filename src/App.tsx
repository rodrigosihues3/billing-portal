import { useEffect, useState } from 'react'
import { Navbar } from './components/Navbar'
import { Hero } from './components/Hero'
import { Audience } from './components/Audience'
import { Modules } from './components/Modules'
import { Metrics } from './components/Metrics'
import { Pricing } from './components/Pricing'
import { CtaSection } from './components/CtaSection'
import { Footer } from './components/Footer'
import { CheckoutModal } from './components/CheckoutModal'
import { LegalModal, type LegalModalType } from './components/LegalModal'
import type { Plan } from './types/billing'

export function App() {
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme')
      if (saved) return saved === 'dark'
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [legalModal, setLegalModal] = useState<LegalModalType>(null)

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [dark])

  const toggleTheme = () => {
    setDark((prev) => !prev)
  }

  // Desde los botones de planes o Hero: abre con plan definido
  const handleOpenWithPlan = (plan: Plan) => {
    setSelectedPlan(plan)
    setModalOpen(true)
  }

  // Desde el botón "Contratar" de la Navbar: abre con selector de plan (Paso 0)
  const handleOpenGeneral = () => {
    setSelectedPlan(null)
    setModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-emerald-500/20 selection:text-emerald-900 dark:bg-slate-950 dark:text-slate-100 dark:selection:text-emerald-200 transition-colors">
      <Navbar dark={dark} onThemeChange={toggleTheme} onSubscribe={handleOpenGeneral} />
      
      <main>
        {/* 1. Hero Principal con Carrusel interactivo */}
        <Hero onStart={handleOpenWithPlan} />

        {/* 2. Para quién es (2 modalidades: WhatsApp y API Web) */}
        <Audience />

        {/* 3. Cómo funciona (Recorrido secuencial de 5 estados y roles) */}
        <Modules />

        {/* 4. Beneficios: Comparativa Antes vs Con DT + Calculadora de ahorro */}
        <Metrics />

        {/* 5. Tarifas planas mensuales y prueba gratuita */}
        <Pricing onSelect={handleOpenWithPlan} />

        {/* 6. Franja de conversión final */}
        <CtaSection onStart={handleOpenWithPlan} />
      </main>

      {/* 7. Footer corporativo con WhatsApp directo y enlaces */}
      <Footer onOpenLegal={(type) => setLegalModal(type)} />

      {/* Modal de Contratación / Registro */}
      {modalOpen && (
        <CheckoutModal
          initialPlan={selectedPlan}
          onClose={() => setModalOpen(false)}
        />
      )}

      {/* Modal Legal de Términos / Privacidad */}
      <LegalModal
        type={legalModal}
        onClose={() => setLegalModal(null)}
      />
    </div>
  )
}

export default App