'use client'

import { useParams } from 'next/navigation'

import Grid from '@mui/material/Grid2'

import ModuleTypeCardComponent from '../ModuleType/page';

import PermissionGuard from '@/hocs/PermissionClientGuard'

const CreateNewModuleLayouts = () => {

    const { lang: locale } = useParams()

    return (
        <PermissionGuard locale={locale} element={'isCompany'}>
            <Grid container spacing={6}>
                <Grid size={{ xs: 12 }}>
                    <ModuleTypeCardComponent />
                </Grid>
            </Grid>
        </PermissionGuard>
    )
}

export default CreateNewModuleLayouts
