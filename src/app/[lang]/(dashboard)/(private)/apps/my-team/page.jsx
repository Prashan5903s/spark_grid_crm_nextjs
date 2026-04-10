'use client'

// Component Imports

import { useEffect, useState } from 'react'

import { useSession } from 'next-auth/react'

import Grid from '@mui/material/Grid2'

import SkeletonTableComponent from '@/components/skeleton/table/page'

import UserListTable from './UserListTable'

import { useApi } from '@/utils/api'


// MUI Imports

const UserList = () => {

    const URL = process.env.NEXT_PUBLIC_API_URL
    const { data: session } = useSession() || {}
    const token = session?.user?.token
    const [userData, setUserData] = useState();
    const [statsData, setStatsData] = useState();
    const { doGet, doPost } = useApi();
    const [isUserCardShow, setIsUserCardShow] = useState(true);

    const loadData = async () => {
        try {
            const response = await fetch(`${URL}/user/reporting/manager`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            })

            const data = await response.json();

            if (response.ok) {
                setUserData(data?.data);
            }
        } catch (error) {
            console.log('Error occured', error);

        }
    }

    useEffect(() => {
        if (URL && token) {
            loadData();
        }
    }, [URL, token])

    if (!userData) {
        return (
            <Grid container spacing={6}>
                <Grid size={{ xs: 12 }}>
                    <SkeletonTableComponent />
                </Grid>
            </Grid>
        )
    }

    return (
        <Grid container spacing={6}>
            <Grid size={{ xs: 12 }}>
                <UserListTable userData={userData} loadData={loadData} setIsUserCardShow={setIsUserCardShow} />
            </Grid>
        </Grid>
    )
}

export default UserList
