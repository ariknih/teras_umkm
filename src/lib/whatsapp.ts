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
  const activeKey = gatewayKey || process.env.TWILIO_ACCOUNT_SID || process.env.FONNTE_API_TOKEN || 'TERAS_DEFAULT_GATEWAY_KEY'
  
  console.log(`[WA Gateway API - ${activeKey}] Mengirim ke ${recipientPhone} (${recipientName}): ${message}`)

  try {
    const twilioSid = process.env.TWILIO_ACCOUNT_SID
    const twilioToken = process.env.TWILIO_AUTH_TOKEN
    const twilioFrom = process.env.TWILIO_PHONE_NUMBER // e.g., 'whatsapp:+14155238886'

    const fonnteToken = process.env.FONNTE_API_TOKEN || (gatewayKey && gatewayKey !== 'TERAS_DEFAULT_GATEWAY_KEY' && !gatewayKey.includes('demo') ? gatewayKey : null)

    if (twilioSid && twilioToken && twilioFrom) {
      // Format recipient phone number to have country code if missing
      let formattedPhone = recipientPhone
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+62' + formattedPhone.slice(1)
      } else if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+' + formattedPhone
      }

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          To: `whatsapp:${formattedPhone}`,
          From: twilioFrom,
          Body: message
        })
      })
      if (!response.ok) {
        console.warn('Twilio WA gateway returned error status:', response.status)
        const errText = await response.text()
        console.warn('Twilio error details:', errText)
      } else {
        const resData = await response.json()
        console.log('Twilio send response:', resData)
      }
    } else if (fonnteToken) {
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
