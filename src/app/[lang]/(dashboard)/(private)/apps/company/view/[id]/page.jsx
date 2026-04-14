import dynamic from 'next/dynamic'

import Grid from '@mui/material/Grid2'
import { getServerSession } from 'next-auth'

import UserLeftOverview from '@/views/apps/company/view/user-left-overview'
import UserRight from '@/views/apps/company/view/user-right'

import { getPricingData } from '@/app/server/actions'
import { authOptions } from '@/libs/auth'

const OverViewTab = dynamic(() => import('@/views/apps/company/view/user-right/overview'))
const SecurityTab = dynamic(() => import('@/views/apps/company/view/user-right/security'))
const BillingPlans = dynamic(() => import('@/views/apps/company/view/user-right/billing-plans'))
const NotificationsTab = dynamic(() => import('@/views/apps/company/view/user-right/notifications'))
const ConnectionsTab = dynamic(() => import('@/views/apps/company/view/user-right/connections'))

const tabContentList = ({ pricingData, companyData }) => ({
  overview: <OverViewTab companyData={companyData} />,
  security: <SecurityTab />,
  'billing-plans': <BillingPlans data={pricingData} />,
  notifications: <NotificationsTab />,
  connections: <ConnectionsTab />
})

const fetchCompanyDetail = async (url, token, id) => {
  try {
    const response = await fetch(`${url}/admin/company/${id}/edit`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {

      // console.error('Company API error:', await response.text())

      return null
    }

    const data = await response.json()

    return data?.data || null
  } catch (error) {
    console.error('Company fetch error:', error)

    return null
  }
}

export default async function UserViewTab({ params }) {

  const session = await getServerSession(authOptions)
  const token = session?.user?.token

  const API_URL = process.env.NEXT_PUBLIC_API_URL

  const { id } = await params

  const [pricingData, companyData] = await Promise.all([
    getPricingData(),
    token ? fetchCompanyDetail(API_URL, token, id) : null
  ])

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12, lg: 4, md: 5 }}>
        <UserLeftOverview company={companyData} />
      </Grid>

      <Grid size={{ xs: 12, lg: 8, md: 7 }}>
        <UserRight tabContentList={tabContentList({ pricingData, companyData })} company={companyData} />
      </Grid>
    </Grid>
  )
}
