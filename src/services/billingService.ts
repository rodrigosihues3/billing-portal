import { supabase } from './supabaseClient'
import { plans, type Plan, type Transaction } from '../types/billing'
import { RUC_DEMO } from './decolectaService'

// 1. Verificación de duplicidad en Supabase
export async function checkRucAvailability(ruc: string): Promise<boolean> {
    const cleanRuc = ruc.trim()

    // Bypass para sustentación: el RUC de demostración siempre está disponible
    if (cleanRuc === RUC_DEMO) {
        return true
    }

    if (cleanRuc.length !== 11) {
        return true
    }

    const { data, error } = await supabase.rpc('check_ruc_exists', {
        p_ruc: cleanRuc
    })

    if (error) {
        console.warn('Error al verificar RUC en Supabase:', error.message)
        return true // Permite continuar si falla la comprobación de red
    }

    // Si existe en la base de datos (true), no está disponible (false)
    return !data
}

// 2. Registro inicial de credenciales y envío de confirmación
export async function registerAdminUser(email: string, password: string) {
    const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined

    const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
            emailRedirectTo: redirectUrl
        }
    })

    if (error) {
        throw new Error(`Error en el registro: ${error.message}`)
    }

    return data
}

// 3. Reenvío de correo de confirmación
export async function resendVerificationEmail(email: string) {
    const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined

    const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: {
            emailRedirectTo: redirectUrl
        }
    })

    if (error) {
        throw new Error(`No se pudo reenviar el correo: ${error.message}`)
    }
}

// 4. Comprobación de estado de confirmación de correo
export async function checkEmailVerified(): Promise<{ verified: boolean; userId?: string }> {
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        return { verified: false }
    }

    return {
        verified: Boolean(user.email_confirmed_at),
        userId: user.id
    }
}

// 5. Aprovisionamiento final atómico
export interface ProvisioningPayload {
    userId: string
    businessName: string
    phone?: string
    plan: Plan
    method: 'YAPE' | 'TARJETA' | 'TRIAL'
    ruc?: string
    cardLastFour?: string
    yapePhone?: string
}

export async function executeProvisioning(payload: ProvisioningPayload): Promise<Transaction> {
    const selectedPlan = plans.find(p => p.id === payload.plan)!
    const txCode = `TX-${Math.random().toString(36).slice(2, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`
    const isTrial = payload.plan === 'trial'
    const amountToCharge = isTrial ? 0 : selectedPlan.price

    const { error } = await supabase.rpc('provision_new_tenant', {
        p_user_id: payload.userId,
        p_business_name: payload.businessName.trim(),
        p_phone: payload.phone || null,
        p_plan: payload.plan.toUpperCase(),
        p_amount: amountToCharge,
        p_payment_method: payload.method,
        p_tx_code: txCode,
        p_card_last_four: payload.cardLastFour || null,
        p_yape_phone: payload.yapePhone || null,
        p_ruc: payload.ruc || null
    })

    if (error) {
        throw new Error(`Error al crear la organización en base de datos: ${error.message}`)
    }

    const { data: { user } } = await supabase.auth.getUser()

    return {
        id: txCode,
        businessName: payload.businessName,
        email: user?.email || '',
        plan: payload.plan
    }
}