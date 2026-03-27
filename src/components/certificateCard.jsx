'use client'

import { useState } from 'react'

import Image from 'next/image'

import Dialog from '@mui/material/Dialog'

import DialogContent from '@mui/material/DialogContent'

import DialogActions from '@mui/material/DialogActions'

import Button from '@mui/material/Button'

import { jsPDF } from 'jspdf'

import Card from '@mui/material/Card'

import CardContent from '@mui/material/CardContent'

import Typography from '@mui/material/Typography'

import Grid from '@mui/material/Grid2'

import DialogCloseButton from './dialogs/DialogCloseButton'

const badgeIcon = '/images/apps/academy/badge.png'
const certificateImage = '/images/apps/academy/sample.png'

const CertificateCard = ({ searchValue }) => {
    const [open, setOpen] = useState(false)
    const [selectedCertificate, setSelectedCertificate] = useState(null)

    const handleOpen = certificate => {
        setSelectedCertificate(certificate)
        setOpen(true)
    }

    const handleClose = () => {
        setOpen(false)
        setSelectedCertificate(null)
    }

    const handleDownload = async (imagePath) => {
        try {
            const pdf = new jsPDF('landscape', 'pt', 'a4')
            const imageUrl = `${window.location.origin}${imagePath}`

            const response = await fetch(imageUrl)
            const blob = await response.blob()

            const reader = new FileReader()

            reader.onloadend = () => {
                const imgData = reader.result
                const pageWidth = pdf.internal.pageSize.getWidth()
                const pageHeight = pdf.internal.pageSize.getHeight()

                pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight)
                pdf.save('certificate.pdf')
            }

            reader.readAsDataURL(blob)
        } catch (error) {
            console.error('Error generating PDF:', error)
        }
    }

    return (
        <>
            <Typography variant="h5" fontWeight={600} sx={{ mb: 4 }}>
                My Certificates
            </Typography>

            <Grid container spacing={9}>
                {searchValue.map((certificate, index) => (
                    <Grid item key={index} size={{ xs: 12, sm: 6, md: 3, lg: 4 }}>
                        <Card
                            onClick={() => handleOpen(certificate)}
                            className="cursor-pointer rounded-xl shadow-md transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-primary"
                            sx={{
                                p: 0,
                                border: '1px solid #e0e0e0',
                                borderRadius: 3,
                                overflow: 'hidden',
                            }}
                        >
                            <div
                                style={{
                                    minHeight: '60px',
                                    background: 'linear-gradient(to right, #e2d9fb, #e9e4ff)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '16px',
                                }}
                            >
                                <Image src={badgeIcon} alt="Badge" width={40} height={40} />
                                <Typography variant="h6" fontWeight={600} sx={{ ml: 2 }} className="text-primary">
                                    {certificate?.title || 'Certificate'}
                                </Typography>
                            </div>

                            <CardContent sx={{ p: 3 }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 24px' }}>
                                    <div style={{ inlineSize: 'calc(50% - 12px)' }}>
                                        <Typography variant="body2" color="text.secondary">
                                            <strong>Issued By:</strong>{' '}
                                            {certificate.issued_by}
                                        </Typography>
                                    </div>
                                    <div style={{ inlineSize: 'calc(50% - 12px)' }}>
                                        <Typography variant="body2" color="text.secondary">
                                            <strong>Valid till:</strong>{' '}
                                            {certificate.valid_till === '_' ? '-' : certificate.valid_till}
                                        </Typography>
                                    </div>
                                    <div style={{ inlineSize: 'calc(50% - 12px)' }}>
                                        <Typography variant="body2" color="text.secondary">
                                            <strong>Issued on:</strong> {certificate.issued_on}
                                        </Typography>
                                    </div>
                                    <div style={{ inlineSize: 'calc(50% - 12px)' }}>
                                        <Typography variant="body2" color="text.secondary">
                                            <strong>Certificate type:</strong> {certificate.certificate_type}
                                        </Typography>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Modal Dialog */}
            <Dialog open={open} onClose={handleClose} sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }} maxWidth="md" fullWidth>
                <DialogCloseButton onClick={handleClose} disableRipple>
                    <i className="tabler-x" />
                </DialogCloseButton>
                <DialogContent sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <Image
                        src={certificateImage}
                        alt="Certificate"
                        className="p-8"
                        width={800}
                        height={600}
                        style={{ inlineSize: '100%', blockSize: 'auto', borderRadius: '8px' }}
                    />
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleDownload(certificateImage)}
                    >
                        Download
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    )
}

export default CertificateCard
