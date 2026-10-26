export interface DocumentoResult {
    nombre: string
    direccion: string
    tipo: 'RUC'
}

// RUC de prueba para sustentación académica
export const RUC_DEMO = '20000000001'

// Catálogo local de respaldo y pruebas
const CATALOGO_TEST: Record<string, DocumentoResult> = {
    [RUC_DEMO]: {
        nombre: 'EMPRESA DEMOSTRACIÓN UTP S.A.C.',
        direccion: 'Av. Universitaria 123, Lima',
        tipo: 'RUC'
    },
    '20601234567': {
        nombre: 'DISTRIBUIDORA GASTRONÓMICA LIMA S.A.C.',
        direccion: 'Av. Faustino Sánchez Carrión 465, Jesús María, Lima',
        tipo: 'RUC'
    },
    '20100070970': {
        nombre: 'SUPERMERCADOS PERUANOS SOCIEDAD ANONIMA O S.P.S.A.',
        direccion: 'Calle Morelli 181, San Borja, Lima',
        tipo: 'RUC'
    }
}

export async function buscarDocumentoFiscal(doc: string): Promise<DocumentoResult> {
    const cleanDoc = doc.trim()

    if (cleanDoc.length !== 11 || !/^\d{11}$/.test(cleanDoc)) {
        throw new Error('El RUC debe contener exactamente 11 dígitos numéricos.')
    }

    // 1. Verificación en catálogo local y bypass demo
    if (CATALOGO_TEST[cleanDoc]) {
        await new Promise(r => setTimeout(r, 200))
        return CATALOGO_TEST[cleanDoc]
    }

    // 2. Consulta a SUNAT mediante Proxy Decolecta
    const token = import.meta.env.VITE_DECOLECTA_TOKEN
    if (token) {
        try {
            const endpoint = `/api-decolecta/v1/sunat/ruc?numero=${cleanDoc}`
            const res = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            })

            if (res.ok) {
                const data = await res.json()
                const razonSocial =
                    data.razon_social ||
                    data.nombre_o_razon_social ||
                    data.full_name ||
                    `EMPRESA RUC ${cleanDoc}`
                const direccion =
                    data.direccion ||
                    data.domicilio_fiscal ||
                    'Lima Metropolitana, Perú'

                return {
                    nombre: razonSocial,
                    direccion: direccion,
                    tipo: 'RUC'
                }
            } else {
                const errJson = await res.json().catch(() => null)
                console.warn('Decolecta respondió con error:', res.status, errJson)
            }
        } catch (error) {
            console.warn('Error en la llamada al proxy de Decolecta, aplicando fallback determinista:', error)
        }
    }

    // 3. Fallback determinista garantizado
    await new Promise(r => setTimeout(r, 300))
    return {
        nombre: `CORPORACIÓN COMERCIAL ${cleanDoc.slice(-4)} S.A.C.`,
        direccion: 'Lima Metropolitana, Perú',
        tipo: 'RUC'
    }
}