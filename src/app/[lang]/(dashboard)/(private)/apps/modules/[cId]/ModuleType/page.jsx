"use client"

import { useState, useEffect } from 'react'

import { useRouter, useParams } from 'next/navigation'

import { useSession } from 'next-auth/react'

import {
    Skeleton
} from '@mui/material'

import Grid from '@mui/material/Grid2'

import {
    Card,
    CardContent,
    Button,
    Typography
} from '@mui/material'

import DirectionalIcon from '@components/DirectionalIcon'

const ModuleTypeCardComponent = () => {

    const [loading, setLoading] = useState(true);
    const [cardData, setCardData] = useState();

    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const ASSET_URL = process.env.NEXT_PUBLIC_ASSETS_URL;

    const { data: session } = useSession();
    const token = session?.user?.token;
    const { lang: locale, cId: cId } = useParams();

    const router = useRouter();

    const fetchCreateData = async () => {
        try {
            setLoading(true);

            const response = await fetch(`${API_URL}/company/modules/create`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const result = await response.json();

            if (response.ok) {

                const value = result?.data?.appConfig;


                setCardData(value);
            }
        } catch (error) {
            console.error('Failed to fetch card data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (API_URL && token) {
            fetchCreateData();
        }
    }, [API_URL, token]);


    const handleModuleSections = (item) => {
        setLayoutType(item.type);
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="flex flex-col gap-6">
                    <Typography variant="body1">Select the type of Module to continue</Typography>

                    <Grid container spacing={6}>
                        {[...Array(3)].map((_, index) => (
                            <Grid item size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                                <Card className="h-full flex flex-col" style={{ minHeight: 400 }}>
                                    {/* Image Skeleton */}
                                    <Skeleton variant="rectangular" height={180} />

                                    {/* Content Skeleton */}
                                    <CardContent className="flex flex-col flex-grow justify-between gap-4">
                                        <div>
                                            <Skeleton variant="text" width="60%" height={30} />
                                            <Skeleton variant="text" width="90%" height={20} />
                                            <Skeleton variant="text" width="90%" height={20} />
                                        </div>
                                        <Skeleton variant="rectangular" height={40} width="100%" />
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
        <>
            <Card>
                <CardContent className='flex flex-col gap-6'>
                    <Typography variant="body1">Select the type of Module to continue</Typography>
                    {cardData && cardData.length > 0 ? (
                        <Grid container spacing={18}>
                            {cardData.map((item, index) => (
                                <Grid item size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                                    <div className="border rounded h-full flex flex-col overflow-hidden" style={{ minHeight: 400 }}>
                                        {/* Image Section */}
                                        <div style={{ blockSize: 180, overflow: 'hidden' }}>

                                            <img
                                                src={`${ASSET_URL}/moduleType/${item?.image_url}`}
                                                alt={item?.title}
                                                className="w-full h-full object-cover"
                                            />

                                        </div>

                                        {/* Content Section */}
                                        <div className="flex flex-col justify-between flex-grow p-5">
                                            <div className="flex flex-col gap-1">
                                                <Typography
                                                    variant="h5"
                                                >
                                                    {item?.title}
                                                </Typography>
                                                <Typography>{item?.description}</Typography>
                                            </div>

                                            <div className="flex flex-wrap gap-4 mt-6">
                                                <Button
                                                    fullWidth
                                                    variant="tonal"
                                                    endIcon={
                                                        <DirectionalIcon
                                                            ltrIconClass="tabler-chevron-right"
                                                            rtlIconClass="tabler-chevron-left"
                                                        />
                                                    }
                                                    onClick={() => {
                                                        router.push(`/${locale}/apps/modules/${cId}/form/module/${item._id}`)
                                                    }}
                                                    className="flex-auto"
                                                >
                                                    Continue
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </Grid>
                            ))}
                        </Grid>
                    ) : (
                        <Typography className="text-center">No Module Type</Typography>
                    )}
                </CardContent>
            </Card>
        </>
    )
}

export default ModuleTypeCardComponent
