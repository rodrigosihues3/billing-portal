import { supabase } from './supabaseClient'
import { plans, type BillingForm, type PaymentMethod, type Plan, type Transaction } from '../types/billing'

export interface ProvisioningInput {
    form: BillingForm
    plan: Plan
    method: PaymentMethod
}

export async function processOnboarding({ form, plan, method }: ProvisioningInput): Promise<Transaction> {
    const selectedPlan = plans.find(p => p.id === plan)!
    const txCode = `TX-${Math.random().toString(36).slice(2, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`
    const cleanBusinessName = form.businessName.trim() || form.email.split('@')[0].toUpperCase()

    // 1. Registro de usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password
    })

    if (authError) {
        throw new Error(`Error de autenticación: ${authError.message}`)
    }

    const userId = authData.user?.id
    if (!userId) {
        throw new Error('No se pudo obtener el identificador del usuario registrado.')
    }

    // 2. Invocar la función RPC atómica
    const isTrial = plan === 'trial'
    const payMethod = isTrial ? 'TRIAL' : (method === 'yape' ? 'YAPE' : 'TARJETA')
    const amountToCharge = isTrial ? 0 : selectedPlan.price

    const { error: rpcError } = await supabase.rpc('provision_new_tenant', {
        p_user_id: userId,
        p_business_name: cleanBusinessName,
        p_phone: form.phone || null,
        p_plan: plan.toUpperCase(),
        p_amount: amountToCharge,
        p_payment_method: payMethod,
        p_tx_code: txCode,
        p_card_last_four: method === 'card' && !isTrial ? form.card.slice(-4) : null,
        p_yape_phone: method === 'yape' && !isTrial ? form.phone : null
    })

    if (rpcError) {
        throw new Error(`Error en el aprovisionamiento de datos: ${rpcError.message}`)
    }

    return {
        id: txCode,
        businessName: cleanBusinessName,
        email: form.email,
        plan
    }
}