export function getCookieDomain(host: string): string | undefined {
  const cleanHost = host.split(':')[0].toLowerCase()
  if (cleanHost.endsWith('localhost')) {
    return '.localhost'
  }
  if (cleanHost.endsWith('varro.my.id')) {
    return '.varro.my.id'
  }
  if (cleanHost.endsWith('vercel.app')) {
    return undefined
  }
  return '.saloka.id'
}
