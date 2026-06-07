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
  const activeKey = gatewayKey || process.env.FONNTE_API_TOKEN || 'TERAS_DEFAULT_GATEWAY_KEY'
  
  console.log(`[WA Gateway API - ${activeKey}] Mengirim ke ${recipientPhone} (${recipientName}): ${message}`)

  try {
    const fonnteToken = process.env.FONNTE_API_TOKEN || (gatewayKey && gatewayKey !== 'TERAS_DEFAULT_GATEWAY_KEY' && !gatewayKey.includes('demo') ? gatewayKey : null)

    if (fonnteToken) {
      const response = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          'Authorization': fonnteToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          target: recipientPhone,
          message: message
        })
      })
      if (!response.ok) {
        console.warn('Fonnte WA gateway returned error status:', response.status)
      } else {
        const resData = await response.json()
        console.log('Fonnte send response:', resData)
      }
    } else {
      // Demo placeholder
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
