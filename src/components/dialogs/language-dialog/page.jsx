'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
} from '@mui/material';

import Grid from "@mui/material/Grid2";

// Hook Form + Validation
import { useForm, Controller } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'
import {
  object,
  string,
  pipe,
  minLength,
  maxLength,
  regex
} from 'valibot'

import { useSession } from 'next-auth/react'

import { toast } from 'react-toastify'

// Components
import CustomTextField from '@core/components/mui/TextField'
import DialogCloseButton from '../DialogCloseButton'


// Schema (status removed)
const languageSchema = object({
  name: pipe(
    string(),
    minLength(1, 'Language name is required'),
    maxLength(100, 'Name can be of max 100 length'),
    regex(/^[A-Za-z]+$/, 'Only alphabets are allowed')
  ),
  short_name: pipe(
    string(),
    minLength(1, 'Short name is required'),
    maxLength(4, 'Short name can be of max 4 length'),
    regex(/^[A-Za-z]+$/, 'Only alphabets are allowed')
  )
})

const LanguageDialog = ({ open, setOpen, title = '', fetchLanguageData, selectedLanguage, typeForm, tableData }) => {

  const [loading, setLoading] = useState(false)

  const { data: session } = useSession()
  const token = session?.user?.token
  const API_URL = process.env.NEXT_PUBLIC_API_URL

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors }
  } = useForm({
    resolver: valibotResolver(languageSchema),
    defaultValues: {
      name: '',
      short_name: ''
    }
  })

  useEffect(() => {
    if (open && selectedLanguage) {
      reset({ name: selectedLanguage.language_name, short_name: selectedLanguage.short_name })
    }
  }, [open, selectedLanguage])

  const handleClose = () => {
    reset()
    setOpen(false)
  }

  const submitData = async (formData) => {

    if (tableData && tableData.length > 0) {
      let hasError = false;

      if (selectedLanguage) {

        const existName = tableData.find(item =>
          item.language_name.trim().toLowerCase() === formData.name.trim().toLowerCase() &&
          item._id !== selectedLanguage._id
        );

        const existShortName = tableData.find(item =>
          item.short_name.trim().toLowerCase() === formData.short_name.trim().toLowerCase() &&
          item._id !== selectedLanguage._id
        );

        if (existName) {
          setError('name', {
            type: 'manual',
            message: 'Language name must be unique.'
          });

          return;
        }

        if (existShortName) {
          setError('short_name', {
            type: 'manual',
            message: 'Language short name must be unique.'
          });

          return;
        }

      } else {

        const name = formData?.name?.trim();
        const short_name = formData?.short_name?.trim();

        if (!name) return; // Skip empty names (optional)

        const existName = tableData.some(value =>
          value.language_name.trim().toLowerCase() === name.toLowerCase()
        );

        const existShortName = tableData.some(value =>
          value.short_name.trim().toLowerCase() === short_name.toLowerCase()
        );

        if (existName) {
          setError(`name`, {
            type: 'manual',
            message: 'Language name must be unique.'
          });
          hasError = true;
        }

        if (existShortName) {
          setError('short_name', {
            type: 'manual',
            message: 'Language short name must be unique.'
          });

          return;
        }

        if (hasError) return;
      }
    }

    setLoading(true)

    try {
      const url = selectedLanguage
        ? `${API_URL}/company/language/${selectedLanguage._id}`
        : `${API_URL}/company/language`

      const method = selectedLanguage ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {

        fetchLanguageData?.()
        toast.success(`Zone(s) ${selectedLanguage ? 'updated' : 'added'} successfully!`)
        handleClose()
      } else {
        console.error('Server error:', data)
      }
    } catch (err) {
      console.error('Submit error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      fullWidth
      maxWidth="md"
      open={open}
      scroll="body"
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
    >
      <DialogCloseButton onClick={handleClose}>
        <i className="tabler-x" />
      </DialogCloseButton>

      <DialogTitle variant="h4" className="text-center sm:pbs-16 sm:pbe-6 sm:pli-16">
        {selectedLanguage ? 'Edit language' : 'Add language'}
      </DialogTitle>

      <form onSubmit={handleSubmit(submitData)} noValidate>
        <DialogContent className="overflow-visible flex flex-col gap-6 sm:pli-16">

          <>
            <Grid item size={{ xs: 12, md: 11,  }}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    required
                    label="Language Name"
                    placeholder="Enter language name"
                    fullWidth
                    onKeyDown={(e) => {
                      const key = e.key;

                      // Allow: only alphabet letters (A–Z, a–z), plus navigation/control keys
                      const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'];

                      if (!/^[a-zA-Z]$/.test(key) && !allowedKeys.includes(key)) {
                        e.preventDefault();
                      }
                    }}
                    onPaste={(e) => {
                      const paste = e.clipboardData.getData('text');

                      if (!/^[a-zA-Z]+$/.test(paste)) {
                        e.preventDefault();
                      }
                    }}
                    error={!!errors?.name}
                    helperText={errors?.name?.message}
                  />
                )}
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 11,  }}>
              <Controller
                name='short_name'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    required
                    label="Short Name"
                    placeholder="Enter short name"
                    fullWidth
                    onKeyDown={(e) => {
                      const key = e.key;

                      // Allow: only alphabet letters (A–Z, a–z), plus navigation/control keys
                      const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'];

                      if (!/^[a-zA-Z]$/.test(key) && !allowedKeys.includes(key)) {
                        e.preventDefault();
                      }
                    }}
                    onPaste={(e) => {
                      const paste = e.clipboardData.getData('text');

                      if (!/^[a-zA-Z]+$/.test(paste)) {
                        e.preventDefault();
                      }
                    }}
                    error={!!errors.short_name}
                    helperText={errors.short_name?.message}
                  />
                )}
              />
            </Grid>
          </>
        </DialogContent>

        <DialogActions className="justify-center sm:pbe-16 sm:pli-16">
          <Button variant="contained" type="submit" disabled={loading}>
            {loading ? (
              <CircularProgress
                size={24}
                sx={{
                  color: 'white',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  mt: '-12px',
                  ml: '-12px',
                }}
              />
            ) : selectedLanguage ? 'Update' : 'Submit'}
          </Button>
          <Button variant="tonal" color="secondary" onClick={handleClose}>
            Cancel
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default LanguageDialog
