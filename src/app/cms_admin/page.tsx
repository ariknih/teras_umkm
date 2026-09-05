import { redirect } from 'next/navigation'
import { DEFAULT_MENU } from './nav.config'

export default function CmsAdminIndex() {
  redirect(`/cms_admin/${DEFAULT_MENU}`)
}
