'use client'

import { useState, useEffect } from 'react';

import { useParams } from 'next/navigation';

import { useSession } from 'next-auth/react';

import Grid from '@mui/material/Grid2'

import ModuleFormComponent from '@components/program-component/FormComponent';

const CreateNewModuleLayouts = () => {

    const { lang: locale, cId: cId, id: id } = useParams()

    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const { data: session } = useSession();
    const token = session?.user?.token;

    const [loading, setLoading] = useState(false)
    const [editData, setEditData] = useState()

    const fetchEditData = async () => {

        setLoading(false)

        try {
            const response = await fetch(`${API_URL}/company/module/${cId}/edit/${id}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            const data = await response.json()

            if (response.ok) {
                const result = data?.data;
                
                setLoading(true)
                setEditData(result)
            }

        } catch (error) {
            throw new Error(error)
        }
    }

    useEffect(() => {
        if (API_URL && token) {
            fetchEditData();
        }
    }, [API_URL, token])

    return (
        <Grid container spacing={6}>
            <Grid size={{ xs: 12 }}>
                <ModuleFormComponent
                    stage={"Module"}
                    loading={loading}
                    editData={editData}
                    id={id}
                    backURL={`/${locale}/apps/modules/${cId}`}
                    editURL={`${API_URL}/company/module/${cId}/update`}
                    token={token}
                />
            </Grid>
        </Grid>
    )
}

export default CreateNewModuleLayouts
