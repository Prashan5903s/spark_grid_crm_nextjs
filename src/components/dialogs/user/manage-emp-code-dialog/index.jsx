'use client'

// React Imports
import { useEffect, useState, useMemo } from 'react'

// MUI Imports
import { styled } from '@mui/material/styles'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import Typography from '@mui/material/Typography'
import Radio from '@mui/material/Radio'

import Button from '@mui/material/Button'

import { useForm, Controller } from 'react-hook-form'

import { valibotResolver } from '@hookform/resolvers/valibot';

import Chip from '@mui/material/Chip'

// Component Imports

import { toast } from 'react-toastify'

import {
  object,
  string,
  minLength,
  maxLength,
  pipe
} from 'valibot';

import CustomTextField from '@core/components/mui/TextField'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'
import DialogCloseButton from '../../DialogCloseButton'

import { useApi } from '../../../../utils/api';


const steps = [
  {
    icon: 'tabler-file-text',
    title: 'Details',
    subtitle: 'Enter Details'
  },
]

const schema = object({
  user_code: pipe(
    string(),
    minLength(1, 'Employee ID is required'),
    maxLength(255, 'Employee ID be a maximum of 10 characters')
  ),
});

const ManageEmpCodeDialog = ({ open, setOpen, user, loadData }) => {

  const [formData, setFormData] = useState({
    user_code: '',
  })

  const {
    control,
    reset,
    handleSubmit,
    setError,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: valibotResolver(schema),
    defaultValues: {
      user_code: ''
    }
  });

  // States

  const [activeStep, setActiveStep] = useState(0)
  const [value, setCodeValue] = useState('')
  const [selectedCode, setSelectedCode] = useState('');
  const [codes, setCodes] = useState([]);
  const { doPostFormData } = useApi();

  const handleClose = () => {
    setOpen(false)
    setActiveStep(0)
  }

  const handleStep = step => () => {
    setActiveStep(step)
  }

  // Vars
  const isLastStep = activeStep === steps.length - 1

  const handleNext = () => {
    if (!isLastStep) {
      setActiveStep(prevActiveStep => prevActiveStep + 1)
    } else {
      handleClose()
    }
  }

  const handlePrev = () => {
    setActiveStep(prevActiveStep => prevActiveStep - 1)
  }

  const handleChange = event => {
    setCodeValue(event.target.value)
  }

  const handleRadioChange = async (code, index) => {
    const endpoint = `admin/user/mark/active/empcode/${user.id}`;

    const data = {
      index: index,
      user_code: code,
    }

    await doPostFormData({
      endpoint,
      values: data,
      method: 'PUT',
      onSuccess: (response) => {
        setCodes(response.data.codes);
        setSelectedCode(code);
        toast.success(response.message, { autoClose: 700 });
        loadData()
      },
      onError: (error) => {

      }
    });

    // setSelectedCode(event.target.value);
    // setCodeValue(event.target.value); // If you're using react-hook-form
  };

  const onSubmit = async (data) => {
    const endpoint = `admin/user/attach/empcode/${user.id}`;

    await doPostFormData({
      endpoint,
      values: data,
      method: 'PUT',
      successMessage: '',
      errorMessage: '',
      onSuccess: (response) => {
        setCodes(response.data.codes);
        setSelectedCode(response.data.emp_id);
        toast.success(response.message, { autoClose: 700 });
        loadData()
        reset({
          user_code: ''
        })
      },
    });
  };

  useEffect(() => {

    if (user) {
      setCodes(user.codes);
      setSelectedCode(user.emp_id);
    }

    reset({
      user_code: ''
    })
  }, [user])

  return (
    <Dialog
      maxWidth='md'
      open={open}
      onClose={handleClose}
      scroll='body'
      closeAfterTransition={false}
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
    >
      <DialogCloseButton onClick={() => setOpen(false)} disableRipple>
        <i className='tabler-x' />
      </DialogCloseButton>
      <DialogTitle className='flex gap-2 flex-col text-center sm:pbs-16 sm:pbe-6 sm:pli-16'>
        Manage Employee Ids
        <Typography component='span' className='flex flex-col text-center'>
          You can manage multiple Employee IDs for {user?.first_name}
        </Typography>
      </DialogTitle>
      <DialogContent className='pbs-0 sm:pli-16 sm:pbe-16'>
        <div className='flex gap-y-6 flex-col md:flex-row md:gap-5'>
          <div className='flex flex-col gap-6'>
            <form onSubmit={handleSubmit(onSubmit)} noValidate encType="multipart/form-data" className="flex items-end gap-4">
              <Controller
                name="user_code"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    type="text"
                    label="Employee ID"
                    placeholder="Enter Employee ID"
                    error={!!errors.user_code}
                    helperText={errors.user_code?.message}
                  />
                )}
              />
              <Button variant="contained" type="submit">Submit</Button>
            </form>
            <div className='flex flex-col gap-4'>
              <Typography variant='h5'>Total Employee IDs</Typography>
              {Array.isArray(codes) && codes.length > 0 ? (
                codes.map((item, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      handleRadioChange(item.code, index)
                      setSelectedCode(item.code);
                      setCodeValue(item.code);
                    }}
                    className='flex items-center justify-between cursor-pointer gap-4'
                  >
                    <div className='flex items-center gap-3'>
                      <CustomAvatar skin='light' color='info' variant='rounded' size={46}>
                        <i className='tabler-gps text-2xl' />
                      </CustomAvatar>
                      <div className='flex flex-col gap-1'>
                        <Typography color='text.primary' className='font-medium'>
                          {item.code}
                        </Typography>

                        <Typography variant='body2' component={"div"}>
                          <Chip
                            variant='tonal'
                            label={item.type}
                            size='small'
                            color={item.type == 'active' ? "success" : "warning"}
                            className='capitalize'
                          />
                        </Typography>
                        <Typography variant='body2'>Issued on: {new Date(item.issued_on).toISOString().split('T')[0]}</Typography>
                      </div>
                    </div>
                    <Radio
                      value={item.code} 
                      checked={selectedCode === item.code}
                    />
                  </div>
                ))
              ) : null}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ManageEmpCodeDialog
