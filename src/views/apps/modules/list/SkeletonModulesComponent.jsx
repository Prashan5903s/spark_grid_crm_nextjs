'use client'

import * as React from 'react';

import Box from '@mui/material/Box';

import Skeleton from '@mui/material/Skeleton';

import DialogContent from '@mui/material/DialogContent';

const SkeletonFormComponent = () => {
    return (
        <DialogContent className="overflow-visible pbs-0 sm:pli-16">
            <Box display="flex" justifyContent="space-between" gap={2} mb={4}>
                <Skeleton variant="rectangular" width="25%" height={250} />
                <Skeleton variant="rectangular" width="25%" height={250} />
                <Skeleton variant="rectangular" width="25%" height={250} />
                <Skeleton variant="rectangular" width="25%" height={250} />
            </Box>
            <Box display="flex" justifyContent="space-between" gap={2} mb={4}>
                <Skeleton variant="rectangular" width="25%" height={250} />
                <Skeleton variant="rectangular" width="25%" height={250} />
                <Skeleton variant="rectangular" width="25%" height={250} />
                <Skeleton variant="rectangular" width="25%" height={250} />
            </Box>
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
