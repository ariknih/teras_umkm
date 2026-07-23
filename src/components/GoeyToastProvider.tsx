'use client'

import { GoeyToaster } from 'goey-toast'
import 'goey-toast/styles.css'

export default function GoeyToastProvider() {
  return (
    <>
      <style jsx global>{`
        [data-sonner-toaster] {
          font-family: inherit !important;
          z-index: 99999 !important;
        }
        [data-sonner-toast] {
          font-size: 14px !important;
          font-weight: 700 !important;
          padding: 14px 20px !important;
          border-radius: 16px !important;
          box-shadow: 0 12px 32px -4px rgba(0, 0, 0, 0.18) !important;
        }
        [data-sonner-toast] [data-title] {
          font-size: 14px !important;
          font-weight: 700 !important;
          line-height: 1.4 !important;
        }
      `}</style>
      <GoeyToaster position="top-right" offset="80px" />
    </>
  )
}
