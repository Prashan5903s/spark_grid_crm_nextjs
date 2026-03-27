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
  IconButton
} from '@mui/material'

import Grid from "@mui/material/Grid2";

// Hook Form + Validation
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'
import {
  object,
  string,
  array,
  pipe,
  minLength,
  maxLength,
  regex
} from 'valibot'

// Components

import { useSession } from 'next-auth/react'

import { toast } from 'react-toastify'

import CustomTextField from '@core/components/mui/TextField'
import DialogCloseButton from '../DialogCloseButton'

// Schema (status removed)
const zoneSchema = object({
  name: pipe(string(), minLength(1, 'Zone name is required'), maxLength(50, 'Zone name max length is 50'))
})

const schema = object({
  zones: pipe(array(zoneSchema), minLength(1, 'At least one zone must be added'), maxLength(50, 'Zone name max length is 50'))
})

const ZoneDialog = ({ open, setOpen, title = '', fetchZoneData, selectedZone, typeForm, tableData }) => {

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
    resolver: valibotResolver(selectedZone ? zoneSchema : schema),
    defaultValues: {
      zones: [{ name: '' }]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'zones'
  })

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && selectedZone) {

      reset({ name: selectedZone.name })
    }
  }, [open, selectedZone])

  const handleClose = () => {
    reset()
    setOpen(false)
  }

  const submitData = async (formData) => {

    if (tableData && tableData.length > 0) {
      let hasError = false;

      if (selectedZone) {
        const exist = tableData.find(item =>
          item.name.trim().toLowerCase() === formData.name.trim().toLowerCase() &&
          item._id.toString().trim() !== selectedZone._id.toString().trim()
        );

        if (exist) {
          setError('name', {
            type: 'manual',
            message: 'This name already exists.'
          });

          return;
        }
      } else {
        formData.zones.forEach((zoneInForm, index) => {
          const name = zoneInForm.name?.trim();

          if (!name) return; // Skip empty names (optional)

          const existsInTable = tableData.some(zoneInTable =>
            zoneInTable.name.trim().toLowerCase() === name.trim().toLowerCase()
          );

          const duplicateInForm = formData.zones.filter(z =>
            z.name?.trim().toLowerCase() === name.trim().toLowerCase()
          );

          if (existsInTable || duplicateInForm.length > 1) {
            setError(`zones.${index}.name`, {
              type: 'manual',
              message: 'Zone name must be unique.'
            });
            hasError = true;
          }
        });

        if (hasError) return;
      }
    }

    setLoading(true)

    try {
      const url = selectedZone
        ? `${API_URL}/company/zone/${selectedZone._id}`
        : `${API_URL}/company/zone`

      const method = selectedZone ? 'PUT' : 'POST'

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
        fetchZoneData?.()
        toast.success(`Zone(s) ${selectedZone ? 'updated' : 'added'} successfully!`, {
          autoClose: 700
        })
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
        {selectedZone ? 'Edit Zone' : 'Add Zone'}
      </DialogTitle>

      <form onSubmit={handleSubmit(submitData)} noValidate>
        <DialogContent className="overflow-visible flex flex-col gap-6 sm:pli-16">
          {selectedZone ? (
            <Grid item size={{ xs: 12, md: 11,  }}>
              <Controller
                name={`name`}
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    required
                    label="Zone Name"
                    placeholder="Enter zone name"
                    fullWidth
                    onKeyDown={(e) => {
                      const key = e.key;
                      const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', ' ']; // include space

                      // Allow A-Z, a-z, and space
                      if (!/^[a-zA-Z ]$/.test(key) && !allowedKeys.includes(key)) {
                        e.preventDefault();
                      }
                    }}

                    onPaste={(e) => {
                      const paste = e.clipboardData.getData('text');

                      // Allow paste if it only contains letters and spaces
                      if (!/^[a-zA-Z ]+$/.test(paste)) {
                        e.preventDefault();
                      }
                    }}
                    error={!!errors?.name}
                    helperText={errors?.name?.message}
                  />
                )}
              />
            </Grid>
          ) : (
            <>
              {fields.map((field, index) => (
                <Grid container spacing={2} key={field.id} alignItems="center">
                  <Grid item size={{ xs: 12, md: 11,  }}>
                    <Controller
                      name={`zones.${index}.name`}
                      control={control}
                      render={({ field }) => (
                        <CustomTextField
                          {...field}
                          required
                          label="Zone Name"
                          placeholder="Enter zone name"
                          fullWidth
                          onKeyDown={(e) => {
                            const key = e.key;
                            const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', ' ']; // include space

                            // Allow A-Z, a-z, and space
                            if (!/^[a-zA-Z ]$/.test(key) && !allowedKeys.includes(key)) {
                              e.preventDefault();
                            }
                          }}

                          onPaste={(e) => {
                            const paste = e.clipboardData.getData('text');

                            // Allow paste if it only contains letters and spaces
                            if (!/^[a-zA-Z ]+$/.test(paste)) {
                              e.preventDefault();
                            }
                          }}
                          error={!!errors.zones?.[index]?.name}
                          helperText={errors.zones?.[index]?.name?.message}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item size={{ xs: 12, md: 1,  }} className="flex justify-end">
                    {fields.length > 1 && (
                      <IconButton
                        color="error"
                        onClick={() => remove(index)}
                        sx={{ mt: 1 }}
                        aria-label="Remove zone"
                      >
                        <i className="tabler-x" />
                      </IconButton>
                    )}
                  </Grid>
                </Grid>
              ))}
              <div>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => append({ name: '' })}
                  startIcon={<i className="tabler-plus" />}
                  sx={{ mt: 2, alignSelf: 'flex-start' }}
                >
                  Add more
                </Button>
              </div>
            </>
          )}
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
            ) : selectedZone ? 'Update' : 'Submit'}
          </Button>
          <Button variant="tonal" color="secondary" onClick={handleClose}>
            Cancel
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default ZoneDialog
