import { DataStore } from '@/lib/data-store'

interface WaMessageOptions {
  merchantId: string
  merchantName: string
  recipientName: string
  recipientPhone: string
  message: string
  gatewayKey?: string
}

export async function sendWhatsAppMessage({
  merchantId,
  merchantName,
  recipientName,
  recipientPhone,
  message,
  gatewayKey
}: WaMessageOptions) {
  const activeKey = gatewayKey || 'TERAS_DEFAULT_GATEWAY_KEY'
  
  console.log(`[WA Gateway API - ${activeKey}] Mengirim ke ${recipientPhone} (${recipientName}): ${message}`)

  try {
    // If the gateway key looks like a real API key, we could send a real HTTP request here:
    if (gatewayKey && gatewayKey !== 'TERAS_DEFAULT_GATEWAY_KEY' && !gatewayKey.includes('demo')) {
      const response = await fetch('https://api.komerce.id/wa-gateway/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${gatewayKey}`
        },
        body: JSON.stringify({
          phone: recipientPhone,
          message: message
        })
      })
      if (!response.ok) {
        console.warn('Real WA gateway returned error status:', response.status)
      }
    }

    // Always log to simulated logs for merchant dashboard preview
    await DataStore.addWaLog(
      merchantId,
      merchantName,
      activeKey,
      `${recipientPhone} (${recipientName})`,
      message,
      'SUCCESS'
    )
  } catch (err) {
    console.error('Error sending WA message:', err)
  }
}
