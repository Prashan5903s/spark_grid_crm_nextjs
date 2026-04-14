'use client'

import { useState } from 'react'

import { useSession } from 'next-auth/react'

import {
    Card,
    CardContent,
    Typography,
    IconButton,
    Box,
    Pagination,
    Skeleton,
    Menu,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button
} from '@mui/material'

import Grid from '@mui/material/Grid2'

import { toast } from 'react-toastify'


const ASSET_URL = process.env.NEXT_PUBLIC_ASSETS_URL
const API_URL = process.env.NEXT_PUBLIC_API_URL

const SelfEnrollmentCard = ({
    modules = [],
    loading = false,
    page = 1,
    totalPages = 1,
    onPageChange,
    fetchModuleData
}) => {

    const { data: session } = useSession()
    const token = session?.user?.token

    const [anchorEl, setAnchorEl] = useState(null)
    const [selectedModule, setSelectedModule] = useState(null)
    const [openEnrollModal, setOpenEnrollModal] = useState(false)
    const [loadingEnroll, setLoadingEnroll] = useState(false) // optional loading state

    const handleMenuOpen = (event, module) => {

        setAnchorEl(event.currentTarget)
        setSelectedModule(module._id)
    }

    const handleMenuClose = () => {
    }

    const handleSelfEnroll = async () => {

        if (!selectedModule) return
        setLoadingEnroll(true)

        try {
            const response = await fetch(
                `${API_URL}/user/self/enroll/data/${selectedModule}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            )

            if (response.ok) {

                toast.success("Self enrollment successfully", {
                    autoClose: 1000
                })

                setAnchorEl(null)
                fetchModuleData()
                setOpenEnrollModal(false)
                setSelectedModule(null)
            } else {
                console.error("Enrollment failed")
            }
        } catch (error) {
            console.error("Error enrolling:", error)
        } finally {
            setLoadingEnroll(false)
        }
    }

    return (
        <>
            {/* Header */}
            <Box mb={4}>
                <Typography variant="h5" fontWeight={600}>
                    Modules
                </Typography>
            </Box>

            {/* Cards */}
            <Grid container spacing={4}>
                {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                        <Grid size={{ xs: 12, md: 4, lg: 3 }} key={i}>
                            <Skeleton variant="rectangular" height={260} />
                        </Grid>
                    ))
                ) : modules.length === 0 ? (
                    <Grid size={{ xs: 12 }}>
                        <Typography
                            variant="h6"
                            color="text.secondary"
                            align="center"
                            sx={{ py: 6 }}
                        >
                            Module does not exist
                        </Typography>
                    </Grid>
                ) : (
                    modules.map((module) => (
                        <Grid size={{ xs: 12, md: 4, lg: 3 }} key={module._id}>
                            <Card
                                sx={{
                                    border: '1px solid #e0e0e0',
                                    borderRadius: 3,
                                    overflow: 'hidden',
                                    transition: '0.3s',
                                    '&:hover': {
                                        transform: 'scale(1.03)',
                                        boxShadow: 6,
                                    },
                                }}
                            >
                                <img
                                    src={`${ASSET_URL}/program_module/${module.image_url}`}
                                    alt={module.title}
                                    width={500}
                                    height={200}
                                    style={{
                                        width: '100%',
                                        height: 200,
                                        objectFit: 'cover',
                                    }}
                                />

                                <CardContent
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 4,
                                            flex: 1,
                                        }}
                                    >
                                        <Typography variant="h6" fontWeight={600}>
                                            {module.title}
                                        </Typography>

                                        <Typography variant="body2" color="text.secondary">
                                            {module.description}
                                        </Typography>
                                    </div>

                                    <IconButton
                                        onClick={(e) => handleMenuOpen(e, module)}
                                        size="small"
                                    >
                                        <i className="tabler-dots-vertical" />
                                    </IconButton>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))
                )}
            </Grid>

            {/* Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <MenuItem
                    onClick={() => {
                        setOpenEnrollModal(true)
                        handleMenuClose()
                    }}
                >
                    Self Enroll
                </MenuItem>
            </Menu>

            {/* Enrollment Modal */}
            <Dialog
                open={openEnrollModal}
                onClose={() => setOpenEnrollModal(false)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>Confirm Enrollment</DialogTitle>

                <DialogContent>
                    <Typography>
                        Do you want to save enrollment for <strong>{selectedModule?.title}</strong>?
                    </Typography>
                </DialogContent>

                <DialogActions>
                    <Button
                        onClick={() => setOpenEnrollModal(false)}
                        color="inherit"
                        disabled={loadingEnroll}
                    >
                        Cancel
                    </Button>

                    <Button
                        onClick={handleSelfEnroll}
                        variant="contained"
                        color="primary"
                        disabled={loadingEnroll}
                    >
                        {loadingEnroll ? "Saving..." : "Save"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Pagination */}
            {totalPages > 1 && (
                <Box display="flex" justifyContent="center" mt={6}>
                    <Pagination
                        page={page}
                        count={totalPages}
                        onChange={(_, value) => onPageChange(value)}
                        color="primary"
                        shape="rounded"
                    />
                </Box>
            )}
        </>
    )
}

export default SelfEnrollmentCard
