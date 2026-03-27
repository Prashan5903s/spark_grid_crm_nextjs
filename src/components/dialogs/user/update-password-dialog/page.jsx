// MUI Imports

import { useEffect, useState } from 'react'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'

import CircularProgress from '@mui/material/CircularProgress'

import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'

// React Hook Form
import { useForm, Controller } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'

// Valibot schema
import { string, object, pipe, minLength, maxLength } from 'valibot'

// Component Imports

import { toast } from 'react-toastify'

import { useSession } from 'next-auth/react'

import DialogCloseButton from '../../DialogCloseButton'

import SkeletonFormComponent from '@/components/skeleton/form/page'

// Third-party Imports

import CustomTextField from '@core/components/mui/TextField'

const schema = object({
    password: pipe(
        string(),
        minLength(6, 'Password min length should be 6'),
        maxLength(255, 'Password can be a maximum of 255 characters')
    ),
})

const PTFormContent = ({ control, errors, formData, handleClickShowPassword }) => (
    <DialogContent className='overflow-visible pbs-0 sm:pli-16'>
        <div className="flex items-end gap-4 mbe-2">
            <Controller
                name="password"
                control={control}
                render={({ field }) => (
                    <CustomTextField
                        fullWidth
                        label="Password"
                        placeholder="············"
                        id="form-layout-separator-password"
                        type={formData.isPasswordShown ? 'text' : 'password'}
                        {...field}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        edge="end"
                                        onClick={handleClickShowPassword}
                                        onMouseDown={(e) => e.preventDefault()}
                                        aria-label="toggle password visibility"
                                    >
                                        <i className={formData.isPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                        error={!!errors.password}
                        helperText={errors.password?.message}
                    />
                )}
            />

        </div>
    </DialogContent>
)

const UpdatePasswordDialog = ({ open, setOpen, data }) => {
    const handleClose = () => setOpen(false)

    const URL = process.env.NEXT_PUBLIC_API_URL
    const { data: session } = useSession()
    const token = session?.user?.token
    const [loading, setLoading] = useState(false)


    const [formData, setFormData] = useState({
        password: '',
    })

    const handleClickShowPassword = () => setFormData(show => ({ ...show, isPasswordShown: !show.isPasswordShown }))

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: valibotResolver(schema),
        mode: 'onChange',
        defaultValues: {
            name: '',
            status: true,
        }
    })

    useEffect(() => {
        if (open) {
            reset({
                password: ''
            })
        }
    }, [open, data, reset])

    const submitData = async (value) => {
        setLoading(true)
        const endpoint = `${URL}/admin/user/update-password/${data._id}`
        const method = 'PUT'

        try {
            const response = await fetch(endpoint, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(value)
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.message || 'Something went wrong!')
            }

            toast.success(result.message || 'Operation successful', { autoClose: 700 })
            setOpen(false)

        } catch (error) {
            console.error('submitData error:', error)
            toast.error(error.message || 'Submission failed')
        } finally {
            setLoading(false)
        }
    }

    const onSubmit = (values) => submitData(values)

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            closeAfterTransition={false}
            sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
        >
            <form onSubmit={handleSubmit(onSubmit)}>
                <DialogCloseButton onClick={handleClose} disableRipple>
                    <i className='tabler-x' />
                </DialogCloseButton>

                <DialogTitle
                    variant='h4'
                    className='flex flex-col gap-2 text-center sm:pbs-16 sm:pbe-6 sm:pli-16'
                >
                    <Typography variant="body1">
                        Update password for <i style={{ color: '#1976d2' }}>{data?.first_name} {data?.last_name}</i>
                    </Typography>
                </DialogTitle>

                {open ? (
                    <PTFormContent control={control} errors={errors} formData={formData} handleClickShowPassword={handleClickShowPassword} />
                ) : (
                    <SkeletonFormComponent />
                )}

                <DialogActions className='flex max-sm:flex-col max-sm:items-center max-sm:gap-2 justify-center pbs-0 sm:pbe-16 sm:pli-16'>
                    <Button
                        type='submit'
                        variant='contained'
                        disabled={loading}
                        sx={{ height: 40, position: 'relative' }}
                    >
                        {loading ? (
                            <CircularProgress
                                size={24}
                                sx={{
                                    color: 'white',
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    marginTop: '-12px',
                                    marginLeft: '-12px',
                                }}
                            />
                        ) : (
                            'Update'
                        )}
                    </Button>
                    <Button onClick={handleClose} variant='tonal' color='secondary'>
                        Discard
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    )
}

export default UpdatePasswordDialog
