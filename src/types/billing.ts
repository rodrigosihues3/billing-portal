export type Plan = 'starter' | 'growth' | 'enterprise' | 'trial'
export type PaymentMethod = 'yape' | 'card'
export interface PlanInfo { id: Plan; name: string; price: number; description: string; features: string[] }
export interface BillingForm { email: string; password: string; document: string; businessName: string; phone: string; otp: string; card: string; expiry: string; cvv: string }
export interface Transaction { id: string; businessName: string; email: string; plan: Plan }
export const plans: PlanInfo[] = [
  { id: 'starter', name: 'Starter', price: 99, description: 'Para iniciar una operación propia.', features: ['2 motorizados activos', '300 pedidos mensuales', 'Pantalla KDS', 'Enlace de rastreo'] },
  { id: 'growth', name: 'Growth', price: 199, description: 'Para operaciones en crecimiento.', features: ['5 motorizados activos', '1,000 pedidos mensuales', 'API REST para tu POS', 'Geocercas de entrega'] },
  { id: 'enterprise', name: 'Enterprise', price: 399, description: 'Para equipos y sedes conectadas.', features: ['Motorizados ilimitados', '3,000 pedidos mensuales', 'Operación multisede', 'Soporte técnico directo'] },
  { id: 'trial', name: 'Prueba gratuita', price: 0, description: 'Conoce la operación completa.', features: ['14 días sin costo'] },
]
