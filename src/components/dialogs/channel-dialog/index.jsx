// MUI Imports

import { useEffect, useState } from 'react';

import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Typography, Button, FormControl, CircularProgress,
    RadioGroup, Radio, FormControlLabel, Alert, MenuItem
} from '@mui/material';

// React Hook Form
import { useForm, Controller } from 'react-hook-form';
import { valibotResolver } from '@hookform/resolvers/valibot';

// Valibot schema

import {
    string, object, pipe, minLength,
    maxLength, boolean, regex
} from 'valibot';

// Components

import { useSession } from 'next-auth/react';

import { toast } from 'react-toastify';

import DialogCloseButton from '../DialogCloseButton';

import SkeletonFormComponent from '@/components/skeleton/form/page';

import CustomTextField from '@core/components/mui/TextField';


// Schema
const schema = object({
    id: pipe(),
    name: pipe(
        string(),
        minLength(1, 'Name is required'),
        maxLength(255, 'Name can be maximum of 255 characters'),
        regex(/^[A-Za-z0-9\s]+$/, 'Only alphabets, numbers, and spaces are allowed')
    ),
    channelId: string(),
    status: boolean()
});

const FormContent = ({ control, errors, createData, isEdit }) => (
    <DialogContent className='overflow-visible pbs-0 sm:pli-16'>
        <div className="flex items-end gap-4 mbe-2">
            <Controller
                name="name"
                control={control}
                render={({ field }) => (
                    <CustomTextField
                        {...field}
                        fullWidth
                        required
                        size="small"
                        variant="outlined"
                        label="Channel Name"
                        placeholder="Enter Channel Name"
                        onKeyDown={(e) => {
                            const key = e.key;

                            const allowedKeys = [
                                'Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Enter',
                                'Home', 'End', 'Escape'
                            ];

                            if (key.length === 1 || allowedKeys.includes(key)) return;
                            e.preventDefault();
                        }}
                        onPaste={(e) => {
                            const paste = e.clipboardData.getData('text');

                            if (!/^[\x20-\x7E\r\n\t]*$/.test(paste)) e.preventDefault();
                        }}
                        error={!!errors.name}
                        helperText={errors.name?.message}
                    />
                )}
            />
        </div>

        <Controller
            name="channelId"
            control={control}
            render={({ field }) => (
                <CustomTextField
                    {...field}
                    select
                    fullWidth
                    label="Parent Channel"
                    variant="outlined"
                    placeholder="Select Channel"
                    className="mbe-2"
                    error={!!errors.channelId}
                    helperText={errors.channelId?.message}
                >
                    {createData
                        .filter((item) => item.type === 'parent')
                        .map((item) => (
                            <MenuItem key={item.id} value={item.id.toString()}>
                                {item.name}
                            </MenuItem>
                        ))}
                </CustomTextField>
            )}
        />

        <Typography variant="h6" className="mbe-2">Status <span>*</span></Typography>
        <FormControl component="fieldset" error={!!errors.status}>
            <Controller
                name="status"
                control={control}
                render={({ field }) => (
                    <RadioGroup
                        row
                        value={field.value?.toString()}
                        onChange={(e) => field.onChange(e.target.value === 'true')}
                    >
                        <FormControlLabel value="true" control={<Radio />} label="Active" />
                        <FormControlLabel value="false" control={<Radio />} label="Inactive" />
                    </RadioGroup>
                )}
            />
            {errors.status && <Alert severity="error">{errors.status.message}</Alert>}
        </FormControl>
    </DialogContent>
);

const ChannelDialog = ({ open, setOpen, data, fetchPermissionModule, nameData }) => {

    const handleClose = () => setOpen(false);
    const URL = process.env.NEXT_PUBLIC_API_URL;
    const { data: session } = useSession() || {};
    const token = session?.user?.token;
    const [loading, setLoading] = useState(false);

    const {
        control,
        handleSubmit,
        reset,
        setError,
        formState: { errors }
    } = useForm({
        resolver: valibotResolver(schema),
        mode: 'onChange',
        defaultValues: {
            id: '',
            name: '',
            status: false,
            channelId: ''
        }
    });

    useEffect(() => {
        if (!open) return;

        if (data) {

            reset({
                id: data.id || '',
                name: data.name || '',
                status: data.status ?? false,
                channelId: data.channelId ? data.channelId.toString() : ''
            });
        } else {
            reset({
                id: '',
                name: '',
                status: false,
                channelId: ''
            });
        }
    }, [open, data, reset]);

    const submitData = async (values) => {
        setLoading(true);

        try {
            const isEdit = Boolean(data);
            const channelId = data?.channelId;

            const endpoint = isEdit
                ? `${URL}/company/channel/${channelId ? channelId : null}`
                : `${URL}/company/channel`;

            const method = isEdit ? 'PUT' : 'POST';

            const res = await fetch(endpoint, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(values)
            });

            const json = await res.json();

            if (res.ok) {
                fetchPermissionModule?.();
                toast.success(`Channel ${isEdit ? "updated" : "created"} successfully!`, { autoClose: 700 });
                setOpen(false);
                window.location.reload(); // optional: can be replaced with SWR refetch or router refresh
            } else {
                toast.error(json?.message || 'Something went wrong');
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to submit');
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = (values) => {
        const nameTrimmed = values.name.trim().toLowerCase();

        let duplicate = false;

        const channelId = values.channelId == '';

        if (channelId) {

            if (data) {

                duplicate = nameData.some(item =>
                    item.name.trim().toLowerCase() === nameTrimmed && item.type == 'parent' && item.id.toString() !== data.id.toString()
                );

            } else {

                duplicate = nameData.some(item =>
                    item.name.trim().toLowerCase() === nameTrimmed && item.type == 'parent'
                );

            }
        }

        if (duplicate) {
            setError('name', { type: 'manual', message: 'This name already exists.' });

            return;
        }

        submitData(values);
    };

    return (
        <Dialog fullWidth maxWidth='lg' open={open} onClose={handleClose} sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}>
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <DialogCloseButton onClick={handleClose}><i className='tabler-x' /></DialogCloseButton>
                <DialogTitle variant="h4" className='text-center sm:pbs-16 sm:pbe-6 sm:pli-16'>
                    {data ? 'Edit Channel' : 'Add Channel'}
                </DialogTitle>

                {nameData ? (
                    <FormContent control={control} errors={errors} createData={nameData} isEdit={!!data} />
                ) : <SkeletonFormComponent />}

                <DialogActions className='flex max-sm:flex-col max-sm:items-center max-sm:gap-2 justify-center pbs-0 sm:pbe-16 sm:pli-16'>
                    <Button type="submit" variant="contained" disabled={loading} sx={{ height: 40, position: 'relative' }}>
                        {loading
                            ? <CircularProgress size={24} sx={{ color: 'white', position: 'absolute', top: '50%', left: '50%', mt: '-12px', ml: '-12px' }} />
                            : (data ? 'Update' : 'Create')
                        }
                    </Button>
                    <Button onClick={handleClose} variant="tonal" color="secondary">Discard</Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default ChannelDialog;
