'use client'

import dayjs from 'dayjs';

import { Card, Skeleton, CardHeader, CardContent, Typography } from '@mui/material'
import Grid from "@mui/material/Grid2"

const CARD_HEIGHT = 260

const RecentActivities = ({ dashboardData, loading }) => {
    return (
        <Grid container spacing={6} alignItems="stretch">

            {/* Recent Activities */}
            <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex' }}>
                <Card
                    sx={{
                        blockSize: CARD_HEIGHT,
                        minHeight: CARD_HEIGHT,
                        maxHeight: CARD_HEIGHT,
                        inlineSize: '100%',
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    <CardHeader title="Recent Activities" />

                    <CardContent sx={{ flex: 1, overflowY: 'auto' }}>
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <Skeleton key={i} height={30} sx={{ mb: 1 }} />
                            ))
                        ) : dashboardData?.activityLog?.length ? (
                            dashboardData.activityLog.map((item, index) => (
                                <div key={index}>
                                    <Typography>
                                        {item?.title} - {item?.current_attempt}
                                    </Typography>
                                </div>
                            ))
                        ) : (
                            <Typography>No activities found</Typography>
                        )}
                    </CardContent>
                </Card>
            </Grid>

            {/* Notifications */}
            <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex' }}>
                <Card
                    sx={{
                        blockSize: CARD_HEIGHT,
                        minHeight: CARD_HEIGHT,
                        maxHeight: CARD_HEIGHT,
                        inlineSize: '100%',
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    <CardHeader title="Notifications" />

                    <CardContent sx={{ flex: 1, overflowY: 'auto' }}>
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <Skeleton key={i} height={30} sx={{ mb: 1 }} />
                            ))
                        ) : dashboardData?.notificationLog?.length ? (
                            dashboardData.notificationLog.map((item, index) => (
                                <Typography key={index}>
                                    {item?.template_name || ""} on{" "}
                                    {dayjs(item?.schedule_date).format('hh:mm A DD MM YYYY')}
                                </Typography>
                            ))
                        ) : (
                            <Typography>No notifications found</Typography>
                        )}
                    </CardContent>
                </Card>
            </Grid>

        </Grid>
    )
}

export default RecentActivities
