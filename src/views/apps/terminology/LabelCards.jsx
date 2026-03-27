'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'

// Component Imports
import LabelDialog from '@components/dialogs/label-dialog/page';
import OpenDialogOnElementClick from '@components/dialogs/OpenDialogOnElementClick'


const LabelCard = ({ fetchLanguageData, tableData }) => {
  return (
    <Grid container spacing={6}>

      {/* Add Role Card */}
      <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
        <OpenDialogOnElementClick
          element={Card}
          elementProps={{
            className: 'cursor-pointer bs-full',
            children: (
              <Grid container className='bs-full'>
                <Grid size={{ xs: 5 }}>
                  <div className='flex items-end justify-center bs-full'>
                    <img alt='add-role' src='/images/illustrations/characters/5.png' height={130} />
                  </div>
                </Grid>
                <Grid size={{ xs: 7 }}>
                  <CardContent>
                    <div className='flex flex-col items-end gap-4 text-right'>
                      <Button variant='contained' size='small'>
                        Add Label
                      </Button>
                      <Typography>
                        Add new Label
                      </Typography>
                    </div>
                  </CardContent>
                </Grid>
              </Grid>
            )
          }}
          dialog={({ open, setOpen }) => (
            <LabelDialog
              open={open}
              setOpen={setOpen}
              fetchLanguageData={fetchLanguageData}
              tableData={tableData}
            />
          )}
        />
      </Grid>
    </Grid>
  )
}

export default LabelCard
