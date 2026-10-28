// @ts-ignore: Deno URL import resolved at runtime in Supabase Edge Functions
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
// @ts-ignore: Deno URL import resolved at runtime in Supabase Edge Functions
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.9";

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export interface SubscriptionEmailPayload {
  customer_email: string;
  customer_name: string;
  plan_id: string; // 'starter' | 'growth' | 'enterprise' | 'trial'
  plan_name: string;
  amount: number;
  order_number: string;
  invoice_data?: {
    type: "boleta" | "factura";
    document_number: string;
    business_name: string;
  };
  app_url?: string;
}

interface PrivateConfigRow {
  key: string;
  value: string;
}

interface PlanSpec {
  ordersLimit: string;
  driversLimit: string;
}

const PLAN_SPECS: Record<string, PlanSpec> = {
  starter: {
    ordersLimit: "Hasta 300 pedidos completados / mes",
    driversLimit: "Hasta 2 repartidores activos + Conexión directa por API",
  },
  growth: {
    ordersLimit: "Hasta 1,000 pedidos completados / mes",
    driversLimit: "Hasta 5 repartidores activos + Conexión directa por API",
  },
  enterprise: {
    ordersLimit: "Hasta 3,000 pedidos completados / mes",
    driversLimit: "Repartidores activos ilimitados + Operación multisede + API",
  },
  trial: {
    ordersLimit: "Hasta 1,000 pedidos completados / mes (14 días gratis)",
    driversLimit: "Hasta 5 repartidores activos + Conexión directa por API (100% Plan Growth)",
  },
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function generateInvoicePdf(
  payload: SubscriptionEmailPayload
): Promise<{ filename: string; base64: string }> {
  const invoice = payload.invoice_data!;
  const isFactura = invoice.type === "factura";
  const correlative = (payload.order_number || "000001").slice(-6).toUpperCase();
  const seriesCode = isFactura ? `F001-${correlative}` : `B001-${correlative}`;
  const docTitle = isFactura
    ? `FACTURA ELECTRÓNICA ${seriesCode}`
    : `BOLETA DE VENTA ELECTRÓNICA ${seriesCode}`;
  const issueDate = new Date().toISOString().slice(0, 10);

  const totalAmount = Number(payload.amount || 0);
  const opGravada = totalAmount / 1.18;
  const igvAmount = totalAmount - opGravada;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontMono = await pdfDoc.embedFont(StandardFonts.Courier);
  const fontMonoBold = await pdfDoc.embedFont(StandardFonts.CourierBold);

  const slateDark = rgb(0.06, 0.09, 0.16);
  const emeraldAccent = rgb(0.02, 0.59, 0.41);
  const slateMuted = rgb(0.39, 0.45, 0.55);
  const borderLight = rgb(0.88, 0.91, 0.94);
  const bgSoft = rgb(0.97, 0.98, 0.99);
  const white = rgb(1, 1, 1);

  // 1. Franja superior slate oscuro y acento verde esmeralda
  page.drawRectangle({
    x: 0,
    y: height - 115,
    width,
    height: 115,
    color: slateDark,
  });

  page.drawRectangle({
    x: 0,
    y: height - 119,
    width,
    height: 4,
    color: emeraldAccent,
  });

  // Datos del emisor en cabecera
  page.drawText("DELIVERY TRACKER S.A.C.", {
    x: 45,
    y: height - 48,
    size: 16,
    font: fontBold,
    color: white,
  });

  page.drawText("RUC: 20609876543  |  Dirección: Lima, Perú", {
    x: 45,
    y: height - 68,
    size: 10,
    font: fontMono,
    color: rgb(0.75, 0.82, 0.9),
  });

  page.drawText("Logística y Despacho sin Comisiones", {
    x: 45,
    y: height - 86,
    size: 9.5,
    font: fontRegular,
    color: emeraldAccent,
  });

  // Recuadro fiscal derecho en cabecera
  const boxWidth = 225;
  const boxHeight = 68;
  const boxX = width - boxWidth - 45;
  const boxY = height - 92;

  page.drawRectangle({
    x: boxX,
    y: boxY,
    width: boxWidth,
    height: boxHeight,
    color: rgb(0.11, 0.16, 0.25),
    borderColor: emeraldAccent,
    borderWidth: 1.2,
  });

  page.drawText("R.U.C. 20609876543", {
    x: boxX + 16,
    y: boxY + 46,
    size: 10,
    font: fontMonoBold,
    color: white,
  });

  page.drawText(
    isFactura ? "FACTURA ELECTRÓNICA" : "BOLETA DE VENTA ELECTRÓNICA",
    {
      x: boxX + 16,
      y: boxY + 29,
      size: 9.5,
      font: fontBold,
      color: emeraldAccent,
    }
  );

  page.drawText(seriesCode, {
    x: boxX + 16,
    y: boxY + 12,
    size: 11,
    font: fontMonoBold,
    color: white,
  });

  // 2. Sección de Datos del Receptor / Cliente
  let cursorY = height - 155;

  page.drawText("DATOS DEL RECEPTOR", {
    x: 45,
    y: cursorY,
    size: 9.5,
    font: fontMonoBold,
    color: emeraldAccent,
  });

  cursorY -= 14;
  page.drawRectangle({
    x: 45,
    y: cursorY - 88,
    width: width - 90,
    height: 88,
    color: bgSoft,
    borderColor: borderLight,
    borderWidth: 1,
  });

  const receptorName =
    invoice.business_name || payload.customer_name || "Cliente";
  const docLabel = isFactura ? "RUC del Cliente:" : "DNI del Cliente:";
  const nameLabel = isFactura ? "Razón Social:" : "Nombre Completo:";

  page.drawText(nameLabel, {
    x: 60,
    y: cursorY - 24,
    size: 9.5,
    font: fontBold,
    color: slateMuted,
  });
  page.drawText(receptorName.slice(0, 58), {
    x: 165,
    y: cursorY - 24,
    size: 10,
    font: fontBold,
    color: slateDark,
  });

  page.drawText(docLabel, {
    x: 60,
    y: cursorY - 44,
    size: 9.5,
    font: fontBold,
    color: slateMuted,
  });
  page.drawText(invoice.document_number, {
    x: 165,
    y: cursorY - 44,
    size: 10,
    font: fontMonoBold,
    color: slateDark,
  });

  page.drawText("Fecha de Emisión:", {
    x: 60,
    y: cursorY - 64,
    size: 9.5,
    font: fontBold,
    color: slateMuted,
  });
  page.drawText(issueDate, {
    x: 165,
    y: cursorY - 64,
    size: 10,
    font: fontMono,
    color: slateDark,
  });

  page.drawText("Moneda:", {
    x: 340,
    y: cursorY - 44,
    size: 9.5,
    font: fontBold,
    color: slateMuted,
  });
  page.drawText("Soles (PEN)", {
    x: 415,
    y: cursorY - 44,
    size: 10,
    font: fontRegular,
    color: slateDark,
  });

  page.drawText("Ticket Origen:", {
    x: 340,
    y: cursorY - 64,
    size: 9.5,
    font: fontBold,
    color: slateMuted,
  });
  page.drawText(payload.order_number, {
    x: 415,
    y: cursorY - 64,
    size: 9.5,
    font: fontMono,
    color: slateDark,
  });

  // 3. Detalle de la Transacción
  cursorY -= 125;
  page.drawText("DETALLE DEL SERVICIO FACTURADO", {
    x: 45,
    y: cursorY,
    size: 9.5,
    font: fontMonoBold,
    color: emeraldAccent,
  });

  cursorY -= 12;
  // Cabecera de tabla
  page.drawRectangle({
    x: 45,
    y: cursorY - 26,
    width: width - 90,
    height: 26,
    color: slateDark,
  });

  page.drawText("CANT.", {
    x: 58,
    y: cursorY - 17,
    size: 8.5,
    font: fontMonoBold,
    color: white,
  });
  page.drawText("DESCRIPCIÓN / CONCEPTO", {
    x: 115,
    y: cursorY - 17,
    size: 8.5,
    font: fontMonoBold,
    color: white,
  });
  page.drawText("V. UNITARIO", {
    x: 380,
    y: cursorY - 17,
    size: 8.5,
    font: fontMonoBold,
    color: white,
  });
  page.drawText("IMPORTE", {
    x: 475,
    y: cursorY - 17,
    size: 8.5,
    font: fontMonoBold,
    color: white,
  });

  // Fila de concepto
  cursorY -= 26;
  page.drawRectangle({
    x: 45,
    y: cursorY - 42,
    width: width - 90,
    height: 42,
    color: white,
    borderColor: borderLight,
    borderWidth: 1,
  });

  page.drawText("1", {
    x: 65,
    y: cursorY - 24,
    size: 10,
    font: fontMono,
    color: slateDark,
  });
  page.drawText(`Suscripción mensual - Plan ${payload.plan_name}`, {
    x: 115,
    y: cursorY - 19,
    size: 10,
    font: fontBold,
    color: slateDark,
  });
  page.drawText(docTitle, {
    x: 115,
    y: cursorY - 33,
    size: 8.5,
    font: fontMono,
    color: slateMuted,
  });
  page.drawText(`S/ ${opGravada.toFixed(2)}`, {
    x: 380,
    y: cursorY - 24,
    size: 10,
    font: fontMono,
    color: slateDark,
  });
  page.drawText(`S/ ${totalAmount.toFixed(2)}`, {
    x: 475,
    y: cursorY - 24,
    size: 10,
    font: fontMonoBold,
    color: slateDark,
  });

  // 4. Desglose Contable Formal
  cursorY -= 66;
  const summaryWidth = 235;
  const summaryX = width - summaryWidth - 45;

  page.drawRectangle({
    x: summaryX,
    y: cursorY - 82,
    width: summaryWidth,
    height: 82,
    color: bgSoft,
    borderColor: borderLight,
    borderWidth: 1,
  });

  page.drawText("Valor Venta (Op. Gravada):", {
    x: summaryX + 12,
    y: cursorY - 20,
    size: 9,
    font: fontRegular,
    color: slateMuted,
  });
  page.drawText(`S/ ${opGravada.toFixed(2)}`, {
    x: summaryX + 155,
    y: cursorY - 20,
    size: 9.5,
    font: fontMono,
    color: slateDark,
  });

  page.drawText("IGV (18%):", {
    x: summaryX + 12,
    y: cursorY - 40,
    size: 9,
    font: fontRegular,
    color: slateMuted,
  });
  page.drawText(`S/ ${igvAmount.toFixed(2)}`, {
    x: summaryX + 155,
    y: cursorY - 40,
    size: 9.5,
    font: fontMono,
    color: slateDark,
  });

  page.drawLine({
    start: { x: summaryX + 10, y: cursorY - 50 },
    end: { x: summaryX + summaryWidth - 10, y: cursorY - 50 },
    thickness: 1,
    color: borderLight,
  });

  page.drawText("Importe Total:", {
    x: summaryX + 12,
    y: cursorY - 68,
    size: 10.5,
    font: fontBold,
    color: emeraldAccent,
  });
  page.drawText(`S/ ${totalAmount.toFixed(2)}`, {
    x: summaryX + 150,
    y: cursorY - 68,
    size: 11,
    font: fontMonoBold,
    color: slateDark,
  });

  // 5. Pie de página con leyenda reglamentaria
  page.drawLine({
    start: { x: 45, y: 78 },
    end: { x: width - 45, y: 78 },
    thickness: 1,
    color: borderLight,
  });

  page.drawText(
    "Representación impresa de Comprobante de Pago Electrónico simulado para fines académicos",
    {
      x: 45,
      y: 58,
      size: 8.5,
      font: fontRegular,
      color: slateMuted,
    }
  );

  page.drawText("Delivery Tracker S.A.C. · Portal de Facturación y Suscripciones", {
    x: 45,
    y: 43,
    size: 8,
    font: fontMono,
    color: emeraldAccent,
  });

  const base64 = await pdfDoc.saveAsBase64();
  return {
    filename: `${seriesCode}.pdf`,
    base64,
  };
}

function buildSubscriptionHtml(payload: SubscriptionEmailPayload): string {
  const normalizedPlanId = (payload.plan_id || "growth").toLowerCase();
  const spec = PLAN_SPECS[normalizedPlanId] || PLAN_SPECS.growth;
  const baseAppUrl = (payload.app_url || "http://localhost:3000").replace(/\/$/, "");
  const formattedAmount = Number(payload.amount || 0).toFixed(0);

  const invoiceDocLabel =
    payload.invoice_data?.type === "factura"
      ? "Factura Electrónica"
      : "Boleta de Venta";

  const invoiceSection = payload.invoice_data
    ? `
      <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0 0 12px 0; font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #475569;">
          Comprobante Electrónico Emitido
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border: 1px solid #e2e8f0; border-radius: 5px; background-color: #f8fafc; font-size: 13px; color: #0f172a;">
          <tr>
            <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #64748b; width: 42%;">Tipo de comprobante</td>
            <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 600; text-align: right; text-transform: uppercase; font-family: 'JetBrains Mono', monospace;">
              ${invoiceDocLabel}
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #64748b;">
              ${payload.invoice_data.type === "factura" ? "RUC" : "DNI"}
            </td>
            <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 600; text-align: right; font-family: 'JetBrains Mono', monospace;">
              ${escapeHtml(payload.invoice_data.document_number)}
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 14px; color: #64748b;">
              ${payload.invoice_data.type === "factura" ? "Razón Social" : "Titular"}
            </td>
            <td style="padding: 10px 14px; font-weight: 600; text-align: right;">
              ${escapeHtml(payload.invoice_data.business_name)}
            </td>
          </tr>
        </table>

        <div style="margin-top: 14px; padding: 12px 14px; border: 1px solid #a7f3d0; border-radius: 5px; background-color: #ecfdf5; font-size: 13px; line-height: 1.5; color: #065f46;">
          📎 Comprobante adjunto: Hemos emitido tu ${invoiceDocLabel} y la encuentras adjunta a este mensaje en formato PDF.
        </div>
      </div>
    `
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirmación de Suscripción - Delivery Tracker</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #f1f5f9; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center">
        <div style="border: 1px solid #e2e8f0; border-radius: 5px; max-width: 600px; width: 100%; background-color: #ffffff; overflow: hidden; text-align: left;">
          <div style="height: 4px; background-color: #059669;"></div>

          <div style="padding: 24px 28px 20px 28px; border-bottom: 1px solid #e2e8f0; background-color: #0f172a; color: #ffffff;">
            <p style="margin: 0; font-family: 'Plus Jakarta Sans', 'Inter', sans-serif; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; color: #ffffff;">
              Delivery Tracker
            </p>
            <p style="margin: 4px 0 0 0; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #34d399;">
              Logística y Despacho sin Comisiones
            </p>
          </div>

          <div style="padding: 28px;">
            <span style="display: inline-block; padding: 4px 10px; border-radius: 5px; background-color: #ecfdf5; border: 1px solid #a7f3d0; font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; color: #047857;">
              SUSCRIPCIÓN ACTIVA
            </span>

            <h1 style="margin: 16px 0 8px 0; font-family: 'Plus Jakarta Sans', 'Inter', sans-serif; font-size: 22px; font-weight: 700; color: #0f172a;">
              Hola, ${escapeHtml(payload.customer_name || "Administrador")}
            </h1>
            <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
              Confirmamos el alta exitosa de tu suscripción en <strong>Delivery Tracker</strong>. Tu entorno operativo ya se encuentra aprovisionado para gestionar pedidos, cocina y flota en tiempo real.
            </p>

            <div style="margin-bottom: 20px; padding: 12px 16px; border: 1px dashed #cbd5e1; border-radius: 5px; background-color: #f8fafc;">
              <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b;">
                Identificador de Operación / Ticket
              </span>
              <span style="display: block; margin-top: 4px; font-family: 'JetBrains Mono', monospace; font-size: 15px; font-weight: 700; color: #0f172a;">
                ${escapeHtml(payload.order_number)}
              </span>
            </div>

            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border: 1px solid #e2e8f0; border-radius: 5px; font-size: 13px; color: #0f172a;">
              <tr style="background-color: #f8fafc;">
                <td colspan="2" style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #334155;">
                  Resumen del Plan Contratado
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #64748b; width: 42%;">Plan</td>
                <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 700; text-align: right;">
                  ${escapeHtml(payload.plan_name)}
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Límite de pedidos</td>
                <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 600; text-align: right;">
                  ${escapeHtml(spec.ordersLimit)}
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Flota e integraciones</td>
                <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 600; text-align: right;">
                  ${escapeHtml(spec.driversLimit)}
                </td>
              </tr>
              <tr style="background-color: #ecfdf5;">
                <td style="padding: 12px 14px; font-weight: 700; color: #065f46;">Importe Total</td>
                <td style="padding: 12px 14px; font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 14px; text-align: right; color: #065f46;">
                  Total: S/ ${formattedAmount}.00 - Incluye IGV
                </td>
              </tr>
            </table>

            ${invoiceSection}

            <div style="margin-top: 28px; text-align: center;">
              <a href="${escapeHtml(baseAppUrl)}" style="display: inline-block; width: 100%; box-sizing: border-box; padding: 14px 20px; background-color: #0f172a; color: #ffffff; text-decoration: none; font-family: 'Plus Jakarta Sans', 'Inter', sans-serif; font-size: 14px; font-weight: 700; border-radius: 5px; text-align: center;">
                Acceder a mi Panel de Control
              </a>
            </div>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Obtener claves desde la tabla PostgreSQL protegida por RLS mediante service_role
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Variables internas de Supabase ausentes en el contenedor.");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: configs, error: configError } = await supabaseAdmin
      .from("private_app_config")
      .select("key, value")
      .in("key", ["BREVO_API_KEY", "SENDER_EMAIL"]);

    if (configError || !configs) {
      return new Response(
        JSON.stringify({
          sent: false,
          error: `Error accediendo a private_app_config: ${configError?.message}`,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const typedConfigs = configs as PrivateConfigRow[];
    const configMap = new Map<string, string>(
      typedConfigs.map((c: PrivateConfigRow) => [c.key, c.value])
    );
    const brevoApiKey = configMap.get("BREVO_API_KEY");
    const senderEmail = configMap.get("SENDER_EMAIL") || "sihues3@gmail.com";

    if (!brevoApiKey) {
      return new Response(
        JSON.stringify({
          sent: false,
          error: "Falta BREVO_API_KEY en private_app_config.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 2. Procesar el Payload recibido
    const payload = (await req.json()) as SubscriptionEmailPayload;

    if (!payload.customer_email || !payload.order_number) {
      return new Response(
        JSON.stringify({
          sent: false,
          error: "Faltan campos obligatorios (customer_email, order_number).",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 3. Generar PDF del comprobante si existe invoice_data
    let pdfAttachment: { name: string; content: string } | null = null;
    if (payload.invoice_data) {
      const { filename, base64 } = await generateInvoicePdf(payload);
      pdfAttachment = { name: filename, content: base64 };
    }

    const htmlContent = buildSubscriptionHtml(payload);
    const subject = payload.invoice_data
      ? `Delivery Tracker · Comprobante y Confirmación de Plan ${payload.plan_name} (#${payload.order_number})`
      : `Delivery Tracker · Confirmación de Suscripción Plan ${payload.plan_name} (#${payload.order_number})`;

    // 4. Construir y despachar el payload a la API REST de Brevo
    const brevoPayload: {
      sender: { name: string; email: string };
      to: Array<{ email: string; name: string }>;
      subject: string;
      htmlContent: string;
      attachment?: Array<{ name: string; content: string }>;
    } = {
      sender: {
        name: "Delivery Tracker",
        email: senderEmail,
      },
      to: [
        {
          email: payload.customer_email,
          name: payload.customer_name || payload.customer_email,
        },
      ],
      subject,
      htmlContent,
    };

    if (pdfAttachment) {
      brevoPayload.attachment = [pdfAttachment];
    }

    const brevoResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": brevoApiKey,
      },
      body: JSON.stringify(brevoPayload),
    });

    const data = await brevoResponse.json().catch(() => ({}));

    if (!brevoResponse.ok) {
      return new Response(
        JSON.stringify({
          sent: false,
          error: "Error despachando correo mediante Brevo API",
          details: data,
        }),
        {
          status: brevoResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ sent: true, data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error interno inesperado";
    return new Response(
      JSON.stringify({ sent: false, error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
