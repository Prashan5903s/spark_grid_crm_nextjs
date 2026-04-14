'use client'

// MUI Imports
import Avatar from '@mui/material/Avatar'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'
import { useColorScheme } from '@mui/material/styles'

// Third-party Imports
import classnames from 'classnames'

// Component Imports
import DialogCloseButton from '../../DialogCloseButton'

import ModuleTypes from '../../../../views/apps/modules/form/module-type';

const ModuleTypeDialog = ({ open, setOpen, onSelectSlideFromPopup, moduleData }) => {

    return (
        <Dialog
            fullWidth
            open={open}
            onClose={() => setOpen(false)}
            maxWidth='md'
            scroll='body'
            closeAfterTransition={false}
            sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
        >
            <DialogCloseButton onClick={() => setOpen(false)} disableRipple>
                <i className='tabler-x' />
            </DialogCloseButton>
            <DialogTitle variant='h4' className='flex gap-2 flex-col text-center sm:pbs-5 sm:pbe-5 sm:pli-5'>
                <Typography component='span' className='flex flex-col items-center'>
                    Select any Activity to create
                </Typography>
            </DialogTitle>

            <ModuleTypes source='popup' setOpen={setOpen} onSelectSlideFromPopup={onSelectSlideFromPopup} moduleData={moduleData} />

        </Dialog>
    )
}

export default ModuleTypeDialog
