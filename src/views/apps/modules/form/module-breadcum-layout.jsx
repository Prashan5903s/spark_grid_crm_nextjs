"use client"

import { useState, useEffect } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import { CardContent, CardHeader, CardActions } from '@mui/material'

import Button from '@mui/material/Button'

import ManageContentsCard from './layouts/manage-contents-card';

import CustomInputVertical from '@core/components/custom-inputs/Vertical'

const ModuleBreadCumLayout = () => {

    return (
        <>
            <Card>
                <CardContent className='flex flex-col gap-6'>
                    <Grid item size={{ xs: 12, md: 12, lg: 12 }} className='flex flex-col gap-4'>

                        <div

                            className='flex items-center justify-between gap-4 p-3 border rounded-lg shadow-sm bg-white'
                        >
                            {/* Left: Icon + Info */}
                            <div className='flex items-center gap-4'>
                                <div className='w-10 h-10'>jhjhjh</div>
                                <div className='flex flex-col gap-1'>
                                    <Typography color='text.primary'>ghghgg</Typography>
                                    {/* <Typography variant='h4'>{item.count}</Typography> */}
                                    <Typography variant='body2'>ghgghghgh</Typography>
                                </div>
                            </div>


                            <div className='flex items-center gap-2'>
                                <IconButton color='primary'>
                                    <i className='tabler-edit text-textSecondary' />
                                </IconButton>
                                <IconButton color='error'>
                                    <i className='tabler-trash text-textSecondary' />
                                </IconButton>
                            </div>
                        </div>

                    </Grid>
                </CardContent>
            </Card>
        </>
    )
}

export default ModuleBreadCumLayout
