'use client'

import { useEffect, useState } from 'react'

import { useSession } from 'next-auth/react'

import Grid from '@mui/material/Grid2'

import UserListTable from './UserListTable'

import UserListCards from './UserListCards'

import SkeletonTableComponent from '@/components/skeleton/table/page'

const UserList = () => {

  const URL = process.env.NEXT_PUBLIC_API_URL
  const { data: session } = useSession() || {}
  const token = session?.user?.token
  const [userData, setUserData] = useState();

  const fetchData = async () => {
    try {
      const response = await fetch(`${URL}/admin/company`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })

      const data = await response.json();

      if (response.ok) {
        setUserData(data?.data?.company);
      }
    } catch (error) {
      console.log('Error occured', error);

    }

  }

  useEffect(() => {
    if (URL && token) {
      fetchData();
    }
  }, [URL, token])

  if (!userData) {
    return (
      <Grid container spacing={6}>
        <Grid size={{ xs: 12 }}>
          <UserListCards />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <SkeletonTableComponent />
        </Grid>
      </Grid>
    )
  }

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <UserListCards />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <UserListTable userData={userData} fetchData={fetchData} />
      </Grid>
    </Grid>
  )
}

export default UserList
