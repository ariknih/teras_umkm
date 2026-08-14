import React from 'react'
import { getCoinVouchers } from '@/app/actions/coin'
import VoucherClient from './VoucherClient'

export const metadata = {
  title: 'Pusat Klaim Voucher & Promo UMKM | Saloka.id',
  description: 'Klaim berbagai voucher diskon belanja, gratis ongkir, dan tukar koin reward untuk transaksi di Saloka.id.',
}

export default async function VoucherCatalogPage() {
  let vouchers = []
  try {
    vouchers = await getCoinVouchers()
  } catch (_) {
    vouchers = []
  }

  return <VoucherClient initialVouchers={vouchers} />
}
