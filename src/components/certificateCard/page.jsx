'use client'

import { useEffect, useState } from 'react'

import { useParams, useRouter } from 'next/navigation'

import { useSession } from 'next-auth/react'

import {
    Box,
    Button,
    Card,
    CardContent,
    Typography,
    Menu,
    DialogContent,
    DialogTitle,
    MenuItem,
    IconButton,
    Dialog
} from '@mui/material'

import Grid from '@mui/material/Grid2'

import CardSkeletonComponent from '../CardSkeletonComponent'
import DialogCloseButton from '../dialogs/DialogCloseButton'

const CertificateCard = ({ teams = [], onAddTeamSubmit }) => {

    const URL = process.env.NEXT_PUBLIC_API_URL;

    const assert_url = process.env.NEXT_PUBLIC_ASSETS_URL || ''

    const { data: session } = useSession() || {};

    const token = session && session.user && session?.user?.token;

    const [selectedCertificate, setSelectedCertificate] = useState(null)
    const [certificateData, setCertificateData] = useState();
    const [loading, setLoading] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null)
    const [isPreview, setIsPreview] = useState(false);

    const router = useRouter()

    const fetchCertificate = async () => {

        try {

            const response = await fetch(`${URL}/company/certificate/data`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            const data = await response.json();

            if (response.ok) {
                setLoading(true);

                setCertificateData(data?.data)
            }


        } catch (error) {
            console.error("Error occured", error);
        }
    }

    useEffect(() => {
        if (URL && token) {
            fetchCertificate();
        }
    }, [token, URL])

    useEffect(() => {
        router.prefetch('/apps/certificate/form')
    }, [router])

    const handleOpen = () => {
        router.push('/apps/certificate/form')
    }

    const handleMenuOpen = (event, team) => {
        setSelectedCertificate(team)
        setAnchorEl(event.currentTarget)
    }

    const handleMenuClose = () => {
        setAnchorEl(null)
    }

    const handleBackgroundImage = async (value) => {
        try {

            const response = await fetch(`${URL}/company/certificate/change/frame/${value._id}`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            if (response.ok) {
                fetchCertificate();
            }

        } catch (error) {
            console.error(error)
        }
    }

    if (!loading) {
        return (
            <CardSkeletonComponent />
        )
    }

    return (
        <>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography variant="h5" fontWeight={600}>
                    Certificates
                </Typography>
                <Button variant="contained" onClick={handleOpen}>
                    Add certificate
                </Button>
            </Box>

            {/* Cards */}
            <Grid container spacing={4}>
                {certificateData.map((item, index) => (
                    <Grid key={index} item size={{ xs: 12, sm: 6, md: 4 }}>
                        <Card
                            sx={{
                                borderRadius: 2,
                                
                                // inlineSize: "400px",
                                border: '1px solid #e0e0e0',
                                boxShadow: 'none',
                                overflow: 'hidden',
                                position: 'relative',
                                transition: 'transform 0.3s ease',
                                '&:hover': {
                                    transform: 'scale(1.01)',
                                    boxShadow: 3,
                                },
                                '&:hover .hoverOverlay': {
                                    opacity: 1,
                                    visibility: 'visible',
                                },
                            }}
                        >
                            {/* Certificate Preview Section */}
                            <Box
                                position="relative"
                                onClick={() => {
                                    setSelectedCertificate(item)
                                    setIsPreview(true);
                                }}
                                sx={{ cursor: 'pointer' }}
                            >
                                <Box
                                    sx={{
                                        backgroundImage: `url(${assert_url}/frames/${item.backgroundImage})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        
                                        // minHeight: 280,
                                        // p: 2,
                                        borderRadius: 2,
                                    }}
                                >
                                    <div style={{ padding: '38px 35px', aspectRatio: '1.41/1' }}>
                                        {item?.logoURL && (
                                            <Box textAlign="center">
                                                <img
                                                    src={`${assert_url}/company_logo/${item?.logoURL}`}
                                                    alt="Logo"
                                                    width={80}
                                                    height={40}
                                                    style={{ objectFit: 'contain' }}
                                                />
                                            </Box>
                                        )}

                                        <Box textAlign="center" mt={2}>
                                            <Typography variant="h6" fontWeight="bold">
                                                {item?.title}
                                            </Typography>
                                            <Typography>{item?.content}</Typography>
                                            <Typography variant="h6" fontWeight="bold">[UserName]</Typography>
                                            <Typography>{item?.content2}</Typography>
                                            <Typography variant="h6" fontWeight="bold">[QuizName]</Typography>
                                            <Typography variant="body2" color="text.secondary">On [date]</Typography>
                                        </Box>

                                        <Box mt={6} display="flex" justifyContent={(item?.signatureName && item?.signatureName2) ? "space-between" : "center"} gap={4}>
                                            {item?.signatureName && (
                                                <Box textAlign="center">
                                                    <img
                                                        src={`${assert_url}/signature/${item?.signatureURL || 'signature1.png'}`}
                                                        alt="Signature 1"
                                                        width={50}
                                                        height={20}
                                                    />
                                                    <Typography fontWeight="bold">{item?.signatureName}</Typography>
                                                    <Typography variant="body2">{item?.signatureContent}</Typography>
                                                </Box>
                                            )}
                                            {item?.signatureName2 && (
                                                <Box textAlign="center">
                                                    <img
                                                        src={`${assert_url}/signature/${item?.signatureURL2 || 'signature1.png'}`}
                                                        alt="Signature 2"
                                                        width={50}
                                                        height={20}
                                                    />
                                                    <Typography fontWeight="bold">{item?.signatureName2}</Typography>
                                                    <Typography variant="body2">{item?.signatureContent2}</Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    </div>
                                </Box>

                                {/* Hover Overlay */}
                                <Box
                                    className="hoverOverlay"
                                    sx={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        backgroundColor: 'rgba(0,0,0,0.6)',
                                        color: '#fff',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        opacity: 0,
                                        visibility: 'hidden',
                                        transition: 'opacity 0.3s ease',
                                    }}
                                >
                                    <i className="tabler-eye" style={{ fontSize: 28 }} />
                                    <Typography variant="body2" mt={1}>
                                        Preview certificate
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Bottom Section */}
                            <CardContent
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    pt: 2,
                                    pb: 2,
                                    pl: 2,
                                    pr: 2,
                                }}
                            >
                                <Typography variant="subtitle1" fontWeight={500}>
                                    {item.templateName}
                                </Typography>
                                <IconButton onClick={(e) => handleMenuOpen(e, item)}>
                                    <i className="tabler-dots-vertical" />
                                </IconButton>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid >

            <Dialog
                open={isPreview}
                fullWidth
                maxWidth="md"
                scroll="body"
                sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
            >
                <DialogCloseButton onClick={() => setIsPreview(false)}>
                    <i className="tabler-x" />
                </DialogCloseButton>

                <DialogTitle className='text-center sm:pbs-16 sm:pbe-6 sm:pli-16'>
                    {selectedCertificate?.templateName || "Certificate Preview"}
                </DialogTitle>

                <DialogContent className="overflow-visible flex flex-col gap-6 sm:pli-16">
                    <Card
                        variant="outlined"
                        sx={{
                            backgroundImage: selectedCertificate?.backgroundImage
                                ? `url(${assert_url}/frames/${selectedCertificate.backgroundImage})`
                                : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            borderRadius: 2,
                            mb: 10
                        }}
                    >
                        <CardContent>
                            <Box textAlign="center" p={2}>
                                {selectedCertificate?.logoURL && (
                                    <img
                                        src={`${assert_url}/company_logo/${selectedCertificate.logoURL}`}
                                        alt="Logo"
                                        width={80}
                                        height={40}
                                        style={{ objectFit: 'contain' }}
                                    />
                                )}

                                {selectedCertificate?.title && (
                                    <Typography variant="h6" fontWeight="bold" mt={2}>
                                        {selectedCertificate.title}
                                    </Typography>
                                )}

                                {selectedCertificate?.content && (
                                    <Typography>{selectedCertificate.content}</Typography>
                                )}

                                <Typography variant="h6" fontWeight="bold">[UserName]</Typography>

                                {selectedCertificate?.content2 && (
                                    <Typography>{selectedCertificate.content2}</Typography>
                                )}

                                <Typography variant="h6" fontWeight="bold">[QuizName]</Typography>
                                <Typography variant="body2" color="text.secondary">On [date]</Typography>

                                <Box
                                    mt={6}
                                    display="flex"
                                    justifyContent={
                                        selectedCertificate?.signatureName && selectedCertificate?.signatureName2
                                            ? "space-between"
                                            : "center"
                                    }
                                    gap={4}
                                >
                                    {selectedCertificate?.signatureName && (
                                        <Box textAlign="center">
                                            <img
                                                src={`${assert_url}/signature/${selectedCertificate.signatureURL || 'signature1.png'}`}
                                                alt="Signature 1"
                                                width={80}
                                                height={40}
                                                style={{ objectFit: 'contain' }}
                                            />
                                            <Typography fontWeight="bold">{selectedCertificate.signatureName}</Typography>
                                            <Typography variant="body2">{selectedCertificate.signatureContent}</Typography>
                                        </Box>
                                    )}
                                    {selectedCertificate?.signatureName2 && (
                                        <Box textAlign="center">
                                            <img
                                                src={`${assert_url}/signature/${selectedCertificate.signatureURL2 || 'signature1.png'}`}
                                                alt="Signature 2"
                                                width={80}
                                                height={40}
                                                style={{ objectFit: 'contain' }}
                                            />
                                            <Typography fontWeight="bold">{selectedCertificate.signatureName2}</Typography>
                                            <Typography variant="body2">{selectedCertificate.signatureContent2}</Typography>
                                        </Box>
                                    )}
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </DialogContent>
            </Dialog>


            {/* Action Menu */}
            < Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }
                }
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <MenuItem
                    onClick={() => {
                        router.replace(`/apps/certificate/form/${selectedCertificate?._id}`)
                        handleMenuClose()
                    }}
                >
                    <i className="tabler-edit" style={{ marginRight: 8 }} />
                    Edit
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        handleBackgroundImage(selectedCertificate)
                        handleMenuClose()
                    }}
                >
                    <i className="tabler-refresh" style={{ marginRight: 8 }} />
                    Reset to default template
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        handleMenuClose()
                    }}
                >
                    <i className="tabler-copy" style={{ marginRight: 8 }} />
                    Clone
                </MenuItem>
            </Menu >
        </>
    )
}

export default CertificateCard
