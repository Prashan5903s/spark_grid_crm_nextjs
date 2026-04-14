'use client'

// React Imports
import { Fragment, useState } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import { toast } from 'react-toastify'

// Third-party Imports
import classnames from 'classnames'

const ImportSuccessDialog = ({ open, setOpen }) => {

    // States
    const [userInput, setUserInput] = useState(false)

    const type = '';

    const handleSecondDialogClose = () => {
        setOpen(false)
    }

    return (
        <>
            <Dialog open={open} onClose={handleSecondDialogClose} closeAfterTransition={false}>
                <DialogContent className='flex items-center flex-col text-center sm:pbs-16 sm:pbe-6 sm:pli-16'>
                    <i
                        className={classnames('text-[88px] mbe-6', {
                            'tabler-circle-check': true,
                            'text-success': true,
                            'tabler-circle-x': false,
                            'text-error': false
                        })}
                    />
                    <Typography variant='h4' className='mbe-2'>
                        Import Success
                    </Typography>
                    <Typography color='text.primary'> Import successfully done </Typography>
                </DialogContent>
                <DialogActions className='justify-center pbs-0 sm:pbe-16 sm:pli-16'>
                    <Button variant='contained' color='success' onClick={handleSecondDialogClose}>
                        Ok
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    )
}

export default ImportSuccessDialog
