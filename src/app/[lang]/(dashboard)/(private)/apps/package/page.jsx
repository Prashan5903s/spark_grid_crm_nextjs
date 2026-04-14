'use client'

import { useEffect, useState } from 'react'

import { useSession } from 'next-auth/react'

import Package from '@views/apps/package'

const PackageApp = () => {
    const { data: session } = useSession()
    const token = session?.user?.token
    const URL = process.env.NEXT_PUBLIC_API_URL
    const [isLoading, setIsLoading] = useState(false);
    const [packageTypeData, setPackageType] = useState(null);
    const [nameData, setNameData] = useState();

    const fetchPackage = async () => {
        try {
            const response = await fetch(`${URL}/admin/package`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            })

            const data = await response.json()

            if (response.ok) {
                setIsLoading(true);
                setPackageType(data?.data?.allPackages)
                setNameData(data?.data?.totalPackage)
            } else {
                console.error('Failed to fetch package type data')
            }
        } catch (error) {
            console.error('Error fetching data:', error)
        }
    }

    useEffect(() => {
        if (URL && token) {
            fetchPackage()
        }
    }, [URL, token])

    return (
        <>
            <Package
                packageTypeData={packageTypeData}
                fetchPackage={fetchPackage}
                isLoading={isLoading}
                nameData={nameData}
            />
        </>
    );

}

export default PackageApp
