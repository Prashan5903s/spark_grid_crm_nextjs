'use client'

import dynamic from 'next/dynamic'

import Grid from '@mui/material/Grid2'

import { Card, Skeleton, CardHeader, CardContent, Typography } from '@mui/material'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

const CARD_HEIGHT = 420

const ModulesAndActivity = ({ dashboardData, loading }) => {
    const series = dashboardData?.activitySummary?.map(item => Number(item.percentage)) || []

    const options = {
        labels: dashboardData?.activitySummary?.map(item => item.title) || []
    }

    return (
        <Grid container spacing={6} alignItems="stretch">

            {/* Activity */}
            <Grid size={{ xs: 12, md: 4 }} >
                <Card
                    sx={{
                        blockSize: CARD_HEIGHT,
                        minHeight: CARD_HEIGHT,
                        inlineSize: '100%',
                    }}
                >
                    <CardHeader title="Activity Summary" />

                    {/* Scrollable content */}
                    <CardContent
                        sx={{
                            overflowY: 'auto',
                        }}
                    >
                        <CardContent sx={{ overflowY: 'auto' }}>
                            {loading ? (
                                <Skeleton variant="rounded" height={250} />
                            ) : series.length ? (
                                <Chart type="donut" series={series} options={options} />
                            ) : (
                                <Typography>No activity data</Typography>
                            )}
                        </CardContent>
                    </CardContent>
                </Card>
            </Grid>

            {/* Modules */}
            <Grid size={{ xs: 12, md: 8 }} sx={{ display: 'flex' }}>
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
                    <CardHeader title="Learning Modules" />

                    {/* Scrollable content */}
                    <CardContent sx={{ flex: 1, overflowY: 'auto' }}>
                        {loading ? (
                            [...Array(4)].map((_, i) => (
                                <Skeleton key={i} height={50} sx={{ mb: 2 }} />
                            ))
                        ) : dashboardData?.enrolledData?.length ? (
                            dashboardData.enrolledData.map((item, index) => (
                                <div key={item._id || index} style={{ marginBottom: '12px' }}>
                                    <p style={{ margin: 0, fontWeight: 600 }}>
                                        {item?.title}
                                    </p>
                                    <p style={{ margin: 0 }}>
                                        {item?.description}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <Typography>No modules found</Typography>
                        )}
                    </CardContent>
                </Card>
            </Grid>

        </Grid>
    )
}

export default ModulesAndActivity
