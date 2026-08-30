import { getIndukCommunities, getUserCommunitiesWithRolesAction } from '@/app/actions/community'
import { getGlobalKycSettingAction } from '@/app/actions/admin'
import { getCurrentUser } from '@/app/actions/auth'
import CommunityDirectoryClient from './CommunityDirectoryClient'

export default async function CommunityDirectoryPage() {
  const [currentUser, comms, kycRes] = await Promise.all([
    getCurrentUser().catch(() => null),
    getIndukCommunities().catch(() => []),
    getGlobalKycSettingAction().catch(() => null)
  ])

  // Exclude pending and suspended communities from public directory
  const verifiedComms = (comms || []).filter((c: any) => c.isVerified && !c.isSuspended)

  // Reuses the communities list already fetched above instead of re-querying it
  const myComms = currentUser
    ? await getUserCommunitiesWithRolesAction(currentUser.id, comms).catch(() => [])
    : []

  return (
    <CommunityDirectoryClient
      initialUser={currentUser}
      initialCommunities={verifiedComms}
      initialMyCommunities={Array.isArray(myComms) ? myComms : []}
      initialGlobalKycRequired={kycRes && kycRes.required !== undefined ? kycRes.required : true}
    />
  )
}
