interface SendEmailOptions {
  to: string
  toName?: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, toName, subject, html, text }: SendEmailOptions) {
  const apiKey = process.env.MAILEROO_API_KEY
  const fromAddress = process.env.MAILEROO_FROM_ADDRESS
  const fromName = process.env.MAILEROO_FROM_NAME || 'Saloka.id'

  if (!apiKey || !fromAddress) {
    console.error('Maileroo belum dikonfigurasi (MAILEROO_API_KEY / MAILEROO_FROM_ADDRESS kosong).')
    return { success: false, error: 'Layanan email belum dikonfigurasi.' }
  }

  try {
    const res = await fetch('https://smtp.maileroo.com/api/v2/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify({
        from: { address: fromAddress, display_name: fromName },
        to: [{ address: to, display_name: toName }],
        subject,
        html,
        plain: text || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      })
    })

    if (!res.ok) {
      const errBody = await res.text().catch(() => '')
      console.error('Maileroo send error:', res.status, errBody)
      return { success: false, error: 'Gagal mengirim email.' }
    }

    return { success: true }
  } catch (err: any) {
    console.error('Error sending email via Maileroo:', err)
    return { success: false, error: err.message || 'Gagal mengirim email.' }
  }
}
