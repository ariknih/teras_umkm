import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getServiceByIdAction, getServiceAvailabilityAction } from '@/app/actions/services'
import { getCurrentUser } from '@/app/actions/auth'
import ServiceBookingClient from './ServiceBookingClient'

export const dynamic = 'force-dynamic'

export default async function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [service, availabilityRes, user] = await Promise.all([
    getServiceByIdAction(id),
    getServiceAvailabilityAction(id),
    getCurrentUser()
  ])

  if (!service) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-slate-50 font-poppins py-10 px-6 md:px-16">
      <div className="max-w-[1200px] mx-auto space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Link href="/" className="hover:text-slate-800">Beranda</Link>
          <span>/</span>
          <Link href="/jasa" className="hover:text-slate-800">Layanan Jasa</Link>
          <span>/</span>
          <span className="text-slate-800 font-bold truncate max-w-xs">{service.title}</span>
        </div>

        {/* Client Booking Interface */}
        <ServiceBookingClient
          service={service}
          initialAvailability={availabilityRes.avails || []}
          currentUser={user}
        />
      </div>
    </div>
  )
}
