'use client'

import {
    Box,
    Button,
    Card,
    CardContent,
    Typography,
    Skeleton,
} from '@mui/material'

import Grid from '@mui/material/Grid2'

const CardSkeleton = () => {
    const skeletonCount = 6 // adjust as needed

    return (
        <>
            {/* Header Skeleton */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography variant="h5" fontWeight={600}>
                    <Skeleton width={200} height={32} />
                </Typography>
            </Box>

            {/* Card Skeletons */}
            <Grid container spacing={4} >
                {Array.from({ length: skeletonCount }).map((_, idx) => (
                    <Grid key={idx} maxWidth={"386px"} minWidth={"380px"} item size={{ xs: 12, sm: 6, md: 4 }}>
                        <Card
                            sx={{
                                borderRadius: 2,
                                border: '1px solid #e0e0e0',
                                boxShadow: 'none',
                                overflow: 'hidden',
                                position: 'relative',
                            }}
                        >
                            {/* Image Skeleton */}
                            <Box sx={{ height: 200, backgroundColor: '#f0f0f0' }}>
                                <Skeleton variant="rectangular" width="100%" height="100%" />
                            </Box>

                            {/* Title & Menu Skeleton */}
                            <CardContent
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    pt: 2,
                                    pb: 2,
                                    pl: 2,
                                    pr: 2,
                                }}
                            >
                                <Skeleton width="60%" height={24} />
                                <Skeleton variant="circular" width={24} height={24} />
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </>
    )
}

export default CardSkeleton
