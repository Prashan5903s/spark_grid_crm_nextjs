'use client';

import { useEffect, useState } from 'react';

import { useParams, useRouter } from 'next/navigation';

import { useSession } from 'next-auth/react';

import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Skeleton,
    Menu,
    IconButton,
    Breadcrumbs,
    Link,
    FormControl,
    Select,
    MenuItem,
    Pagination
} from '@mui/material';

import Grid from '@mui/material/Grid2';

const BreadcumbComponent = ({ data, locale, stage }) => {
    return (
        <Breadcrumbs aria-label="breadcrumb" separator="›">
            <Link key={1} href={`/${locale}/apps/program`} >
                <Typography component="span" color="primary" fontSize="small">
                    Home
                </Typography>
            </Link>
            {stage == "Content Folder" && data && [
                data?.program?.title && (
                    <Typography key="2" color="text.primary" fontSize="small">
                        {data.program.title}
                    </Typography>
                )
            ]}
            {stage === "Module" && data && [
                data.program?.title && (
                    <Link key="3" href={`/${locale}/apps/content-folder/${data.program._id}`} >
                        <Typography component="span" color="primary" fontSize="small">
                            {data.program.title}
                        </Typography>
                    </Link>
                ),
                data.content_folder?.title && (
                    <Typography key="4" color="text.primary" fontSize="small">
                        {data.content_folder.title}
                    </Typography>
                )
            ]}

            {stage !== "Program" && [(
                <Typography key={"5"} color="text.primary" fontWeight="bold" fontSize="small">
                    {stage}
                </Typography>
            )]}

        </Breadcrumbs>
    );
};

const ProgramCardComponent = ({
    locale,
    stage,
    parent,
    totalItems,
    data,
    itemsPerPage,
    activePage,
    formLink,
    loading,
    nextLink,
    getModuleList,
    parentCategory,
    currentId,
}) => {

    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const { data: session } = useSession();
    const token = session?.user?.token;
    const placeholderBase64 = 'data:image/png;base64,...'; // Replace with actual placeholder
    const ASSET_URL = process.env.NEXT_PUBLIC_ASSETS_URL;

    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedCard, setSelectedCard] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [categories, setCategories] = useState();
    const [breadCumbData, setBreadCumbData] = useState();

    // const { lang: locale } = useParams();

    const router = useRouter();

    const handleMenuOpen = (event, item) => {
        setSelectedCard(item);
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const fetchCategory = async () => {
        try {
            const response = await fetch(`${API_URL}/company/program/category/data/${stage}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            const result = await response.json()

            if (response.ok) {

                const value = result?.data;

                setCategories(value);

            }

        } catch (error) {
            throw new Error(error)
        }
    }

    const fetchBreadCumbCategory = async () => {
        try {
            const response = await fetch(`${API_URL}/company/program/category/breadcumb/${parent}/${currentId}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            const result = await response.json()

            if (response.ok) {

                const value = result?.data;

                setBreadCumbData(value);

            }

        } catch (error) {
            throw new Error(error)
        }
    }

    useEffect(() => {
        if (API_URL && token && stage) {
            fetchCategory()
        }

        if (API_URL && token && parent && currentId) {
            fetchBreadCumbCategory();
        }
    }, [API_URL, token, stage, parent, currentId])

    useEffect(() => {

        if (stage && selectedCategory) {
            router.push(`${parentCategory}/${selectedCategory}`)
        }

    }, [selectedCategory, stage])

    const linkData = (itemId, moduleTypeId) => {

        if (stage != "Module") return `${nextLink}/${itemId}`

        const data = {
            "688219557b6953e899cb57d2": `${nextLink}/${itemId}`,
            "688219557b6953e899cb57d3": `/${locale}/apps/live-session/${itemId}`,
            "688219557b6953e899cb57d4": `/${locale}/apps/ilt-page/${itemId}`
        }

        return data?.[moduleTypeId] || `${nextLink}/${itemId}`

    }

    if (loading) {
        return (
            <Card>
                <CardContent className="flex flex-col gap-6">
                    <Skeleton width={150} height={30} />
                    <Skeleton width={300} height={20} />
                    <Grid container spacing={4}>
                        {Array.from({ length: 6 }).map((_, index) => (
                            <Grid key={index} size={{ xs: 12, md: 4, lg: 4 }}>
                                <Card sx={{ blockSize: '100%' }}>
                                    <Skeleton variant="rectangular" height={200} />
                                    <CardContent>
                                        <Skeleton width="80%" />
                                        <Skeleton width="60%" />
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent className="flex flex-col gap-6">
                {/* Header */}
                <Box className="flex flex-wrap items-center justify-between gap-4">
                    <Box>
                        <Typography variant="h5">My {stage}</Typography>
                        <BreadcumbComponent data={breadCumbData} locale={locale} stage={stage} />

                    </Box>

                    <Box className="flex items-center gap-4 flex-wrap justify-end">
                        {stage !== "Program" && (
                            <FormControl size="small" className="w-[250px] max-sm:w-full">
                                <Select
                                    fullWidth
                                    id="select-course"
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                >
                                    <MenuItem disabled selected>Select {parent}</MenuItem>
                                    {categories?.length > 0 ? (
                                        categories.map((item) => (
                                            <MenuItem key={item._id} value={item._id}>
                                                {item.title}
                                            </MenuItem>
                                        ))
                                    ) : (
                                        <MenuItem disabled>No {parent}</MenuItem>
                                    )}
                                </Select>
                            </FormControl>
                        )}

                        <Button
                            variant="contained"
                            startIcon={<i className="tabler-plus" />}
                            href={formLink}
                            className="max-sm:w-full"
                        >
                            Add New {stage}
                        </Button>
                    </Box>
                </Box>

                {/* Grid of Cards */}
                <Grid container spacing={10} alignItems="stretch">
                    {data?.length > 0 ? (
                        data.map((item) => (
                            <Grid item size={{ xs: 12, md: 3, lg: 3 }} key={item?._id} onClick={() => router.push(linkData(item._id, item?.module_type_id))} >
                                <Card
                                    sx={{
                                        border: '1px solid #e0e0e0',
                                        borderRadius: 3,
                                        overflow: 'hidden',
                                        position: 'relative',
                                        transition: 'transform 0.3s, box-shadow 0.3s',
                                        blockSize: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        '&:hover': {
                                            transform: 'scale(1.03)',
                                            boxShadow: 6,
                                        },
                                    }}
                                >
                                    <img
                                        src={item.image_url ? `${ASSET_URL}/program_module/${item.image_url}` : placeholderBase64}
                                        alt={item?.title || 'Module image'}
                                        style={{
                                            inlineSize: '100%',
                                            blockSize: '200px',
                                            objectFit: 'cover',
                                        }}
                                    />
                                    <CardContent sx={{ flexGrow: 1 }}>
                                        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                            <Box>
                                                <Typography variant="h6" fontWeight={600}>
                                                    {item?.title || ""}
                                                </Typography>

                                                {stage === "Program" && (
                                                    <Typography variant="body2" color="text.secondary" display="flex" alignItems="center" gap={1}>
                                                        <i className="tabler-device-laptop"></i>
                                                        {`${item.content_folders.length} content folder${item.content_folders.length > 1 ? 's' : ''}`}
                                                    </Typography>
                                                )}
                                            </Box>

                                            <IconButton
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleMenuOpen(e, item);
                                                }}
                                                size="small"
                                            >
                                                <i className="tabler-dots-vertical" />
                                            </IconButton>

                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))
                    ) : (
                        <Grid item size={{ xs: 12 }}>
                            <Typography align="center" color="text.secondary">
                                No {stage} Found
                            </Typography>
                        </Grid>
                    )}
                </Grid>

                {/* Context Menu */}
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                    <MenuItem
                        onClick={() => {
                            router.replace(`${formLink}/${selectedCard?._id}`);
                            handleMenuClose();
                        }}
                    >
                        <i className="tabler-edit" style={{ marginRight: 8 }} />
                        Edit
                    </MenuItem>
                    <MenuItem
                        onClick={() => {

                            handleMenuClose();
                        }}
                    >
                        <i className="tabler-refresh" style={{ marginRight: 8 }} />
                        Reset to default template
                    </MenuItem>
                    <MenuItem
                        onClick={() => {
                          
                            handleMenuClose();
                        }}
                    >
                        <i className="tabler-copy" style={{ marginRight: 8 }} />
                        Clone
                    </MenuItem>
                </Menu>

                {/* Pagination */}
                <Box className="flex justify-center">
                    <Pagination
                        count={Math.ceil(totalItems / itemsPerPage)}
                        page={activePage + 1}
                        showFirstButton
                        showLastButton
                        shape="rounded"
                        variant="tonal"
                        color="primary"
                        onChange={(e, page) => getModuleList(page - 1)}
                    />
                </Box>
            </CardContent>
        </Card >
    );
};

export default ProgramCardComponent;
