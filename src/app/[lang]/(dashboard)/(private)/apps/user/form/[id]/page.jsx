// MUI Imports

import Grid from '@mui/material/Grid2'

import UserFormLayout from '@/components/user-form/page';

const UserFormLayouts = () => {
    return (
        <Grid container spacing={6}>
            <Grid size={{ xs: 12 }}>
                <UserFormLayout />
            </Grid>
        </Grid>
    )
}

export default UserFormLayouts
