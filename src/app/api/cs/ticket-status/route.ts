import { NextRequest, NextResponse } from 'next/server'
import { DataStore } from '@/lib/data-store'

export async function GET(req: NextRequest) {
  const ticketId = req.nextUrl.searchParams.get('ticketId') || ''
  if (!ticketId) {
    return NextResponse.json({ error: 'Missing ticketId' }, { status: 400 })
  }
  try {
    const tickets = await DataStore.getSupportTickets()
    const ticket = tickets.find(t => t.id === ticketId)
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }
    return NextResponse.json({ status: ticket.status })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error checking status' }, { status: 500 })
  }
}
