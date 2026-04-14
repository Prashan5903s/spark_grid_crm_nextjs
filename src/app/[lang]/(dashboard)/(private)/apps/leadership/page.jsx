'use client'

import { useState } from 'react'

import {
    Box,
    Card,
    CardContent,
    Typography,
    Avatar,
    Stack,
    Paper,
    Button,
    Dialog,
    Tooltip,
    DialogActions,
    TextField,
    DialogContent,
    IconButton,
    InputAdornment,
} from '@mui/material'

import Grid from '@mui/material/Grid2'

import DialogCloseButton from '@/components/dialogs/DialogCloseButton'

export default function LeadershipBoard() {

    const [showModal, setShowModal] = useState(false);

    const user = {
        name: 'Priya Kumar',
        points: 0,
        rank: 1,
        initials: 'PK',
    }

    const ruleData = [
        {
            rule_name: "Only on a user's first login",
            points: 5,
        },
        {
            rule_name: "Completion of a Micro-learning module by a Learner",
            points: 5
        }
    ]

    const handleClose = () => {
        setShowModal(false);
    }

    return (
        <Box p={3}>

            {/* Title */}
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                <Typography variant="h5" fontWeight="bold">
                    Leaderboard
                </Typography>
                <Button variant="outlined" onClick={() => {
                    setShowModal(true);
                }}>RuleBook</Button>
            </Box>

            <Grid container spacing={3}>
                {/* Left Panel */}
                <Grid item size={{ xs: 12, md: 8 }}>
                    {/* Highlighted User Card */}
                    <Card
                        sx={{
                            background: 'linear-gradient(to right, #fef1f6, #fdf9f6)',
                            mb: 3,
                            boxShadow: 2,
                            borderRadius: 3,
                        }}
                    >
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: '#b91372', inlineSize: 56, blockSize: 56, color: "#fff" }}>
                                {user.initials}
                            </Avatar>
                            <Box>
                                <Typography fontWeight="bold" color='#000'>{user.name}</Typography>
                                <Typography variant="body2" color="text.secondary" style={{ color: "#000" }}>
                                    🏅 Rank {user.rank} &nbsp;&nbsp; 🛡️ Points{' '}
                                    <Typography component="span" color="primary" fontWeight="medium" style={{ color: "#000" }}>
                                        {user.points}
                                    </Typography>
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Podium Section */}
                    <Paper
                        elevation={2}
                        sx={{
                            p: 4,
                            borderRadius: 3,
                            
                            // backgroundColor: '#bhh23',

                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'flex-end',
                        }}
                    >
                        <Grid container spacing={2} className='justify-center items-end'>
                            <Grid size={{ xs: 4 }} className='flex justify-center'>
                                <Avatar className='bg-error -mb-7' style={{ color: "#fff" }}>PK</Avatar>
                            </Grid>
                            <Grid size={{ xs: 4 }} className='flex justify-center'>
                                <Avatar className='bg-error' style={{ color: "#fff" }}>PK</Avatar>
                            </Grid>
                            <Grid size={{ xs: 4 }} className='flex justify-center'>
                                <Avatar className='bg-error -mb-10' style={{ color: "#fff" }}>PK</Avatar>
                            </Grid>
                            <Grid size={{ xs: 4 }}>
                                <div className='rounded w-full min-w-[100px] h-[110px] bg-info'></div>
                            </Grid>
                            <Grid size={{ xs: 4 }}>
                                <div className='rounded w-full min-w-[100px] h-[140px] bg-primary'></div>
                            </Grid>
                            <Grid size={{ xs: 4 }}>
                                <div className='rounded w-full min-w-[100px] h-[100px] bg-warning'></div>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {/* Right Panel */}
                <Grid item size={{ xs: 12, md: 4 }}>
                    {/* Search */}
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <TextField
                            size="small"
                            placeholder="Search"
                            fullWidth
                        />
                    </Box>

                    {/* Rank List */}
                    <Paper
                        elevation={1}
                        sx={{
                            p: 2,
                            mt: 3,
                            pl: 4,
                            pr: 4,
                            blockSize: 70,
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                        }}
                    >
                        <Avatar sx={{ bgcolor: '#b91372', inlineSize: 36, blockSize: 36, color: "#fff" }}>
                            {user.initials}
                        </Avatar>
                        <Box flexGrow={1} minWidth={0}>
                            <Typography fontWeight="bold" noWrap>
                                {user.name}
                            </Typography>
                        </Box>
                        <Typography color="primary" fontWeight="medium" noWrap>
                            {user.points} pts
                        </Typography>
                    </Paper>

                    <Dialog
                        open={showModal}
                        onClose={handleClose}
                        maxWidth="md"
                        fullWidth
                        sx={{ '& .MuiDialog-paper': { overflow: 'visible', borderRadius: 2 } }}
                    >
                        <DialogCloseButton onClick={handleClose} disableRipple>
                            <i className="tabler-x" />
                        </DialogCloseButton>

                        <DialogContent sx={{ p: 3 }}>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                Rulebook
                            </Typography>

                            <Stack spacing={2} pt={9} pb={6} pl={2} pr={4}>
                                {ruleData.map((rule, index) => (
                                    <Paper
                                        key={index}
                                        elevation={2}
                                        sx={{
                                            gap: 6,
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            p: 4,
                                            borderRadius: 2
                                        }}
                                    >
                                        <Typography variant="body1">{rule.rule_name}</Typography>
                                        <Button
                                            variant="contained"
                                            sx={{
                                                minWidth: 70,

                                            }}
                                        >
                                            {rule.points} Pts
                                        </Button>
                                    </Paper>
                                ))}
                            </Stack>
                        </DialogContent>
                    </Dialog>
                </Grid>
            </Grid>
        </Box>
    )
}
