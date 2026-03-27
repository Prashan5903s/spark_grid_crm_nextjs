'use client'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

const StatCard = ({ title, stats }) => {
    return (
        <Card>
            <CardContent>
                <Typography variant="h4">{stats}</Typography>
                <Typography>{title}</Typography>
            </CardContent>
        </Card>
    )
}

export default StatCard
