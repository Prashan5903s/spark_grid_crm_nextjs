'use client'

import * as React from 'react';

import Box from '@mui/material/Box';

import Skeleton from '@mui/material/Skeleton';

const SkeletonTableComponent = () => {
    return (
        <Box className="overflow-x-auto p-4">
            <table className="table-module__Mig-TG__table w-full border-collapse">
                <thead>
                    <tr>
                        <th className="px-4 py-2">
                            <Skeleton variant="text" width={120} height={24} />
                        </th>
                        <th className="px-4 py-2">
                            <Skeleton variant="text" width={120} height={24} />
                        </th>
                        <th className="px-4 py-2">
                            <Skeleton variant="text" width={80} height={24} />
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {[...Array(3)].map((_, i) => (
                        <tr key={i}>
                            <td className="px-4 py-2">
                                <Skeleton variant="text" width={120} height={24} />
                            </td>
                            <td className="px-4 py-2">
                                <Skeleton variant="text" width={100} height={24} />
                            </td>
                            <td className="px-4 py-2">
                                <Skeleton variant="circular" width={32} height={32} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </Box>
    );
};

export default SkeletonTableComponent;
