'use client'

import { GoeyToaster } from 'goey-toast'
import 'goey-toast/styles.css'

export default function GoeyToastProvider() {
  return <GoeyToaster position="bottom-right" />
}
