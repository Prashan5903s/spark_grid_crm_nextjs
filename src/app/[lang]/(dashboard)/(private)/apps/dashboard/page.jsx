//MUI Imports
import Grid from '@mui/material/Grid2'

//Component Imports
import LogisticsStatisticsCard from '@views/apps/logistics/dashboard/LogisticsStatisticsCard'
import LogisticsDeliveryExceptions from '@views/apps/logistics/dashboard/LogisticsDeliveryExceptions'

//Data Imports
import { getStatisticsData } from '@/app/server/actions'

const UserDashboard = async () => {

    // Vars
    const data = await getStatisticsData()

    return (
        <Grid container spacing={6}>
            <Grid size={{ xs: 12 }}>
                <LogisticsStatisticsCard
                    data={data?.statsHorizontalWithBorder}
                />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
                <LogisticsDeliveryExceptions />
            </Grid>
        </Grid>
    )
}

export default UserDashboard
