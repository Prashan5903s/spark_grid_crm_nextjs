'use client'

import { useEffect, useState } from 'react'

import Image from 'next/image'

import { useParams, useRouter } from 'next/navigation'

import { useSession } from 'next-auth/react'

import {
    Box, Button, Card, CardHeader, Divider, CardContent,
    TextField, Typography, CardMedia, Skeleton
} from '@mui/material'

import Grid from '@mui/material/Grid2'

import { useForm, Controller } from 'react-hook-form'

import { valibotResolver } from '@hookform/resolvers/valibot'

import {
    object,
    string,
    minLength,
    transform,
    maxLength,
    pipe,
    regex,
    optional
} from 'valibot'

import { toast } from 'react-toastify'

const alphaSpaceRegex = /^[A-Za-z ]+$/

const optionalAlphaField = optional(
    pipe(
        transform((val) => val === '' ? undefined : val),
        maxLength(20, 'Maximum 20 characters'),
        regex(alphaSpaceRegex, 'Only alphabets and spaces are allowed')
    )
)

const schema = object({
    templateName: pipe(
        string(),
        minLength(1, 'Template Name is required'),
        maxLength(255, 'Template Name can be maximum of 255 characters'),
        regex(/^[A-Za-z0-9 ]+$/, 'Only alphabets and spaces are allowed')
    ),
    title: pipe(
        string(),
        minLength(1, "Title is required"),
        maxLength(50, 'Title can be maximum of 50 characters'),
        regex(alphaSpaceRegex, 'Only alphabets and spaces are allowed')
    ),
    content: pipe(
        string(),
        minLength(1, "Content is required"),
        maxLength(100, 'Content can be maximum of 100 characters'),
        regex(alphaSpaceRegex, 'Only alphabets and spaces are allowed')
    ),
    content2: pipe(
        string(),
        minLength(1, "Content 2 is required"),
        maxLength(100, 'Content 2 can be maximum of 100 characters'),
        regex(alphaSpaceRegex, 'Only alphabets and spaces are allowed')
    ),
    signatureName: optionalAlphaField,
    signatureContent: optionalAlphaField,
    signature2Name: optionalAlphaField,
    signature2Content: optionalAlphaField,
    logoURL: optional(string()),
    backgroundImage: optional(string()),
    signature1URL: optional(string()),
    signature2URL: optional(string())
})

const CertificateForm = () => {

    const { data: session } = useSession()
    const token = session?.user?.token
    const API_URL = process.env.NEXT_PUBLIC_API_URL
    const assert_url = process.env.NEXT_PUBLIC_ASSETS_URL || ''

    const [customBg, setCustomBg] = useState(null)
    const [defaultBackground, setDefaultBackground] = useState([])
    const [logoPreview, setLogoPreview] = useState('')
    const [signature1Preview, setSignature1Preview] = useState('')
    const [signature2Preview, setSignature2Preview] = useState('')
    const [selectedBg, setSelectedBg] = useState('')
    const [titleText, setTitleText] = useState('');
    const [contentText, setContentText] = useState('');
    const [content2Text, setContent2Text] = useState('');
    const [signatureName, setSignatureName] = useState('')
    const [signatureContent, setSignatureContent] = useState('')
    const [signatureName2, setSignatureName2] = useState('')
    const [signatureContent2, setSignatureContent2] = useState('')
    const [editData, setEditData] = useState();
    const [createData, setCreateData] = useState();

    const router = useRouter();

    const { id: id } = useParams()

    const [uploadedFiles, setUploadedFiles] = useState({
        logoURL: null,
        backgroundImage: null,
        signature1URL: null,
        signature2URL: null,
        signatureName: null,
        signatureContent: null,
        signature2Name: null,
        signature2Content: null,
    })

    const [loading, setLoading] = useState(false)

    const {
        control, handleSubmit, setValue, getValues, formState: { errors }
    } = useForm({
        resolver: valibotResolver(schema),
        mode: 'onChange',
        defaultValues: {
            templateName: '',
            title: '',
            content: '',
            content2: '',
            signatureName: '',
            signatureContent: '',
            signature2Name: '',
            signature2Content: '',
            logoURL: '',
            backgroundImage: '',
            signature1URL: '',
            signature2URL: ''
        }
    })

    const fetchCreateData = async () => {
        try {

            setLoading(false)

            const res = await fetch(`${API_URL}/company/certificate/create`, {
                headers: { Authorization: `Bearer ${token}` }
            })

            const data = await res.json()

            if (res.ok) {

                const val = data.data

                setCreateData(val);

            }
        } catch (err) {
            console.error('Fetch failed:', err)
        }
    }

    const fetchEditData = async () => {
        try {

            setLoading(false);

            const response = await fetch(`${API_URL}/company/certificate/edit/${id}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            )

            const data = await response.json();

            if (response.ok) {

                setLoading(true)

                const result = data?.data;

                if (result) {

                    setEditData(result);

                }


            }

        } catch (error) {
            next(error)
        }
    }

    useEffect(() => {
        if (createData && !id) {
            const logo = `${assert_url}/company_logo/${createData.logoURL}`
            const sig = `${assert_url}/signature/${createData.signatureURL}`
            const bg = `${assert_url}/frames/${createData.frameImage?.[0]}`

            setLogoPreview(logo)
            setSignature1Preview(sig)
            setSignature2Preview(sig)

            setValue('logoURL', logo)
            setValue('signature1URL', sig)
            setValue('signature2URL', sig)
            setValue('backgroundImage', bg)
            setValue('title', createData.title)
            setValue('content', createData.content)
            setValue('content2', createData.content2)

            setTitleText(createData.title);
            setContentText(createData.content)
            setContent2Text(createData.content2)

            setSelectedBg(bg)

            setDefaultBackground(createData.frameImage.map((f) => `${assert_url}/frames/${f}`))

            setLoading(true)
        }

        if (id && createData && editData) {

            const sig = `${assert_url}/signature/${createData.signatureURL}`

            setSignature1Preview(sig)
            setSignature2Preview(sig)

            setDefaultBackground(createData.frameImage.map((f) => `${assert_url}/frames/${f}`))

            if (editData.backgroundImage) {
                if (editData.backgroundImage != 'bg1.jpg' && editData.backgroundImage != 'bg2.jpg' && editData.backgroundImage != 'bg3.jpg' && editData.backgroundImage != 'bg4.jpg') {
                    setCustomBg(assert_url + '/frames/' + editData.backgroundImage)
                }
                
                setSelectedBg(assert_url + '/frames/' + editData.backgroundImage)


            }

            Object.entries(editData).forEach(([key, value]) => {
                if (key == 'signatureName2') {
                    setValue('signature2Name', value ?? '')
                } else if (key == 'signatureContent2') {
                    setValue('signatureContent2', value ?? '')
                } else if (key == 'signatureURL') {
                    setValue('signature1URL', (assert_url + '/signature/' + editData.signatureURL) ?? '')
                } else if (key == 'signatureURL2') {
                    setValue('signature2URL', (assert_url + '/signature/' + editData.signatureURL2) ?? '')
                } else {
                    setValue(key, value ?? '')
                }
            })

            setTitleText(editData.title || '')
            setContentText(editData.content || '')
            setContent2Text(editData.content2 || '')
            setSignatureName(editData.signatureName || '')
            setSignatureContent(editData.signatureContent || '')
            setSignatureName2(editData.signatureName2 || '')
            setSignatureContent2(editData.signatureContent2 || '')

            if (editData.logoURL) setLogoPreview(assert_url + '/company_logo/' + editData.logoURL)
            if (editData.signatureURL) setSignature1Preview(assert_url + '/signature/' + editData.signatureURL)
            if (editData.signatureURL2) setSignature2Preview(assert_url + '/signature/' + editData.signatureURL2)

            setLoading(true)
        }
    }, [createData, editData, id])

    useEffect(() => {
        if (token && API_URL) {
            fetchCreateData()
            
            if (id) {
                fetchEditData();
            }
        }
    }, [API_URL, token, id])

    const handleImageUpload = (file, previewSetter, fieldKey) => {
        if (!file) return
        const objectUrl = URL.createObjectURL(file)

        previewSetter(objectUrl)
        setUploadedFiles((prev) => ({ ...prev, [fieldKey]: file }))
        setValue(fieldKey, objectUrl)

        if (fieldKey === 'backgroundImage') {
            setSelectedBg(objectUrl)
        }
    }

    const handleFormSubmit = async (values) => {

        const formData = new FormData()

        Object.entries(values).forEach(([k, v]) => {
            if (
                !['logoURL', 'backgroundImage', 'signature2Name', 'signature2Content', 'signatureName', 'signatureContent', 'signature1URL', 'signature2URL'].includes(k) &&
                v !== undefined &&
                v !== null
            ) {

                formData.append(k, v)
            }
        })

        Object.entries(uploadedFiles).forEach(([key, file]) => {
            if (file instanceof File) {
                formData.append(key, file)
            } else if (values[key]) {
                formData.append(key, values[key])
            }
        })

        try {
            const res = await fetch(
                id
                    ? `${API_URL}/company/certificate/update/${id}`
                    : `${API_URL}/company/certificate`,
                {
                    method: 'POST', // Always use POST when sending FormData
                    headers: {
                        Authorization: `Bearer ${token}`,
                        
                        // Do NOT set 'Content-Type' manually when using FormData
                    },
                    body: formData
                }
            );

            if (res.ok) {
                toast.success(`Certificate ${id ? 'updated' : 'added'} successfully!`, {
                    autoClose: 8000,
                });
                router.replace('/apps/certificate');
            } else {
                const errorData = await res.json();
                
                console.error('Server responded with error:', errorData);
            }
        } catch (err) {
            console.error('Submission Error:', err);
        }
    };

    const CertificateTemplateSkeleton = () => (
        <Card>
            <CardHeader title={<Skeleton width="40%" />} />
            <Divider />
            <CardContent>
                <Grid container spacing={4}>
                    <Grid item size={{ xs: 12, md: 5 }}>
                        <Card variant="outlined" sx={{ borderRadius: 2 }}>
                            <CardContent>
                                <Box p={2} textAlign="center">
                                    <Skeleton variant="rectangular" width={80} height={40} sx={{ margin: '0 auto' }} />
                                    <Skeleton variant="text" width="60%" sx={{ mt: 2, mx: 'auto' }} />
                                    <Skeleton variant="text" width="80%" sx={{ mx: 'auto' }} />
                                    <Skeleton variant="text" width="40%" sx={{ mt: 1, mx: 'auto' }} />
                                    <Skeleton variant="text" width="70%" sx={{ mx: 'auto' }} />
                                    <Skeleton variant="text" width="50%" sx={{ mt: 2, mx: 'auto' }} />
                                    <Box mt={6} display="flex" justifyContent="space-between" gap={4}>
                                        {[1, 2].map((i) => (
                                            <Box key={i} textAlign="center">
                                                <Skeleton variant="rectangular" width={50} height={20} sx={{ mx: 'auto' }} />
                                                <Skeleton variant="text" width={80} />
                                                <Skeleton variant="text" width={100} />
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item size={{ xs: 12, md: 7 }}>
                        <Skeleton variant="rectangular" width="100%" height={600} />
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    )

    if (!loading) return <CertificateTemplateSkeleton />

    return (
        <Card>
            <CardHeader title='Create Certificate Template' />
            <Divider />
            <CardContent>
                <Grid container spacing={4}>
                    {/* Preview Panel */}
                    <Grid size={{ xs: 12, md: 5 }}>
                        <Card
                            variant="outlined"
                            sx={{
                                backgroundImage: `url(${selectedBg})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                borderRadius: 2
                            }}
                        >
                            <CardContent>
                                <Box textAlign="center" p={2}>
                                    {logoPreview && (
                                        <Image src={logoPreview} alt="Logo" width={80} height={40} style={{ objectFit: 'contain' }} />
                                    )}
                                    <Typography variant="h6" fontWeight="bold" mt={2}>{titleText}</Typography>
                                    <Typography>{contentText}</Typography>
                                    <Typography variant="h6" fontWeight="bold">[UserName]</Typography>
                                    <Typography>{content2Text}</Typography>
                                    <Typography variant="h6" fontWeight="bold">[QuizName]</Typography>
                                    <Typography variant="body2" color="text.secondary">On [date]</Typography>

                                    <Box mt={6} display="flex" justifyContent={(signatureName && signatureName2) ? "space-between" : "center"} gap={4}>
                                        {signatureName && (
                                            <Box textAlign="center">
                                                <img src={signature1Preview} alt="Signature 1" width={50} height={20} />
                                                <Typography fontWeight="bold">{signatureName}</Typography>
                                                <Typography variant="body2">{signatureContent}</Typography>
                                            </Box>
                                        )}
                                        {signatureName2 && (
                                            <Box textAlign="center">
                                                <img src={signature2Preview} alt="Signature 2" width={50} height={20} />
                                                <Typography fontWeight="bold">{signatureName2}</Typography>
                                                <Typography variant="body2">{signatureContent2}</Typography>
                                            </Box>
                                        )}
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Form Panel */}
                    <Grid size={{ xs: 12, md: 7 }}>
                        <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12 }}>
                                    <Controller
                                        name="templateName"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField {...field} label="Template Name" fullWidth required error={!!errors.templateName} helperText={errors.templateName?.message} />
                                        )}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12 }}>
                                    <Typography variant="body2">Upload Logo</Typography>
                                    {logoPreview && (
                                        <Card sx={{ maxWidth: 150, mb: 1 }}>
                                            <CardMedia component="img" image={logoPreview} alt="Logo" />
                                        </Card>
                                    )}
                                    <Button variant="outlined" component="label">
                                        Upload Logo
                                        <input hidden type="file" accept="image/*" onChange={(e) => handleImageUpload(e.target.files[0], setLogoPreview, 'logoURL')} />
                                    </Button>
                                </Grid>

                                <Grid size={{ xs: 12 }}>
                                    <Typography>Select Background</Typography>
                                    <Grid container spacing={2}>
                                        {defaultBackground.map((bg, idx) => (
                                            <Grid size={{ xs: 4 }} key={idx}>
                                                <Card
                                                    onClick={() => {
                                                        setSelectedBg(bg)
                                                        setValue('backgroundImage', bg)
                                                    }}
                                                    sx={{
                                                        border: selectedBg === bg ? '2px solid #1976d2' : '1px dashed grey',
                                                        borderRadius: 2,
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <CardMedia component="img" image={bg} height="100" />
                                                </Card>
                                            </Grid>
                                        ))}
                                        {customBg && (
                                            <Grid size={{ xs: 4 }}>
                                                <Card onClick={() => {
                                                    setSelectedBg(customBg)
                                                    setValue('backgroundImage', customBg)
                                                }}>
                                                    <CardMedia component="img" image={customBg} height="100" />
                                                </Card>
                                            </Grid>
                                        )}
                                    </Grid>
                                    <Box mt={2}>
                                        <Button variant="outlined" component="label">
                                            Upload Custom Background
                                            <input hidden type="file" accept="image/*" onChange={(e) => handleImageUpload(e.target.files[0], setCustomBg, 'backgroundImage')} />
                                        </Button>
                                    </Box>
                                </Grid>

                                {['title', 'content', 'content2'].map((key) => (
                                    <Grid size={{ xs: 12 }} key={key}>
                                        <Controller
                                            name={key}
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    label={key.toUpperCase()}
                                                    fullWidth
                                                    required
                                                    onChange={(e) => {
                                                        field.onChange(e)
                                                        e.preventDefault();
                                                        
                                                        if (key == 'title') {
                                                            setValue('title', e.target.value)
                                                            setTitleText(e.target.value)
                                                        } else if (key == 'content') {
                                                            setValue('content', e.target.value)
                                                            setContentText(e.target.value);
                                                        } else if (key == 'content2') {
                                                            setValue('content2', e.target.value)
                                                            setContent2Text(e.target.value);
                                                        }

                                                    }}
                                                    error={!!errors[key]}
                                                    helperText={errors[key]?.message}
                                                />
                                            )}
                                        />
                                    </Grid>
                                ))}

                                {[
                                    ['signatureName', 'Signature 1 Name'],
                                    ['signatureContent', 'Signature 1 Content'],
                                    ['signature2Name', 'Signature 2 Name'],
                                    ['signature2Content', 'Signature 2 Content']
                                ].map(([key, label]) => (
                                    <Grid size={{ xs: 12, sm: 6 }} key={key}>
                                        <Controller
                                            name={key}
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    label={label}
                                                    fullWidth
                                                    onChange={(e) => {
                                                        e.preventDefault();
                                                        field.onChange(e);
                                                        
                                                        if (key == 'signatureName') {
                                                            setValue('signatureName', e.target.value)
                                                            setSignatureName(e.target.value)
                                                        } else if (key == 'signatureContent') {
                                                            setValue('signatureContent', e.target.value)
                                                            setSignatureContent(e.target.value)
                                                        } else if (key == 'signature2Name') {
                                                            setValue('signature2Name', e.target.value)
                                                            setSignatureName2(e.target.value)
                                                        } else if (key == 'signature2Content') {
                                                            setValue('signature2Content', e.target.value)
                                                            setSignatureContent2(e.target.value)
                                                        }
                                                    }}
                                                    error={!!errors[key]}
                                                    helperText={errors[key]?.message} />
                                            )}
                                        />
                                    </Grid>
                                ))}

                                {[['signature1URL', signature1Preview, setSignature1Preview], ['signature2URL', signature2Preview, setSignature2Preview]]
                                    .map(([key, preview, setter], i) => (
                                        <Grid size={{ xs: 12, sm: 6 }} key={key}>
                                            <Typography>Upload Signature {i + 1}</Typography>
                                            {preview && (
                                                <Card sx={{ maxWidth: 150, mb: 1 }}>
                                                    <CardMedia component="img" image={preview} height="60" />
                                                </Card>
                                            )}
                                            <Button variant="outlined" component="label">
                                                Upload Signature
                                                <input hidden type="file" accept="image/*" onChange={(e) => handleImageUpload(e.target.files[0], setter, key)} />
                                            </Button>
                                        </Grid>
                                    ))}

                                <Grid size={{ xs: 12 }}>
                                    <Button type="submit" fullWidth variant="contained">Save</Button>
                                </Grid>
                            </Grid>
                        </form>
                    </Grid>
                </Grid>
            </CardContent>
        </Card >
    )
}

export default CertificateForm
