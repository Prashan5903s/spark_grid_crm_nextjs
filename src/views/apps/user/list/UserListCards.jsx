// MUI Imports
import Grid from '@mui/material/Grid2'

// Component Imports
import UserListStats from '@components/card-statistics/UserListStats'

import UserListStatsSkeleton from '@/components/skeleton/card/UserListStatsSkeleton'

const data = [
  {
    title: 'Total users',
    stats: '0',
    avatarIcon: 'tabler-users',
    avatarColor: 'primary',
    trend: 'positive',
    trendNumber: '',
    subtitle: '',
    evidence: 'total_users',
  },
  {
    title: 'Active users',
    stats: '0',
    avatarIcon: 'tabler-user-check',
    avatarColor: 'success',
    trend: 'positive',
    trendNumber: '',
    subtitle: '',
    evidence: 'active_users',
  },
  {
    title: 'Inactive Users',
    stats: '0',
    avatarIcon: 'tabler-user-plus',
    avatarColor: 'error',
    trend: 'negative',
    trendNumber: '',
    subtitle: '',
    evidence: 'inactive_users',
  },
  {
    title: 'Not logged in',
    stats: '0',
    avatarIcon: 'tabler-user-search',
    avatarColor: 'warning',
    trend: 'positive',
    trendNumber: '0',
    subtitle: '',
    evidence: 'not_logged_in_users',
  }
]

const UserListCards = (statsData) => {
  return (
    <Grid container spacing={6}>
      {data.map((item, i) => (
        <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
          {statsData && Object.keys(statsData).length > 0
            ? <UserListStats {...item} stats={statsData?.[item.evidence] ?? 0} />
            : <UserListStatsSkeleton {...item} />
          }
        </Grid>
      ))}
    </Grid>
  )
}

export default UserListCards
