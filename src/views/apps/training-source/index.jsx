'use client'

import { useState, useEffect } from 'react'

import { useSession } from 'next-auth/react'

import Typography from '@mui/material/Typography'

import Grid from '@mui/material/Grid2'

import SkeletonTableComponent from '@/components/skeleton/table/page'

import TrainingSourceTable from './TrainingSourceTable'

const TrainingSourceComponent = ({ isCompany = true }) => {

    const [data, setData] = useState();
    const [loading, setLoading] = useState(false);

    const URL = process.env.NEXT_PUBLIC_API_URL;

    const { data: session } = useSession() || {};

    const token = session && session.user && session?.user?.token;

    async function fetchRoleData() {
        try {
            const response = await fetch(isCompany ? `${URL}/company/export/center/data` : `${URL}/user/export/user/data`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    }
                })

            const datas = await response.json();

            if (response.ok) {

                setLoading(true);
                setData(datas?.data);
            } else {

            }

        } catch (error) {
            throw new Error(error);
        } finally {
            setLoading(true);
        }
    }

    useEffect(() => {
        if (URL && token) {
            fetchRoleData();
        }
    }, [token])

    return (
        <Grid container spacing={6}>
            <Grid size={{ xs: 12 }}>
                <Typography variant='h4' className='mbe-1'>
                    Documents List
                </Typography>
            </Grid>
            <Grid>

            </Grid>
            <Grid size={{ xs: 12 }}>
                {data ? (
                    <TrainingSourceTable tableData={data} fetchRoleData={fetchRoleData} isCompany={isCompany} />
                )
                    : (
                        <SkeletonTableComponent />
                    )
                }
            </Grid>
        </Grid>
    )
}

export default TrainingSourceComponent
