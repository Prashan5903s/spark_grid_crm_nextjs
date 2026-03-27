'use client'

// React Imports
import { Fragment, useState } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Alert from '@mui/material/Alert'

import Typography from '@mui/material/Typography'

import Button from '@mui/material/Button'

import { toast } from 'react-toastify'

// Third-party Imports
import classnames from 'classnames'

import { useApi } from '../../../../utils/api';

const PublishModuleDialog = ({ open, setOpen, type, moduleData, onUpdateStatusChangeState, cardItems }) => {

    // States
    const [secondDialog, setSecondDialog] = useState(false)
    const [userInput, setUserInput] = useState(false)
    const [loading, setLoading] = useState(false)
    const { doPostFormData } = useApi();

    // Vars
    const Wrapper = type === 'suspend-account' ? 'div' : Fragment

    const handleSecondDialogClose = () => {
        setSecondDialog(false)
        setOpen(false)
    }

    const handleConfirmation = async (value) => {

        const status = type == 'draft' ? 'published' : 'draft';

        setLoading(true);

        const newData = {
            status: status
        };

        const endpoint = `admin/module/update/status/${moduleData._id}`;

        await doPostFormData({
            endpoint,
            values: newData,
            method: 'PUT',
            successMessage: '',
            errorMessage: '',
            onSuccess: (response) => {

                setLoading(false);
                setUserInput(value)
                setSecondDialog(true)
                setOpen(false)
                onUpdateStatusChangeState(status);

                toast.success(response.message, {
                    autoClose: 1200
                });

            },
        });
    };

    return (
        <>
            <Dialog fullWidth maxWidth='xs' open={open} onClose={() => setOpen(false)} closeAfterTransition={false}>
                <DialogContent className='flex items-center flex-col text-center sm:pbs-16 sm:pbe-6 sm:pli-16'>
                    <i className='tabler-alert-circle text-[88px] mbe-6 text-warning' />
                    <Wrapper
                        {...(type === 'suspend-account' && {
                            className: 'flex flex-col items-center gap-2'
                        })}
                    >
                        <Typography variant='h4'>
                            {type === 'draft' && `Are you sure to publish the module ${moduleData.title}?`}
                            {type === 'published' && `Are you sure to unpublish the module ${moduleData.title}?`}
                        </Typography>

                        <div className='flex flex-col gap-4'>
                            {(Array.isArray(cardItems) && cardItems.length == 0 && type === 'draft') &&
                                <Alert variant='outlined' severity='warning'>
                                    This module does not have any content yet. Please make sure to add content before proceeding.
                                </Alert>
                            }
                        </div>
                    </Wrapper>
                </DialogContent>
                <DialogActions className='justify-center pbs-0 sm:pbe-16 sm:pli-16'>
                    <Button variant='contained' onClick={() => handleConfirmation(true)}>
                        {type === 'draft'
                            ? 'Yes, Publish'
                            : type === 'published'
                                ? 'Yes, Unpublish'
                                : ''}
                    </Button>
                    <Button
                        variant='tonal'
                        color='secondary'
                        onClick={() => {
                            setOpen(false)
                        }}
                    >
                        Cancel
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Account Dialog */}
            <Dialog open={secondDialog} onClose={handleSecondDialogClose} closeAfterTransition={false}>
                <DialogContent className='flex items-center flex-col text-center sm:pbs-16 sm:pbe-6 sm:pli-16'>
                    <i
                        className={classnames('text-[88px] mbe-6', {
                            'tabler-circle-check': userInput,
                            'text-success': userInput,
                            'tabler-circle-x': !userInput,
                            'text-error': !userInput
                        })}
                    />
                    <Typography variant='h4' className='mbe-2'>
                        {userInput
                            ? `${type === 'published' ? 'Published' : type === 'draft' ? 'Unpublished' : ''}`
                            : 'Cancelled'}
                    </Typography>
                    <Typography color='text.primary'>
                        {userInput ? (
                            <>
                                {type === 'draft' && `${moduleData.title} Unpublished successfully.`}
                                {type === 'published' && `${moduleData.title} Published successfully.`}
                            </>
                        ) : (
                            <>

                            </>
                        )}
                    </Typography>
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

export default PublishModuleDialog
