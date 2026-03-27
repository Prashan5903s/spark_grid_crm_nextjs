// MUI Imports

import Grid from '@mui/material/Grid2'

import UserFormLayout from '@/components/company-form/page';

import PermissionGuard from '@/hocs/PermissionGuard'

export default async function UserFormLayouts({ params }) {

  const { lang } = await params;

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <PermissionGuard locale={lang} element={'isSuperAdmin'}>
          <UserFormLayout />
        </PermissionGuard>
      </Grid>
    </Grid>
  )
}
