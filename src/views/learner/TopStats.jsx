'use client'


import { Skeleton } from '@mui/material';

import Grid from '@mui/material/Grid2'

import StatCard from "@/components/StatCard";


const TopStats = ({ dashboardData, loading }) => {

    const data = [
        { title: 'Enrolled Module', stats: dashboardData?.enrolledData?.length ?? 0, color: 'primary', icon: 'tabler-book' },
        { title: 'In Progress', stats: dashboardData?.progressStatus?.in_progress ?? 0, color: 'warning', icon: 'tabler-clock' },
        { title: 'Completed', stats: dashboardData?.progressStatus?.completed ?? 0, color: 'success', icon: 'tabler-check' },
        { title: 'Not Started', stats: dashboardData?.progressStatus?.not_started ?? 0, color: 'info', icon: 'tabler-player-pause' }
    ]

    return (
        <Grid container spacing={6}>
            {loading ? (
                [...Array(4)].map((_, i) => (
                    <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
                        <Skeleton variant="rounded" height={120} />
                    </Grid>
                ))
            ) : (
                data.map((item, i) => (
                    <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
                        <StatCard {...item} />
                    </Grid>
                ))
            )}
        </Grid>
    )
}

export default TopStats
