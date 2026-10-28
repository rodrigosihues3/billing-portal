export type Plan = 'starter' | 'growth' | 'enterprise' | 'trial'
export type PaymentMethod = 'yape' | 'card'
export interface PlanInfo { id: Plan; name: string; price: number; description: string; features: string[] }
export interface BillingForm {
  name: string
  email: string
  password: string
  confirmPassword: string
  document: string
  businessName: string
  phone: string
  otp: string
  card: string
  cardHolder: string
  expiry: string
  cvv: string
}
export interface Transaction { id: string; businessName: string; email: string; plan: Plan }
export const plans: PlanInfo[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 99,
    description: 'Para iniciar tu delivery propio por WhatsApp o web.',
    features: [
      '2 repartidores activos',
      '300 pedidos al mes',
      'Conexión directa por API',
      'Panel, preparación y app del repartidor',
      'Enlace de seguimiento con PIN'
    ]
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 199,
    description: 'Para negocios en expansión con volumen regular de entregas.',
    features: [
      '5 repartidores activos',
      '1,000 pedidos al mes',
      'Conexión directa por API y sincronización en tiempo real',
      'Asignación optimizada e historial exportable'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 399,
    description: 'Para equipos y sedes conectadas.',
    features: [
      'Repartidores ilimitados',
      '3,000 pedidos al mes',
      'Operación multisede y conexión directa por API',
      'Soporte técnico directo'
    ]
  },
  {
    id: 'trial',
    name: 'Prueba gratuita',
    price: 0,
    description: 'Prueba durante 14 días el 100% de las capacidades del Plan Starter.',
    features: [
      '14 días sin costo',
      '300 pedidos/mes y 2 repartidores activos',
      'Conexión directa por API incluida'
    ]
  },
]
