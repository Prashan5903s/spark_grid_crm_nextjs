'use client'

// Component Imports

import { useEffect, useState } from 'react'

import { useParams } from 'next/navigation'

import { useSession } from 'next-auth/react'

import ParticipationTypeComponent from '@/views/apps/participation-type/index'

import SkeletonTableComponent from '@/components/skeleton/table/page'

import PermissionGuard from '@/hocs/PermissionClientGuard'

const ParticipationTypeApp = () => {

  const URL = process.env.NEXT_PUBLIC_API_URL
  const { data: session } = useSession() || {}
  const token = session?.user?.token
  const [data, setData] = useState()

  const { lang: locale } = useParams();

  const loadTableData = async () => {
    try {
      const response = await fetch(`${URL}/admin/participation_types`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch participation types');
      }

      setData(result.data || []);

    } catch (error) {
      console.error('Error fetching participation types:', error.message);

      // Optionally show toast or UI feedback
      // toast.error(error.message || 'Something went wrong');
    }
  };


  useEffect(() => {
    if (URL && token) {
      loadTableData()
    }
  }, [URL, token])

  // Render loading or the permissions component
  return (
    <>
      <PermissionGuard locale={locale} element={'isCompany'}>

        {
          data ?
            <ParticipationTypeComponent
              tableRows={data}
              loadTableData={loadTableData}
            />
            :
            <SkeletonTableComponent />
        }
      </PermissionGuard>
    </>
  )
}

export default ParticipationTypeApp
