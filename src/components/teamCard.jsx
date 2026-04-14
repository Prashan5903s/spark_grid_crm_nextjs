'use client'

import { useState } from 'react'

import Image from 'next/image'

import {
    Card,
    CardContent,
    Typography,
    Button,
    Box,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
} from '@mui/material'

import TabContext from '@mui/lab/TabContext'

import TabPanel from '@mui/lab/TabPanel'

import Tab from '@mui/material/Tab'

import Grid from '@mui/material/Grid2'

import TabList from '@mui/lab/TabList'

import ImageCard from '@components/imageCard'

import DialogCloseButton from './dialogs/DialogCloseButton'

import TableComponent from '@/components/tableComponent';

const TeamCard = ({ teams = [], onAddTeamSubmit }) => {
    const [files, setFiles] = useState([])
    const [open, setOpen] = useState(false)
    const [teamName, setTeamName] = useState('')
    const [teamDescription, setTeamDescription] = useState('')
    const [loading, setLoading] = useState(false)
    const [selectedTeam, setSelectedTeam] = useState(null)
    const [showTable, setShowTable] = useState(false)

    const [value, setValue] = useState('info')

    const handleOpen = () => setOpen(true)

    const handleTabChange = (event, newValue) => {
        setValue(newValue)
    }

    const handleClose = () => {
        setOpen(false)
        setTeamName('')
        setTeamDescription('')
        setFiles([])
        setLoading(false)
    }

    const handleSubmit = (e) => {
        e.preventDefault()

        setLoading(true)

        setTimeout(() => {
            const image = files[0] ? URL.createObjectURL(files[0]) : ''

            const newTeam = {
                id: Date.now(),
                name: teamName,
                description: teamDescription,
                memberCount: 0,
                image,
            }

            onAddTeamSubmit?.(newTeam)
            handleClose()
        }, 1000)
    }

    if (showTable && selectedTeam) {
        return (
            <TabContext value={value}>
                <TabList variant='scrollable' onChange={handleTabChange} className='border-b px-0 pt-0'>
                    <Tab key={1} label='Info' value='info' />
                    <Tab key={2} label='Request recieved' value='request_recieved' />
                </TabList>

                <div className='pt-0 mt-4'>
                    <TabPanel value='info' className='p-0'>
                        <Box mt={4}>
                            <Grid container alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                                <Grid item>
                                    <Typography variant="h4" gutterBottom>
                                        Invite: {selectedTeam.name}
                                    </Typography>
                                </Grid>
                                <Grid item>
                                    <Button variant="outlined" onClick={() => {
                                        setShowTable(false);
                                    }}>Back</Button>
                                </Grid>
                            </Grid>
                            <TableComponent team={selectedTeam} type={1}/>
                        </Box>
                    </TabPanel>
                    <TabPanel value='request_recieved' className='p-0'>
                        <Box mt={4}>
                            <Grid container alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                                <Grid item>
                                    <Typography variant="h4" gutterBottom>
                                        Request recievd: {selectedTeam.name}
                                    </Typography>
                                </Grid>
                                <Grid item>
                                    <Button variant="outlined" onClick={() => {
                                        setShowTable(false);
                                    }}>Back</Button>
                                </Grid>
                            </Grid>
                            <TableComponent team={selectedTeam} type={0}/>
                        </Box>
                    </TabPanel>
                </div>
            </TabContext>
        )
    }

    return (
        <>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography variant="h5" fontWeight={600}>
                    My Team
                </Typography>
                <Button variant="outlined" onClick={handleOpen}>
                    Add Team
                </Button>
            </Box>

            {/* Team Cards */}
            <Grid container spacing={4}>
                {teams.map((team) => (
                    <Grid
                        size={{ xs: 12, lg: 3, md: 4 }}
                        key={team.id}
                        onClick={() => {
                            setSelectedTeam(team)
                            setShowTable(true)
                        }}
                    >
                        <Card
                            sx={{
                                border: '1px solid #e0e0e0',
                                borderRadius: 3,
                                overflow: 'hidden',
                                position: 'relative',
                                transition: 'transform 0.3s, box-shadow 0.3s',
                                '&:hover': {
                                    transform: 'scale(1.03)',
                                    boxShadow: 6,
                                },
                            }}
                        >
                            <Image
                                src={team.image || '/images/apps/academy/badge.png'}
                                alt={team.name}
                                width={500}
                                height={200}
                                style={{ inlineSize: '100%', blockSize: '200px', objectFit: 'cover' }}
                            />

                            <CardContent>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    👥 {team.memberCount} Member{team.memberCount !== 1 ? 's' : ''}
                                </Typography>
                                <Typography variant="h6" fontWeight={600}>
                                    {team.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {team.description}
                                </Typography>
                            </CardContent>

                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Add Team Dialog */}
            <Dialog
                open={open}
                onClose={handleClose}
                closeAfterTransition={false}
                sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
                fullWidth
                maxWidth="sm"
            >
                <form onSubmit={handleSubmit} noValidate>
                    {/* Close Button */}
                    <DialogCloseButton onClick={handleClose} disableRipple>
                        <i className="tabler-x" />
                    </DialogCloseButton>

                    {/* Title */}
                    <DialogTitle
                        variant="h4"
                        className="flex flex-col gap-2 text-center sm:pbs-16 sm:pbe-6 sm:pli-16"
                    >
                        Add Team
                    </DialogTitle>

                    {/* Form Fields */}
                    <DialogContent sx={{ px: { xs: 3, sm: 6 }, pt: 0, pb: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Team Name"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            fullWidth
                            required
                        />
                        <TextField
                            label="Description"
                            value={teamDescription}
                            onChange={(e) => setTeamDescription(e.target.value)}
                            fullWidth
                            multiline
                            rows={3}
                        />
                        <ImageCard files={files} setFiles={setFiles} />
                    </DialogContent>

                    {/* Actions */}
                    <DialogActions className="mt-4 flex max-sm:flex-col max-sm:items-center max-sm:gap-2 justify-center pbs-0 sm:pbe-16 sm:pli-16">
                        <Button
                            type="submit"
                            variant="contained"
                            sx={{ blockSize: 40, position: 'relative', minWidth: 120 }}
                        >
                            Create
                        </Button>
                        <Button onClick={handleClose} variant="tonal" color="secondary">
                            Discard
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </>
    )
}

export default TeamCard
