'use client'

import { useEffect, useState } from 'react';

import { useParams } from 'next/navigation'

import { useSession } from 'next-auth/react';

import Grid from '@mui/material/Grid2'

import ProgramFormComponent from '@components/program-component/FormComponent';

import PermissionGuard from '@/hocs/PermissionClientGuard'

const CreateNewModuleLayouts = () => {

    const { lang: locale, id: id } = useParams()

    const { data: session } = useSession()
    const token = session?.user?.token;
    const API_URL = process.env.NEXT_PUBLIC_API_URL

    const [loading, setLoading] = useState(false)
    const [editFormData, setEditFormData] = useState();

    const fetchEditData = async () => {
        try {

            setLoading(false)

            const response = await fetch(`${API_URL}/company/program/edit/${id}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            const result = await response.json()

            if (response.ok) {

                const value = result?.data

                setEditFormData(value)

                setLoading(true)

            }

        } catch (error) {
            throw new Error(error)
        }
    }

    useEffect(() => {
        if (API_URL && token && id) {
            fetchEditData()
        }
    }, [API_URL, token, id])

    return (
        <PermissionGuard locale={locale} element={'isCompany'}>
            <Grid container spacing={6}>
                <Grid size={{ xs: 12 }}>
                    <ProgramFormComponent
                        id={id}
                        token={token}
                        loading={loading}
                        stage={"Program"}
                        backURL={'/apps/program'}
                        editData={editFormData}
                        addURL={`${API_URL}/company/program`}
                        editURL={`${API_URL}/company/program/update`}
                        backPageName={"Program"}
                    />
                </Grid>
            </Grid>
        </PermissionGuard>
    )
}

export default CreateNewModuleLayouts
