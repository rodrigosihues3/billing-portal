export type Plan = 'starter' | 'growth' | 'enterprise' | 'trial'
export type PaymentMethod = 'yape' | 'card'
export interface PlanInfo { id: Plan; name: string; price: number; description: string; features: string[] }
export interface BillingForm { email: string; password: string; document: string; businessName: string; phone: string; otp: string; card: string; expiry: string; cvv: string }
export interface Transaction { id: string; businessName: string; email: string; plan: Plan }
export const plans: PlanInfo[] = [
  { id: 'starter', name: 'Starter', price: 99, description: 'Para iniciar tu delivery propio.', features: ['2 repartidores activos', '300 pedidos al mes', 'Panel, preparación y app del repartidor', 'Enlace de seguimiento con PIN'] },
  { id: 'growth', name: 'Growth', price: 199, description: 'Para negocios que ya venden por web.', features: ['5 repartidores activos', '1,000 pedidos al mes', 'Conexión con tu tienda web o sistema de ventas'] },
  { id: 'enterprise', name: 'Enterprise', price: 399, description: 'Para equipos y sedes conectadas.', features: ['Repartidores ilimitados', '3,000 pedidos al mes', 'Operación multisede', 'Soporte técnico directo'] },
  { id: 'trial', name: 'Prueba gratuita', price: 0, description: 'Prueba las capacidades del plan Starter.', features: ['14 días sin costo', 'Capacidades del plan Starter'] },
]
