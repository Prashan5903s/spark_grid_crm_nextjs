'use client'

import * as React from 'react';

import Box from '@mui/material/Box';

import Skeleton from '@mui/material/Skeleton';

import DialogContent from '@mui/material/DialogContent';

const SkeletonFormComponent = () => {
    return (
        <DialogContent className="overflow-visible pbs-0 sm:pli-16">
            {/* Package Name Skeleton */}
            <Box mb={2}>
                <Skeleton variant="text" width={120} height={30} />
                <Skeleton variant="rectangular" width="100%" height={56} />
            </Box>

            {/* Amount Skeleton */}
            <Box mb={2}>
                <Skeleton variant="text" width={80} height={30} />
                <Skeleton variant="rectangular" width="100%" height={56} />
            </Box>

            {/* Description Skeleton */}
            <Box mb={2}>
                <Skeleton variant="text" width={120} height={30} />
                <Skeleton variant="rectangular" width="100%" height={100} />
            </Box>

            {/* Package Type Skeleton */}
            <Box mb={2}>
                <Skeleton variant="text" width={120} height={30} />
                <Skeleton variant="rectangular" width="100%" height={56} />
            </Box>

            {/* Status Section Skeleton */}
            <Box mb={2}>
                <Skeleton variant="text" width={60} height={30} />
                <Box display="flex" gap={2} mt={1}>
                    <Skeleton variant="circular" width={24} height={24} />
                    <Skeleton variant="text" width={60} height={24} />
                    <Skeleton variant="circular" width={24} height={24} />
                    <Skeleton variant="text" width={60} height={24} />
                </Box>
            </Box>
        </DialogContent>
    );
}

export default SkeletonFormComponent;
