'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports

import { useRouter, useParams, useSearchParams } from 'next/navigation'

import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid2'
import Divider from '@mui/material/Divider'
import { useSession } from 'next-auth/react'
import MenuItem from '@mui/material/MenuItem'
import Box from '@mui/material/Box'
import Avatar from '@mui/material/Avatar'
import CardHeader from '@mui/material/CardHeader'
import CircularProgress from '@mui/material/CircularProgress'

import Typography from '@mui/material/Typography'

import { useForm, Controller, useFormContext } from 'react-hook-form'

import CardContent from '@mui/material/CardContent'

import { valibotResolver } from '@hookform/resolvers/valibot';

import { toast } from 'react-toastify'

// Components Imports

import CardActions from '@mui/material/CardActions'

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
    array,
    integer,
    minValue
} from 'valibot';

import { useApi } from '../../../../../utils/api';

import SkeletonFormComponent from '../../../../../components/skeleton/form/page'

import CustomTextField from '@core/components/mui/TextField'

// Third-party Imports


const ModuleSettingLayout = ({ moduleData }) => {


    const { data: session } = useSession() || {}
    const [module, setmodule] = useState();
    const [isLoading, setIsLoading] = useState(true);
    const { doGet, doPost, doPostFormData } = useApi();
    const [loading, setLoading] = useState(false)

    const { lang: locale, id: id } = useParams()

    const schema = object({
        leaderboard_points: pipe(
            integer('Points must be a number'),
            minValue(1, 'Leaderboard points is required')
        )
    });

    // States
    const [formData, setFormData] = useState({
        leaderboard_points: ''
    })

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
            leaderboard_points: ''
        }
    });

    useEffect(() => {
        if (id && moduleData) {
            reset({
                leaderboard_points: moduleData?.settings?.leaderboard_points || '',
            });
        }
    }, [id, moduleData, setValue])


    const onSubmit = async (data) => {
        setLoading(true);
        const endpoint = `admin/module/setting/update/${moduleData._id}`;

        await doPostFormData({
            endpoint,
            values: data,
            method: 'PUT',
            successMessage: '',
            errorMessage: '',
            onSuccess: (response) => {
                toast.success(response.message, { autoClose: 2000 });
                setLoading(false);
            },
        });
    };

    return (
        <>
            <div>
                <form onSubmit={handleSubmit(onSubmit)} noValidate encType="multipart/form-data">
                    <CardContent>
                        <Grid container spacing={5}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Controller
                                    name="leaderboard_points"
                                    control={control}
                                    render={({ field }) => (
                                        <CustomTextField
                                            {...field}
                                            fullWidth
                                            label="Leaderboard Points"
                                            placeholder="Leaderboard Points"
                                            error={!!errors.leaderboard_points}
                                            helperText={errors.leaderboard_points?.message}
                                        />
                                    )}
                                />
                            </Grid>
                        </Grid>


                    </CardContent>

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
                                'Save'
                            )}
                        </Button>
                    </CardActions>
                </form>
            </div>
        </>
    )
}

export default ModuleSettingLayout
