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
          top: 95px !important;
        }
        [data-sonner-toast] {
          font-size: 14px !important;
          font-weight: 700 !important;
          padding: 14px 20px !important;
          border-radius: 16px !important;
          box-shadow: 0 12px 32px -4px rgba(0, 0, 0, 0.2) !important;
        }
        [data-sonner-toast] [data-title] {
          font-size: 14px !important;
          font-weight: 700 !important;
          line-height: 1.4 !important;
        }

        @media (max-width: 640px) {
          [data-sonner-toaster] {
            top: 95px !important;
            left: 16px !important;
            right: 16px !important;
          }
          [data-sonner-toast] {
            width: calc(100vw - 32px) !important;
            max-width: calc(100vw - 32px) !important;
            font-size: 13px !important;
            padding: 12px 16px !important;
          }
          [data-sonner-toast] [data-title] {
            font-size: 13px !important;
          }
        }
      `}</style>
      <GoeyToaster position="top-right" offset="95px" />
    </>
  )
}
