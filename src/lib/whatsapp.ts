import { DataStore } from '@/lib/data-store'

interface WaMessageOptions {
  merchantId: string
  merchantName: string
  recipientName: string
  recipientPhone: string
  message: string
  gatewayKey?: string
}

async function postFonnte(token: string, target: string, message: string): Promise<boolean> {
  try {
    const res = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ target, message })
    })
    if (res.ok) {
      console.log('Fonnte send success')
      return true
    }
    console.warn('Fonnte send status:', res.status)
  } catch (err) {
    console.error('Error sending Fonnte:', err)
  }
  return false
}

export async function sendWhatsAppMessage({
  merchantId,
  merchantName,
  recipientName,
  recipientPhone,
  message,
  gatewayKey
}: WaMessageOptions) {
  const kirimiUserCode = process.env.KIRIMI_USER_CODE
  const kirimiSecret = process.env.KIRIMI_SECRET
  const kirimiDeviceId = process.env.KIRIMI_DEVICE_ID

  const activeKey = gatewayKey || kirimiUserCode || process.env.TWILIO_ACCOUNT_SID || process.env.FONNTE_API_TOKEN || 'TERAS_DEFAULT_GATEWAY_KEY'
  
  console.log(`[WA Gateway API - ${activeKey}] Mengirim ke ${recipientPhone} (${recipientName}): ${message}`)

  let success = false

  // 1. Try custom merchant Fonnte key first if provided
  const isCustomKey = gatewayKey && gatewayKey !== 'TERAS_DEFAULT_GATEWAY_KEY' && !gatewayKey.includes('demo')
  if (isCustomKey) {
    success = await postFonnte(gatewayKey!, recipientPhone, message)
  }

  // 2. If not sent yet, try Kirimi if configured
  if (!success && kirimiUserCode && kirimiSecret && kirimiDeviceId) {
    try {
      let formattedPhone = recipientPhone.replace(/[^0-9]/g, '')
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '62' + formattedPhone.slice(1)
      }

      const response = await fetch('https://api.kirimi.id/v1/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_code: kirimiUserCode,
          secret: kirimiSecret,
          device_id: kirimiDeviceId,
          receiver: formattedPhone,
          message: message
        })
      })

      if (response.ok) {
        console.log('Kirimi send response success')
        success = true
      } else {
        console.warn('Kirimi WA gateway returned error status:', response.status)
      }
    } catch (err) {
      console.error('Error sending Kirimi:', err)
    }
  }

  // 3. If not sent yet, try Twilio if configured
  if (!success && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
    try {
      const twilioSid = process.env.TWILIO_ACCOUNT_SID
      const twilioToken = process.env.TWILIO_AUTH_TOKEN
      const twilioFrom = process.env.TWILIO_PHONE_NUMBER

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
      if (response.ok) {
        console.log('Twilio send response success')
        success = true
      } else {
        console.warn('Twilio WA gateway returned error status:', response.status)
      }
    } catch (err) {
      console.error('Error sending Twilio:', err)
    }
  }

  // 4. If not sent yet, try default system Fonnte token
  if (!success && process.env.FONNTE_API_TOKEN) {
    success = await postFonnte(process.env.FONNTE_API_TOKEN, recipientPhone, message)
  }

  // Always log to simulated logs for merchant dashboard preview
  await DataStore.addWaLog(
    merchantId,
    merchantName,
    activeKey,
    `${recipientPhone} (${recipientName})`,
    message,
    success ? 'SUCCESS' : 'FAILED'
  )
}
