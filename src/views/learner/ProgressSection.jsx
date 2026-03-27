'use client'

import Grid from '@mui/material/Grid2'
import { Card, Skeleton } from '@mui/material'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import LinearProgress from '@mui/material/LinearProgress'

const sessions = [
    { title: 'Live React Class', date: '22 Mar', time: '10:00 AM' },
    { title: 'ILT Session', date: '23 Mar', time: '2:00 PM' }
]

const CARD_HEIGHT = 260

const ProgressSection = ({ dashboardData, loading }) => {
    return (
        <Grid container spacing={6} alignItems="stretch">

            {/* Progress */}
            <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex' }}>
                <Card
                    sx={{
                        height: CARD_HEIGHT,
                        minHeight: CARD_HEIGHT,
                        maxHeight: CARD_HEIGHT,
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    <CardContent sx={{ overflowY: 'auto' }}>
                        {loading ? (
                            <>
                                <Skeleton width={150} height={30} />
                                <Skeleton width={80} height={40} />
                                <Skeleton height={10} />
                            </>
                        ) : (
                            <>
                                <Typography variant="h6">Overall Progress</Typography>
                                <Typography variant="h4">
                                    {Number(dashboardData?.progressStatus?.completed_percentage ?? 0).toFixed(1)}%
                                </Typography>
                                <LinearProgress
                                    variant="determinate"
                                    value={Number(dashboardData?.progressStatus?.completed_percentage ?? 0)}
                                />
                            </>
                        )}
                    </CardContent>
                </Card>
            </Grid>

            {/* Upcoming Sessions */}
            <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex' }}>
                <Card
                    sx={{
                        height: CARD_HEIGHT,
                        minHeight: CARD_HEIGHT,
                        maxHeight: CARD_HEIGHT,
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    <CardHeader title="Upcoming Sessions" />

                    {/* Scrollable content */}
                    <CardContent sx={{ overflowY: 'auto', flex: 1 }}>
                        {loading ? (
                            [...Array(3)].map((_, i) => (
                                <Skeleton key={i} height={40} sx={{ mb: 2 }} />
                            ))
                        ) : dashboardData?.liveSession?.length ? (
                            dashboardData.liveSession.map((s, i) => (
                                <div key={i} className="flex justify-between items-center mb-4">
                                    <div>
                                        <Typography>{s.title}</Typography>
                                        <Typography variant="body2">
                                            {s.start_live_time ?? ""}
                                        </Typography>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <Typography>No sessions available</Typography>
                        )}
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    )
}

export default ProgressSection
