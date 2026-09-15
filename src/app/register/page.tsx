import { redirect } from 'next/navigation'

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const role = params?.role
  const ref = params?.ref

  const query = new URLSearchParams()
  query.set('auth', 'register')
  if (role && typeof role === 'string') query.set('role', role)
  if (ref && typeof ref === 'string') query.set('ref', ref)

  redirect(`/?${query.toString()}`)
}
