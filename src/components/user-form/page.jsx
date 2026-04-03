'use client'

// React Imports
import { useState, useEffect } from 'react'

import { useSession } from 'next-auth/react'

import { useRouter, useParams } from 'next/navigation'

import {
    CardContent,
    InputAdornment,
    CardActions,
    CircularProgress,
    IconButton,
    Button,
    MenuItem,
    Checkbox,
    Card,
    FormLabel,
    ListItemText,
    CardHeader,
    Typography,
    Radio,
    FormControl,
    FormControlLabel,
    RadioGroup,
    Divider
} from '@mui/material'

import Grid from '@mui/material/Grid2'

import { useForm, Controller, useFormContext } from 'react-hook-form'

import { valibotResolver } from '@hookform/resolvers/valibot';

import { toast } from 'react-toastify'

import {
    object,
    string,
    minLength,
    maxLength,
    pipe,
    boolean,
    check,
    optional,
    email,
    custom,
    array
} from 'valibot';

import { useApi } from '../../utils/api';

import SkeletonFormComponent from '../skeleton/form/page'

import CustomTextField from '@core/components/mui/TextField'
import PermissionGuard from '@/hocs/PermissionClientGuard'

const UserFormLayout = () => {

    const URL = process.env.NEXT_PUBLIC_API_URL
    const public_url = process.env.NEXT_PUBLIC_ASSETS_URL;

    const { data: session } = useSession() || {}
    const token = session?.user?.token

    const [createData, setCreateData] = useState({ 'country': [] }, { designations: [] });
    const [countryId, setCountryId] = useState();
    const [stateData, setStateData] = useState();
    const [stateId, setStateId] = useState();
    const [cityData, setCityData] = useState();
    const [editData, setEditData] = useState();
    const [selectZone, setSelectZone] = useState();
    const [selectRegion, setSelectRegion] = useState();
    const [selectedRegion, setSelectedRegion] = useState();
    const [selectedBranch, setSelectedBranch] = useState();
    const [userRoles, setUserRoles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loading, setLoading] = useState(false)

    const { doGet, doPost } = useApi();

    const router = useRouter();

    const { lang: locale, id: id } = useParams()

    const schema = object({
        first_name: pipe(
            string(),
            minLength(1, 'First Name is required'),
            maxLength(255, 'First Name can be a maximum of 255 characters')
        ),
        last_name: pipe(
            string(),
            minLength(1, 'Last Name is required'),
            maxLength(255, 'Last Name can be a maximum of 255 characters')
        ),
        email: pipe(
            string(),
            minLength(1, 'Email is required'),
            email('Please enter a valid email address'),
            maxLength(255, 'Email can be a maximum of 255 characters')
        ),
        alternative_email: optional(string()),
        password: id
            ? optional(string())
            : pipe(
                string(),
                minLength(6, 'Password min length should be 6'),
                maxLength(255, 'Password can be a maximum of 255 characters')
            ),
        country_id: pipe(
            string(),
            minLength(1, 'Country is required')
        ),
        state_id: pipe(
            string(),
            minLength(1, 'State is required')
        ),
        city_id: pipe(
            string(),
            minLength(1, 'City is required')
        ),
        reporting_manager_id: string(),
        address: pipe(
            string(),
            minLength(1, 'Address is required'),
            maxLength(1000, 'Address can be a maximum of 1000 characters')
        ),
        pincode: pipe(
            string(),
            minLength(6, 'Pincode should have min length of 6'),
            maxLength(10, 'Pincode max length is of 10 digit'),
            custom((value) => /^\d+$/.test(value), 'Pincode must contain digits only')
        ),
        phone: pipe(
            string(),
            minLength(7, 'Phone number must be valid'),
            maxLength(15, 'Phone number can be a maximum of 15 digits')
        ),
        website: optional(
            string([
                check(
                    (value) =>
                        value === '' ||
                        (
                            value.length >= 8 &&
                            value.length <= 50 &&
                            /^(https?:\/\/)?([\w\-]+\.)+[\w\-]{2,}(\/[\w\-./?%&=]*)?$/.test(value)
                        ),
                    'Please enter a valid website URL (e.g., https://example.com) between 8 and 50 characters'
                ),
            ])
        ),
        photo: optional(string()), // Optional field or could validate file type
        status: boolean(), // or optional(boolean()) if not required
        designation_id: optional(string()), // or optional(boolean()) if not required
        department_id: optional(string()),
        urn_no: optional(string()),
        idfa_code: optional(string()),
        application_no: optional(string()),
        licence_no: optional(string()),
        zone_id: optional(string()),
        region_id: optional(string()),
        branch_id: optional(string()),
        participation_type_id: pipe(string(), minLength(1, 'Participation type is required')),
        employee_type: optional(string()),
        dob: optional(
            pipe(
                string(),
                custom(
                    (value) => !value || !isNaN(Date.parse(value)),
                    'Invalid Date of Birth'
                )
            )
        ),
        roles: array(
            string([minLength(1, 'Each role must be at least 1 character')]),
            [minLength(1, 'At least one role must be selected')]
        ),
        user_code: pipe(
            string(),
            minLength(1, 'User code is required'),
            maxLength(10, 'User code can be a maximum of 10 characters')
        ),
    });

    const [userList, setUseList] = useState();

    // States
    const [formData, setFormData] = useState({
        company_name: '',
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        country_id: '',
        state_id: '',
        city_id: '',
        region_id: '',
        branch_id: "",
        address: '',
        pincode: '',
        dob: '',
        phone: '',
        photo: '',
        website: '',
        status: false,
        reporting_manager_id: "",
        roles: [],
        user_code: ''
    })

    const handleClickShowPassword = () => setFormData(show => ({ ...show, isPasswordShown: !show.isPasswordShown }))

    // const [formData, setFormData] = useState(initialData)
    const [imgSrc, setImgSrc] = useState('/images/avatars/11.png');

    // Hooks
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
            first_name: '',
            last_name: '',
            email: '',
            password: '',
            country_id: '',
            branch_id: "",
            state_id: '',
            city_id: '',
            address: '',
            pincode: '',
            dob: '',
            phone: '',
            photo: '',
            website: '',
            reporting_manager_id: "",
            status: false,
            urn_no: '',
            idfa_code: '',
            application_no: '',
            licence_no: '',
            roles: [],
            user_code: '',
            employee_type: '',
            participation_type_id: '',
            zone_id: '',
            region_id: '',
            branch_id: '',
            designation_id: '',
            department_id: '',
            alternative_email: ''

        }
    });

    const checkEmailCompany = async (email, id) => {
        try {
            const safeId = id || 'null'; // fallback to 'null' when id is undefined

            const response = await fetch(`${URL}/admin/company/email/check/${email}/${safeId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (response.ok) {
                return data.exists;
            } else {
                console.error('Failed to check email:', data);

                return false;
            }
        } catch (error) {
            console.error('Error occurred while checking email:', error);

            return false;
        }
    };

    const editFormData = async () => {
        try {
            const response = await fetch(`${URL}/admin/user/${id}/edit`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            const result = await response.json();

            if (!response.ok) {
                // If server responded with an error status, handle it explicitly
                console.error('Failed to fetch user data:', result.message || result);

                return;
            }

            if (result?.data) {
                setEditData(result.data);
            } else {
                console.warn('No data found in response:', result);
            }

        } catch (error) {
            console.error('Network or parsing error:', error);
        }
    };

    const loadData = async () => {
        try {
            const countryData = await doGet(`admin/countries`);
            const designationData = await doGet(`admin/designations?status=true`);
            const zoneData = await doGet(`company/zone`);
            const branchData = await doGet('company/branch')
            const departmentData = await doGet('company/department')
            const participationTypesData = await doGet(`admin/participation_types?status=true`);
            const roleData = await doGet(`company/role`);
            const usersData = await doGet(`admin/company`)

            console.log("USer", usersData?.company);


            setCreateData(prevData => ({
                ...prevData,
                country: countryData.country,         // assuming your API returns data inside `.data`
                designations: designationData, // same here
                department: departmentData,
                zones: zoneData, // same here
                branch: branchData,
                usersData: usersData?.company,
                participation_types: participationTypesData, // same here
                roles: roleData, // same here
            }));

            setIsLoading(false);
        } catch (error) {
            console.error('Error loading data:', error.message);
        }
    };

    useEffect(() => {
        if (URL && token) {
            loadData();

            if (id) {
                editFormData();
            }
        }

    }, [URL, token, id])

    useEffect(() => {

        if (createData && id) {

            const filteredUsers = createData?.usersData?.filter(
                (user) => user._id !== id
            );

            setUseList(filteredUsers)

        } else {

            setUseList(createData?.usersData)
        }

    }, [createData, id])

    useEffect(() => {
        if (id && editData) {
            reset({
                first_name: editData.first_name ?? '',
                last_name: editData.last_name ?? '',
                email: editData.email ?? '',
                alternative_email: editData.alternative_email ?? '',
                phone: editData.phone ?? '',
                address: editData.address ?? '',
                pincode: editData.pincode ?? '',
                country_id: editData.country_id ?? '',
                state_id: editData.state_id ?? '',
                city_id: editData.city_id ?? '',
                status: editData.status ?? '',
                website: editData.website ?? '',
                urn_no: editData.urn_no ?? '',
                reporting_manager_id: editData?.reporting_manager_id ?? "",
                idfa_code: editData.idfa_code ?? '',
                application_no: editData.application_no ?? '',
                licence_no: editData.licence_no ?? '',
                participation_type_id: editData.participation_type_id ?? '',
                department_id: editData.department_id ?? '',
                employee_type: editData.employee_type ?? '',
                user_code: editData.emp_id ?? '',
                zone_id: editData.zone_id ?? '',
                region_id: editData.region_id ?? '',
                branch_id: editData.branch_id ?? '',
                dob: editData.dob
                    ? new Date(editData.dob).toISOString().split('T')[0]
                    : '',
                designation_id: editData.designation_id ?? '',
            });

            if (editData.photo) {
                setImgSrc(`${public_url}${editData.photo}`);
            }

            if (editData.country_id) setCountryId(editData.country_id);
            if (editData.state_id) setStateId(editData.state_id);

            if (editData.roles?.length > 0) {
                const rolesIds = editData.roles.map((role) => role.role_id);

                setUserRoles(rolesIds);
                setValue('roles', rolesIds);
            }

            if (editData.zone_id) {
                setSelectZone(editData.zone_id);
            }

            if (editData.region_id) {
                setSelectedRegion(editData.region_id);
            }

            if (editData.branch_id && createData?.branch) {
                const branchData = createData?.branch.filter((b) => b.regionId == editData.region_id) || [];

                setSelectedBranch(branchData);
            }
        }
    }, [id, editData, reset, setValue, createData]);

    useEffect(() => {
        if (countryId && createData?.country.length > 0) {
            const data = createData && createData['country'].find(item => item.country_id == countryId);
            const states = data['states'];

            setStateData(states);
        }
    }, [countryId, createData])

    const submitFormData = async (values) => {
        try {

            if (values.roles.length == 0) {
                setError('roles', {
                    type: 'manual',
                    message: 'Please select at least one role.'
                });

                return;
            }

            const formData = new FormData();

            // Append file first — must match multer field name
            if (values.photo) {
                formData.append('photo', values.photo);
            }

            // Append all other fields
            Object.entries(values).forEach(([key, value]) => {
                if (key !== 'photo') {
                    formData.append(key, value);
                }
            });
            setLoading(true);

            const response = await fetch(id ? `${URL}/admin/user/${id}` : `${URL}/admin/user`, {
                method: id ? "PUT" : "POST",
                headers: {
                    Authorization: `Bearer ${token}` // ✅ No content-type here
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                router.push(`/${locale}/apps/user/list`)
                toast.success(`User ${id ? "updated" : "added"} successfully!`, {
                    autoClose: 700, // in milliseconds
                });
            } else {
                if (data?.message) {
                    toast.error(data?.message, {
                        autoClose: 1200, // in milliseconds
                    });

                }

            }
        } catch (error) {
            if (data?.message) {

                toast.error(data?.message, {
                    autoClose: 1200, // in milliseconds

                });
            }

        } finally {
            setLoading(false)
        }
    };

    const onSubmit = async (data) => {
        const newUser = {
            ...data,
            photo: file
        };

        const exist = await checkEmailCompany(data?.email, id);

        if (exist) {
            setError('email', {
                type: 'manual',
                message: 'This email is already in use.'
            });

            return;
        }

        submitFormData(newUser);
    };

    const [file, setFile] = useState(null);

    const handleFileInputChange = (event) => {
        const selectedFile = event.target.files[0];

        if (!selectedFile) return;

        const validTypes = ['image/jpeg', 'image/gif', 'image/png'];

        if (!validTypes.includes(selectedFile.type)) {
            setError('photo', {
                type: 'manual',
                message: 'Invalid file type. Only JPG, GIF, or PNG are allowed.'
            });

            return;
        }

        if (selectedFile.size > 800 * 1024) {
            setError('photo', {
                type: 'manual',
                message: 'File size exceeds 800KB.'
            });

            return;
        }

        setFile(selectedFile); // Save the actual File object

        const reader = new FileReader();

        reader.onload = () => setImgSrc(reader.result);
        reader.readAsDataURL(selectedFile);
    };

    const handleFileInputReset = () => {
        setFile('')
        setImgSrc('/images/avatars/11.png')
    }

    useEffect(() => {
        if (stateId && stateData) {
            const data = stateData && stateData.find(item => item.state_id == stateId);
            const city = data['cities'];

            setCityData(city);
        }
    }, [stateId, stateData])

    useEffect(() => {
        if (selectZone && createData) {

            const selectRegions = createData?.zones?.find((item) => item._id === selectZone);

            setSelectRegion(selectRegions?.region || []);
        }
    }, [selectZone, createData, setValue]);

    useEffect(() => {
        if (selectedRegion && createData) {

            const branchData = createData?.branch?.filter((item) => item.regionId === selectedRegion) || [];

            setSelectedBranch(branchData);

        }
    }, [selectedRegion, createData, setValue]);

    if (!createData || isLoading) {
        return (
            <>
                <PermissionGuard
                    element={id ? 'hasUserEditPermission' : 'hasUserAddPermission'}
                    locale={locale}
                >
                    <SkeletonFormComponent />
                </PermissionGuard>
            </>
        )
    }

    return (
        <Card>
            <CardHeader title={id ? `Edit ${editData?.first_name}` : 'Add New User'} />
            <Divider />
            <form onSubmit={handleSubmit(onSubmit)} noValidate encType="multipart/form-data">
                <CardContent>
                    <Grid container spacing={5}>
                        <Grid size={{ xs: 12 }}>
                            <Typography variant='body2' className='font-medium'>
                                1. Account Details
                            </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Controller
                                name="first_name"
                                control={control}
                                render={({ field }) => (
                                    <CustomTextField
                                        {...field}
                                        fullWidth
                                        label="First Name*"
                                        placeholder="First Name"
                                        error={!!errors.first_name}
                                        helperText={errors.first_name?.message}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            {/* Last Name */}
                            <Controller
                                name="last_name"
                                control={control}
                                render={({ field }) => (
                                    <CustomTextField
                                        {...field}
                                        fullWidth
                                        type="text"
                                        label="Last Name*"
                                        placeholder="Last Name"
                                        error={!!errors.last_name}
                                        helperText={errors.last_name?.message}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            {/* Email */}
                            <Controller
                                name="email"
                                control={control}
                                render={({ field }) => (
                                    <CustomTextField
                                        {...field}
                                        fullWidth
                                        type="email"
                                        label="Email*"
                                        placeholder="Email"
                                        error={!!errors.email}
                                        helperText={errors.email?.message}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            {/* Email */}
                            <Controller
                                name="alternative_email"
                                control={control}
                                render={({ field }) => (
                                    <CustomTextField
                                        {...field}
                                        fullWidth
                                        type="email"
                                        label="Alternate Email Address"
                                        placeholder="Alternate Email Address"
                                        error={!!errors.alternative_email}
                                        helperText={errors.alternative_email?.message}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            {/* Phone */}
                            <Controller
                                name="phone"
                                control={control}
                                render={({ field }) => (
                                    <CustomTextField
                                        {...field}
                                        fullWidth
                                        type="tel"
                                        label="Phone*"
                                        placeholder="Phone"
                                        error={!!errors.phone}
                                        helperText={errors.phone?.message}
                                    />
                                )}
                            />
                        </Grid>
                        {!id && (
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <Controller
                                    name="password"
                                    control={control}
                                    render={({ field }) => (
                                        <CustomTextField
                                            fullWidth
                                            label="Password*"
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
                            </Grid>
                        )}
                        <Grid size={{ xs: 12, sm: 4 }}>
                            {/* <Card className="p-4"> */}
                            <Typography variant="h6" className="mb-4">Profile Photo</Typography>
                            <CardContent className="flex flex-col sm:flex-row items-start gap-6 p-0">
                                <img
                                    src={imgSrc}
                                    alt="Profile"
                                    className="rounded-full object-cover border"
                                    style={{ width: 100, height: 100 }}
                                />
                                <div className="flex flex-col gap-2">
                                    <div className="flex flex-col gap-2 w-48">
                                        <Button component="label" variant="contained" fullWidth htmlFor="upload-image">
                                            Upload New Photo
                                            <input
                                                hidden
                                                type="file"
                                                accept="image/png, image/jpeg"
                                                id="upload-image"
                                                onChange={handleFileInputChange}
                                            />
                                        </Button>
                                        <Button variant="outlined" color="secondary" fullWidth onClick={handleFileInputReset}>
                                            Reset
                                        </Button>
                                    </div>
                                    {errors?.photo && (
                                        <Typography
                                            variant="body2"
                                            color="error"
                                            className="mt-2"
                                            style={{ color: 'var(--mui-palette-error-main)' }}
                                        >
                                            {errors.photo.message}
                                        </Typography>
                                    )}
                                </div>
                            </CardContent>
                            {/* </Card> */}
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <Divider />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <Typography variant='body2' className='font-medium'>
                                2. Personal Info
                            </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Controller
                                name="dob"
                                control={control}
                                render={({ field }) => (
                                    <CustomTextField
                                        {...field}
                                        fullWidth
                                        type="date"
                                        label="Date of birth"
                                        placeholder="Date of birth"
                                        error={!!errors.dob}
                                        helperText={errors.dob?.message}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 8 }}>
                            <Controller
                                name="address"
                                control={control}
                                render={({ field }) => (
                                    <CustomTextField
                                        {...field}
                                        fullWidth
                                        label="Address*"
                                        placeholder="Address"
                                        multiline
                                        rows={1}
                                        error={!!errors.address}
                                        helperText={errors.address?.message}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Controller
                                name="country_id"
                                control={control}
                                render={({ field }) => (
                                    <CustomTextField
                                        {...field}
                                        select
                                        fullWidth
                                        label="Country*"
                                        onChange={(e) => {
                                            const selectedCountryId = e.target.value;

                                            field.onChange(selectedCountryId); // update form value
                                            setCountryId(selectedCountryId);   // update local state or trigger other actions
                                        }}
                                        error={!!errors.country_id}
                                        helperText={errors.country_id?.message}
                                    >
                                        {createData?.country?.length > 0 &&
                                            createData.country.map((item, index) => (
                                                <MenuItem key={index} value={`${item.country_id}`}>
                                                    {item.country_name}
                                                </MenuItem>
                                            ))}
                                    </CustomTextField>
                                )}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            {/* State */}
                            <Controller
                                name="state_id"
                                control={control}
                                render={({ field }) => (
                                    <CustomTextField
                                        {...field}
                                        select
                                        fullWidth
                                        label="State*"
                                        onChange={(e) => {
                                            const selectStateId = e.target.value;

                                            field.onChange(selectStateId);
                                            setStateId(selectStateId);
                                        }}
                                        error={!!errors.state_id}
                                        helperText={errors.state_id?.message}
                                    >
                                        <MenuItem disabled value="1">Select state</MenuItem>
                                        {stateData && stateData.length > 0 && stateData.map((item, index) => (
                                            <MenuItem key={index} value={`${item.state_id}`}>{item.state_name}</MenuItem>
                                        ))}
                                    </CustomTextField>
                                )}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            {/* City */}
                            <Controller
                                name="city_id"
                                control={control}
                                render={({ field }) => (
                                    <CustomTextField
                                        {...field}
                                        select
                                        fullWidth
                                        label="City*"
                                        error={!!errors.city_id}
                                        helperText={errors.city_id?.message}
                                    >
                                        <MenuItem disabled value="1">Select city</MenuItem>
                                        {cityData && cityData.length > 0 && cityData.map((item, index) => (
                                            <MenuItem key={index} value={`${item.city_id}`}>{item.city_name}</MenuItem>
                                        ))}
                                    </CustomTextField>
                                )}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Controller
                                name="pincode"
                                control={control}
                                render={({ field }) => (
                                    <CustomTextField
                                        {...field}
                                        fullWidth
                                        type="number"
                                        label="Pincode*"
                                        placeholder="Pincode"
                                        error={!!errors.pincode}
                                        helperText={errors.pincode?.message}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <Divider />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <Typography variant='body2' className='font-medium'>
                                3. Other Details
                            </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Controller
                                name="urn_no"
                                control={control}
                                render={({ field }) => (
                                    <CustomTextField
                                        {...field}
                                        fullWidth
                                        type="text"
                                        label="URN Number"
                                        placeholder="URN Number"
                                        error={!!errors.gst_no}
                                        helperText={errors.gst_no?.message}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Controller
                                name="idfa_code"
                                control={control}
                                render={({ field }) => (
                                    <CustomTextField
                                        {...field}
                                        fullWidth
                                        type="text"
                                        label="Employee ID/FA Code"
                                        placeholder="Employee ID/FA Code"
                                        error={!!errors.gst_no}
                                        helperText={errors.gst_no?.message}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Controller
                                name="application_no"
                                control={control}
                                render={({ field }) => (
                                    <CustomTextField
                                        {...field}
                                        fullWidth
                                        type="text"
                                        label="Application Number"
                                        placeholder="Application Number"
                                        error={!!errors.gst_no}
                                        helperText={errors.gst_no?.message}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Controller
                                name="licence_no"
                                control={control}
                                render={({ field }) => (
                                    <CustomTextField
                                        {...field}
                                        fullWidth
                                        type="text"
                                        label="Licence Number"
                                        placeholder="Licence Number"
                                        error={!!errors.gst_no}
                                        helperText={errors.gst_no?.message}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Controller
                                name="designation_id"
                                control={control}
                                render={({ field }) => (
                                    <CustomTextField
                                        {...field}
                                        select
                                        fullWidth
                                        label="Designation"
                                        value={field.value ?? ''} // ✅ ensure controlled
                                        onChange={(e) => {
                                            field.onChange(e.target.value); // ✅ update RHF state
                                        }}
                                        error={!!errors.designation_id}
                                        helperText={errors.designation_id?.message}
                                    >
                                        {createData?.designations?.length > 0 ? (
                                            createData.designations.map((item) => (
                                                <MenuItem key={item._id} value={item._id}>
                                                    {item.name}
                                                </MenuItem>
                                            ))
                                        ) : (
                                            <MenuItem disabled>No Designations</MenuItem>
                                        )}
                                    </CustomTextField>
                                )}
                            />

                        </Grid>

                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Controller
                                name="department_id"
                                control={control}
                                render={({ field }) => (
                                    <CustomTextField
                                        {...field}
                                        select
                                        fullWidth
                                        label="Department"
                                        value={field.value ?? ''} // ✅ ensure controlled
                                        onChange={(e) => {
                                            field.onChange(e.target.value); // ✅ update RHF state
                                        }}
                                        error={!!errors.department_id}
                                        helperText={errors.department_id?.message}
                                    >
                                        {createData?.department?.length > 0 ? (
                                            createData.department.map((item) => (
                                                <MenuItem key={item._id} value={item._id}>
                                                    {item.name}
                                                </MenuItem>
                                            ))
                                        ) : (
                                            <MenuItem disabled>No Designations</MenuItem>
                                        )}
                                    </CustomTextField>
                                )}
                            />

                        </Grid>

                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Controller
                                name="participation_type_id"
                                control={control}
                                render={({ field }) => (
                                    <CustomTextField
                                        {...field}
                                        select
                                        fullWidth
                                        label="Participation Type *"
                                        value={field.value ?? ''} // ✅ ensure controlled
                                        onChange={(e) => {
                                            field.onChange(e.target.value); // ✅ update RHF state
                                        }}
                                        error={!!errors.participation_type_id}
                                        helperText={errors.participation_type_id?.message}
                                    >
                                        {createData?.participation_types?.length > 0 ? (
                                            createData.participation_types.map((item) => (
                                                <MenuItem key={item._id} value={item._id}>
                                                    {item.name}
                                                </MenuItem>
                                            ))
                                        ) : (
                                            <MenuItem disabled>No data</MenuItem>
                                        )}
                                    </CustomTextField>
                                )}
                            />

                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Controller
                                name="employee_type"
                                control={control}
                                render={({ field }) => (
                                    <CustomTextField
                                        {...field}
                                        select
                                        fullWidth
                                        label="Employee type"
                                        value={field.value ?? ''} // ✅ ensure controlled
                                        onChange={(e) => {
                                            field.onChange(e.target.value); // ✅ update RHF state
                                        }}
                                        error={!!errors.employee_type}
                                        helperText={errors.employee_type?.message}
                                    >

                                        <MenuItem value="Part time">Part time</MenuItem>
                                        <MenuItem value="Full time">Full time</MenuItem>
                                        <MenuItem value="Hybrid">Hybrid</MenuItem>

                                    </CustomTextField>
                                )}
                            />

                        </Grid>

                        {/* Zone */}
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Controller
                                name="zone_id"
                                control={control}
                                render={({ field }) => (
                                    <CustomTextField
                                        {...field}
                                        select
                                        fullWidth
                                        label="Zone"
                                        value={field.value ?? ""}
                                        onChange={(e) => {
                                            const rawValue = e.target.value;
                                            const value = rawValue === "undefined" || !rawValue ? "" : rawValue;

                                            setSelectZone(value);
                                            setSelectedRegion("");   // reset region
                                            setSelectedBranch([]);   // reset branch
                                            field.onChange(value);
                                        }}
                                        error={!!errors.zone_id}
                                        helperText={errors.zone_id?.message}
                                    >
                                        {createData?.zones?.length > 0 ? (
                                            createData.zones.map((item) => (
                                                <MenuItem key={item._id} value={item._id}>
                                                    {item.name}
                                                </MenuItem>
                                            ))
                                        ) : (
                                            <MenuItem disabled>No Zones</MenuItem>
                                        )}
                                    </CustomTextField>
                                )}
                            />
                        </Grid>

                        {/* Region */}
                        {selectRegion?.length > 0 && (
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <Controller
                                    name="region_id"
                                    control={control}
                                    render={({ field }) => (
                                        <CustomTextField
                                            {...field}
                                            select
                                            fullWidth
                                            label="Region"
                                            value={field.value ?? ""}
                                            onChange={(e) => {
                                                const rawValue = e.target.value;

                                                const value =
                                                    rawValue === "undefined" || !rawValue ? "" : rawValue;

                                                setSelectedRegion(value); // store selected region ID
                                                setSelectedBranch([]);    // reset branch
                                                field.onChange(value);
                                            }}
                                            error={!!errors.region_id}
                                            helperText={errors.region_id?.message}
                                        >
                                            {selectRegion.length > 0 ? (
                                                selectRegion.map((item) => (
                                                    <MenuItem key={item._id} value={item._id}>
                                                        {item.name}
                                                    </MenuItem>
                                                ))
                                            ) : (
                                                <MenuItem disabled>No Regions</MenuItem>
                                            )}
                                        </CustomTextField>
                                    )}
                                />
                            </Grid>
                        )}

                        {/* Branch */}
                        {selectedBranch?.length > 0 && (
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <Controller
                                    name="branch_id"
                                    control={control}
                                    render={({ field }) => (
                                        <CustomTextField
                                            {...field}
                                            select
                                            fullWidth
                                            label="Branch"
                                            value={field.value ?? ""}
                                            onChange={(e) => {
                                                const rawValue = e.target.value;
                                                const value = rawValue === "undefined" || !rawValue ? "" : rawValue;

                                                field.onChange(value);
                                            }}
                                            error={!!errors.branch_id}
                                            helperText={errors.branch_id?.message}
                                        >
                                            {selectedBranch.length > 0 ? (
                                                selectedBranch.map((item) => (
                                                    <MenuItem key={item.data._id} value={item.data._id}>
                                                        {item.data.name}
                                                    </MenuItem>
                                                ))
                                            ) : (
                                                <MenuItem disabled>No Branches</MenuItem>
                                            )}
                                        </CustomTextField>
                                    )}
                                />
                            </Grid>
                        )}

                        <Grid size={{ xs: 12, sm: 4 }}>


                            <Controller
                                name="reporting_manager_id"
                                control={control}
                                defaultValue={false}
                                render={({ field }) => (
                                    <CustomTextField
                                        {...field}
                                        select
                                        fullWidth
                                        label="Reporting Manager"
                                        value={field.value ?? ''} // ✅ ensure controlled
                                        onChange={(e) => {
                                            field.onChange(e.target.value); // ✅ update RHF state
                                        }}
                                        error={!!errors.department_id}
                                        helperText={errors.department_id?.message}
                                    >
                                        {userList?.length > 0 ? (
                                            userList.map((item) => (
                                                <MenuItem key={item._id} value={item._id}>
                                                    {item?.first_name} {" "} {item?.last_name}
                                                </MenuItem>
                                            ))
                                        ) : (
                                            <MenuItem disabled>No User Found</MenuItem>
                                        )}
                                    </CustomTextField>
                                )}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Controller
                                name="website"
                                control={control}
                                render={({ field }) => (
                                    <CustomTextField
                                        {...field}
                                        fullWidth
                                        type="text"
                                        label="Website"
                                        placeholder="Website"
                                        error={!!errors.website}
                                        helperText={errors.website?.message}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>


                            {/* Status */}
                            <Controller
                                name="status"
                                control={control}
                                render={({ field }) => (
                                    <CustomTextField
                                        {...field}
                                        select
                                        fullWidth
                                        label="Status*"
                                        error={!!errors.status}
                                        helperText={errors.status?.message}
                                    >
                                        <MenuItem value={true}>Active</MenuItem>
                                        <MenuItem value={false}>Inactive</MenuItem>
                                    </CustomTextField>
                                )}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <Typography variant='body2' className='font-medium'>
                                4. Roles
                            </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Controller
                                name="roles"
                                control={control}
                                defaultValue={[]} // ensure it's initialized as an array
                                render={({ field }) => (
                                    <CustomTextField
                                        {...field}
                                        select
                                        fullWidth
                                        label="Assign role*"
                                        value={field.value}  // array of role IDs
                                        error={!!errors.roles}
                                        helperText={errors.roles?.message}
                                        slotProps={{
                                            select: {
                                                multiple: true,
                                                onChange: (event) => {
                                                    const value = event.target.value;

                                                    setUserRoles(value);

                                                    field.onChange(value); // update react-hook-form state
                                                },
                                                renderValue: (selectedIds) => {
                                                    // Map IDs to role names for display
                                                    const selectedNames = createData.roles
                                                        .filter(role => selectedIds.includes(role._id))
                                                        .map(role => role.name);

                                                    return selectedNames.join(', ');
                                                }
                                            }
                                        }}
                                    >
                                        {createData?.roles?.length > 0 ? (
                                            createData.roles.map((role, index) => (
                                                <MenuItem key={index} value={role._id}>
                                                    <Checkbox checked={userRoles.includes(role._id)} />
                                                    <ListItemText primary={role.name} />
                                                </MenuItem>
                                            ))
                                        ) : (
                                            <MenuItem disabled>No roles</MenuItem>
                                        )}
                                    </CustomTextField>

                                )}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Controller
                                name="user_code"
                                control={control}
                                readonly
                                render={({ field }) => (
                                    <CustomTextField
                                        {...field}
                                        fullWidth
                                        type="text"
                                        label="Employee ID*"
                                        placeholder="Employee ID"
                                        error={!!errors.user_code}
                                        helperText={errors.user_code?.message}
                                        slotProps={{
                                            input: {
                                                readOnly: editData && editData.emp_id ? true : false,
                                            }
                                        }}
                                    />
                                )}
                            />
                        </Grid>
                    </Grid>
                </CardContent>
                <Divider />
                <CardActions>
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
                            'Submit'
                        )}
                    </Button>
                    <Button variant="tonal" color="error" type="reset" onClick={() => router.push(`/${locale}/apps/user/list`)}>
                        Cancel
                    </Button>
                </CardActions>
            </form>

        </Card >
    )
}

export default UserFormLayout
