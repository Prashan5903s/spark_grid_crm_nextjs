'use client'

// React Imports
import { useEffect, useRef, useState, } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Dialog from '@mui/material/Dialog'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import MenuItem from '@mui/material/MenuItem'
import Checkbox from '@mui/material/Checkbox'
import { CircularProgress, FormControlLabel, FormGroup, IconButton, InputAdornment } from '@mui/material'

// Component Imports
import { toast } from 'react-toastify'

import { Controller, useForm } from 'react-hook-form'

import { valibotResolver } from '@hookform/resolvers/valibot'

import { object, string, trim, minLength, maxLength, pipe, maxSize, instance, optional } from "valibot"

import DialogCloseButton from '@components/dialogs/DialogCloseButton'

import CustomTextField from '@core/components/mui/TextField'

import tableStyles from '@core/styles/table.module.css'

const ITEM_HEIGHT = 48
const ITEM_PADDING_TOP = 8

const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP
        }
    }
}

const initialData = {
    sscId: '',
    resourceName: '',
    file: undefined,
    description: '',
    assessor: []
}

const schema = object(
    {
        sscId: pipe(string(), trim(), minLength(1, 'Sector skill council is required')),
        resourceName: pipe(string(), trim(), minLength(1, 'Resource name is required'), maxLength(100, 'The maximum length for this field is 100 characters.')),
        file: optional(pipe(instance(File), maxSize(1024 * 1024 * 10, 'Please select a file smaller than 10 MB.')
        )),
        description: optional(pipe(string(), trim(), maxLength(255, 'The maximum length for a Description is 255 characters.')))
    }
)

const AddEditTrainingResourcesDialog = ({ open, trainingResourceId, handleClose, updateTrainingResourceList, data }) => {

    // States
    const [userData, setUserData] = useState(data)
    const [loading, setLoading] = useState(false);
    const [ssData, setSscUsers] = useState([])
    const [fileName, setFileName] = useState('')
    const [assessorData, setAssessorData] = useState([])
    const fileInputRef = useRef(null)
    const [selectedCheckbox, setSelectedCheckbox] = useState([])
    const [isIndeterminateCheckbox, setIsIndeterminateCheckbox] = useState(false)


    const getSSCData = async () => {
        // Vars
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sectorskills`)

        // if (!res.ok) {
        //     throw new Error('Failed to fetch sector skills council')
        // }

        // const userData = await res.json();

        // setSscUsers(userData);

    }

    const getTrainingResource = async (resourceId) => {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/training-resources/${resourceId}`)

        if (!res.ok) {
            throw new Error('Failed to fetch Training Resource')
        }

        const resourceData = await res.json();

        console.table(resourceData);

        handleSSCChange(resourceData.ssc_id.toString());

        setFileName(resourceData.file || "");

        const userIds = resourceData.user_training_resources.map((resource) => resource.user_id);

        console.log(userIds);  // Output: [6, 5, 4]

        setSelectedCheckbox(userIds);

        if (resourceData.file) {

            const fileUrl = `/uploads/agency/training-resources/${resourceData.id}/${resourceData.file}`;

            const fileRes = await fetch(fileUrl);

            if (!fileRes.ok) {
                throw new Error('Failed to fetch the file');
            }

            // Convert the file to a Blob
            const blob = await fileRes.blob();

            // Create a File object from the Blob (you can specify the filename here)
            const file = new File([blob], resourceData.file, { type: blob.type });

            console.log("file", file);
            setUserData({
                sscId: resourceData.ssc_id.toString(),
                resourceName: resourceData.name,
                description: resourceData.description,
                file: file,
                assessor: []
            })
        } else {
            setUserData({
                sscId: resourceData.ssc_id.toString(),
                resourceName: resourceData.name,
                description: resourceData.description,
                file: undefined,
                assessor: []
            })
        }



        // Now set the File object in the form state
        // setValue('file', file);

        // setValue('file', fileUrl);


    }

    const togglePermission = (id) => {
        const arr = selectedCheckbox

        if (selectedCheckbox.includes(id)) {
            arr.splice(arr.indexOf(id), 1)
            setSelectedCheckbox([...arr])
        } else {
            arr.push(id)
            setSelectedCheckbox([...arr])
        }
    }

    const handleSelectAllCheckbox = () => {
        if (isIndeterminateCheckbox) {
            setSelectedCheckbox([])
        } else {
            assessorData?.forEach(assessor => {
                const id = assessor.id

                togglePermission(id)
            })
        }
    }

    useEffect(() => {

        if (selectedCheckbox.length > 0 && selectedCheckbox.length < assessorData?.length) {

            setIsIndeterminateCheckbox(true)

        } else {

            setIsIndeterminateCheckbox(false)

        }
    }, [selectedCheckbox, assessorData])

    useEffect(() => {

        setUserData(data);
        getSSCData()

        // if(trainingResourceId){
        //   getTrainingResource(trainingResourceId)
        // }
    }, [data]);

    useEffect(() => {

        if (open && trainingResourceId) {
            getTrainingResource(trainingResourceId)
        }

    }, [open, trainingResourceId])

    // Hooks
    const {
        control,
        reset,
        setValue,
        setError,
        clearErrors,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: valibotResolver(schema),
        values: userData,
        defaultValues:{
            resourceName: "",
            sscId: ""
        }
    })

    // Handle File Upload
    const handleFileUpload = (event) => {
        const { files } = event.target

        if (files && files.length !== 0) {
            setFileName(files[0].name)
            setValue('file', files[0])
            clearErrors(['file', 'description'])
        }
    }

    const handleFileClear = () => {
        setFileName('');
        setValue('file', undefined)

        // setError('file', {type: "custom", message: "This field is required" })
    }

    const handleSSCChange = async (ssc) => {

        setAssessorData([]);
        setSelectedCheckbox([])

        const sscId = Number(ssc);

        if (ssc) {

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/assessor?sscId=${sscId}`).then(function (response) { return response.json() })

            console.log("Assessor data", res);

            setAssessorData(res);
        } else {

            setAssessorData([]);
        }
    };

    const onSubmit = async (data) => {
        // e.preventDefault();

        data.assessor = selectedCheckbox

        if (!data.file && !data.description) {
            setError('file', { type: "custom", message: "Either a file or a description must be provided." })
            setError('description', { type: "custom", message: "Either a file or a description must be provided." })

            return
        } else {
            clearErrors(['file', 'description'])
        }

        setLoading(true)

        console.log("submitted data:", data);

        const formData = new FormData();

        formData.append("sscId", data.sscId);
        formData.append("resourceName", data.resourceName || "");
        formData.append("description", data.description || "");
        formData.append("assessor", JSON.stringify(data.assessor || ""))
        formData.append("file", data.file || "")

        if (trainingResourceId) {

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/training-resources/${trainingResourceId}`, {

                method: 'POST',
                body: formData

            });

            if (res.ok) {
                setLoading(false);
                reset();
                toast.success('Training Resource has been updated successfully!', {
                    hideProgressBar: false
                });
                updateTrainingResourceList();
            } else {
                setLoading(false);
                toast.error('Training Resource not updated. Something went wrong here!', {
                    hideProgressBar: false
                });
            }

        } else {


            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/training-resources`, {

                method: 'POST',
                body: formData

            });


            if (res.ok) {
                setLoading(false)
                reset();

                toast.success('New Training Resources has been created successfully!', {
                    hideProgressBar: false
                });
                updateTrainingResourceList();

            } else {
                setLoading(false)
                toast.error('Something went wrong!', {
                    hideProgressBar: false
                });


            }
        }

        setLoading(false)
        handleReset();
        handleClose();
    }

    const handleReset = () => {
        reset();
        setFileName('');
        setUserData(initialData);
        setAssessorData([])

        handleClose();
    }

    return (
        <Dialog
            fullWidth
            open={open}
            onClose={handleReset}
            maxWidth='md'
            scroll='body'
            sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
        >
            <DialogCloseButton onClick={handleReset} disableRipple>
                <i className='tabler-x' />
            </DialogCloseButton>
            <DialogTitle variant='h4' className='flex gap-2 flex-col text-center sm￼bs-16 sm￼be-6 sm￼li-16'>
                {trainingResourceId ? 'Edit ' : 'Add '}Training Resource
            </DialogTitle>
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <DialogContent className='overflow-visible pbs-0 sm￼li-16'>
                    <Grid container spacing={5}>
                        <Grid item size={{ xs: 12, sm: 6 }}>
                            <Controller
                                control={control}
                                name='sscId'
                                rules={{ required: true }}
                                render={({ field }) => (
                                    <CustomTextField
                                        fullWidth
                                        select
                                        label='Sector Skill Council'
                                        {...field}
                                        {...(errors.sscId && { error: true, helperText: errors.sscId.message })}
                                        SelectProps={{ MenuProps }}
                                        required={true}

                                        // value={userData?.sscId}
                                        onChange={e => { handleSSCChange(e.target.value); field.onChange }}
                                    >
                                        {ssData.map((ssc, index) => (
                                            <MenuItem key={index} value={ssc.id.toString()}>
                                                {ssc.ssc_name}
                                            </MenuItem>
                                        ))}
                                    </CustomTextField>
                                )}
                            />
                        </Grid>
                        <Grid item size={{ xs: 12, sm: 6 }}>
                            <Controller
                                control={control}
                                name='resourceName'
                                rules={{ required: true }}
                                render={({ field }) => (
                                    <CustomTextField
                                        fullWidth
                                        required={true}
                                        {...field}
                                        {...(errors.resourceName && { error: true, helperText: errors.resourceName.message })}
                                        label='Resource Name'
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item size={{ xs: 12 }}>
                            <div className={`flex ${errors.file ? 'items-center' : 'items-end'} gap-4`}>
                                <Controller
                                    control={control}
                                    name='file'
                                    rules={{ required: true }}
                                    render={({ field }) => (
                                        <CustomTextField
                                            fullWidth
                                            placeholder='Choose File'
                                            variant='outlined'
                                            {...field}

                                            // required={true}
                                            value={fileName}
                                            label='Select File'
                                            {...(errors.file && { error: true, helperText: errors.file.message })}
                                            InputProps={{
                                                readOnly: true,
                                                endAdornment: fileName ? (
                                                    <InputAdornment position='end'>
                                                        <IconButton size='small' edge='end' onClick={handleFileClear}>
                                                            <i className='tabler-x' />
                                                        </IconButton>
                                                    </InputAdornment>)
                                                    : null
                                            }}
                                        />

                                    )}
                                />
                                <Button component='label' variant='tonal' htmlFor='contained-button-file'>
                                    Choose
                                    <input hidden id='contained-button-file' type='file' onChange={handleFileUpload} ref={fileInputRef} />
                                </Button>
                            </div>
                        </Grid>
                        <Grid item size={{ xs: 12 }}>
                            <Controller
                                control={control}
                                name='description'
                                rules={{ required: true }}
                                render={({ field }) => (
                                    <CustomTextField
                                        fullWidth
                                        multiline
                                        minRows={3}
                                        maxRows={5}

                                        // required={true}
                                        {...field}
                                        {...(errors.description && { error: true, helperText: errors.description.message })}
                                        label='Resource Description'
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item size={{ xs: 12 }}>
                            <div className='overflow-x-auto'>
                                <table className={tableStyles.table}>
                                    <thead>
                                        <tr className='border-bs-0'>
                                            <th className='pis-0'>
                                                <FormControlLabel
                                                    className='mie-0 capitalize'
                                                    control={
                                                        <Checkbox
                                                            onChange={handleSelectAllCheckbox}
                                                            indeterminate={isIndeterminateCheckbox}
                                                            checked={assessorData.length > 0 && selectedCheckbox.length === assessorData?.length}
                                                        />
                                                    }
                                                    label='Select All'
                                                />
                                            </th>
                                            {/* <th >
                        <Typography color='text.primary' className='font-medium whitespace-nowrap flex-grow'>
                          NOS ID
                        </Typography>
                      </th> */}
                                            <th className='pie-0'>
                                                <Typography color='text.primary' className='font-medium whitespace-nowrap flex-grow min-is-[225px]'>
                                                    Assessor Name
                                                </Typography>
                                            </th>

                                        </tr>
                                    </thead>
                                    {assessorData.length === 0 ? (
                                        <tbody>
                                            <tr>
                                                <td colSpan={2} className='text-center'>
                                                    No data available
                                                </td>
                                            </tr>
                                        </tbody>
                                    ) : (
                                        <tbody>
                                            {assessorData?.map((assessor, index) => {
                                                // const id = (typeof item === 'string' ? item : item.title).toLowerCase().split(' ').join('-')

                                                return (
                                                    <tr key={index} className='border-be'>
                                                        <td className='!text-end pis-0'>
                                                            <FormGroup className='flex-row justify-start flex-nowrap gap-6'>
                                                                <Controller
                                                                    control={control}
                                                                    name={`assessor.${assessor.id}`}
                                                                    defaultValue={21}
                                                                    render={({ field }) => (

                                                                        <FormControlLabel
                                                                            {...field}
                                                                            className='mie-0'
                                                                            control={
                                                                                <Checkbox id={assessor.id.toString()}
                                                                                    name={`assessor[${index}]`}
                                                                                    onChange={() => togglePermission(assessor.id)}
                                                                                    checked={selectedCheckbox.includes(assessor.id)} />
                                                                            }
                                                                            label=''
                                                                        />
                                                                    )}
                                                                />
                                                            </FormGroup>
                                                        </td>
                                                        {/* <td>
                              <Typography
                                className='font-medium whitespace-nowrap flex-grow'
                                color='text.primary'
                              >
                                {assessor.nos_id}
                              </Typography>
                            </td> */}
                                                        <td className='pie-0'>
                                                            <Typography
                                                                className='font-medium whitespace-nowrap flex-grow min-is-[225px]'
                                                                color='text.primary'
                                                            >
                                                                {assessor.first_name} {assessor.last_name}
                                                            </Typography>
                                                        </td>

                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    )}
                                </table>
                            </div>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions className='justify-center pbs-0 sm￼be-16 sm￼li-16'>
                    <Button variant='contained' type='submit' disabled={loading}>
                        {loading && <CircularProgress size={20} color='inherit' />}
                        Submit
                    </Button>
                    <Button variant='tonal' color='secondary' type='reset' onClick={handleReset}>
                        Cancel
                    </Button>
                </DialogActions>
            </form>
        </Dialog >
    )
}

export default AddEditTrainingResourcesDialog
