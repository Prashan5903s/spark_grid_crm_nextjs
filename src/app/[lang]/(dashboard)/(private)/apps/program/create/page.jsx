'use client'

import { useParams } from 'next/navigation'

import { useSession } from 'next-auth/react';

// MUI Imports
import Grid from '@mui/material/Grid2'

// Component Imports
import ProgramFormComponent from '@components/program-component/FormComponent';

import PermissionGuard from '@/hocs/PermissionClientGuard'

const CreateNewModuleLayouts = () => {

    const { lang: locale } = useParams()

    const { data: session } = useSession()
    const token = session?.user?.token;
    const API_URL = process.env.NEXT_PUBLIC_API_URL

    return (
        <PermissionGuard locale={locale} element={'isCompany'}>
            <Grid container spacing={6}>
                <Grid size={{ xs: 12 }}>
                    <ProgramFormComponent
                        loading={true}
                        token={token}
                        stage={"Program"}
                        backURL={'/apps/program'}
                        addURL={`${API_URL}/company/program`}
                        editURL={`/${API_URL}/company/program/update`}
                        backPageName={"Program"}
                    />
                </Grid>
            </Grid>
        </PermissionGuard>
    )
}

export default CreateNewModuleLayouts
