'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Typography from '@mui/material/Typography'
import { styled } from '@mui/material/styles'

// Third-party Imports
import { useDropzone } from 'react-dropzone'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

// Styled Component Imports
import AppReactDropzone from '@/libs/styles/AppReactDropzone'

// Styled Dropzone Component
const DropzoneWrapper = styled(AppReactDropzone)(({ theme }) => ({
    '& .dropzone': {
        minHeight: 'unset',
        padding: theme.spacing(12),
        [theme.breakpoints.down('sm')]: {
            paddingInline: theme.spacing(5)
        },
        '&+.MuiList-root .MuiListItem-root .file-name': {
            fontWeight: theme.typography.body1.fontWeight
        }
    }
}))

const ImageCard = () => {
    const [files, setFiles] = useState([])

    const { getRootProps, getInputProps } = useDropzone({
        accept: { 'image/*': [] },
        onDrop: acceptedFiles => {
            const mappedFiles = acceptedFiles.map(file =>
                Object.assign(file, {
                    preview: URL.createObjectURL(file)
                })
            )
            
            setFiles(mappedFiles)
        }
    })

    // Cleanup object URLs
    useEffect(() => {
        return () => {
            files.forEach(file => URL.revokeObjectURL(file.preview))
        }
    }, [files])

    const handleRemoveFile = fileToRemove => {
        setFiles(prevFiles => prevFiles.filter(file => file.name !== fileToRemove.name))
        URL.revokeObjectURL(fileToRemove.preview)
    }

    const handleRemoveAllFiles = () => {
        files.forEach(file => URL.revokeObjectURL(file.preview))
        setFiles([])
    }

    const renderFilePreview = file => {
        return file.type.startsWith('image') ? (
            <img width={38} height={38} alt={file.name} src={file.preview} />
        ) : (
            <i className='tabler-file-description' />
        )
    }

    const fileList = files.map(file => (
        <ListItem key={file.name} className='pis-4 plb-3'>
            <div className='file-details' style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className='file-preview'>{renderFilePreview(file)}</div>
                <div>
                    <Typography className='file-name font-medium' color='text.primary'>
                        {file.name}
                    </Typography>
                    <Typography className='file-size' variant='body2'>
                        {file.size > 1_000_000
                            ? `${(file.size / 1_000_000).toFixed(1)} MB`
                            : `${(file.size / 1_000).toFixed(1)} KB`}
                    </Typography>
                </div>
            </div>
            <IconButton onClick={() => handleRemoveFile(file)}>
                <i className='tabler-x text-xl' />
            </IconButton>
        </ListItem>
    ))

    return (
        <DropzoneWrapper>
            <Card>
                <CardContent>
                    <div {...getRootProps({ className: 'dropzone' })}>
                        <input {...getInputProps()} />
                        <div className='flex items-center flex-col gap-2 text-center'>
                            <CustomAvatar variant='rounded' skin='light' color='secondary'>
                                <i className='tabler-upload' />
                            </CustomAvatar>
                            <Typography variant='h4'>Drag and Drop Your Image Here.</Typography>
                            <Typography color='text.disabled'>or</Typography>
                            <Button variant='tonal' size='small'>
                                Browse Image
                            </Button>
                        </div>
                    </div>
                    {files.length > 0 && (
                        <>
                            <List>{fileList}</List>
                        </>
                    )}
                </CardContent>
            </Card>
        </DropzoneWrapper>
    )
}

export default ImageCard
