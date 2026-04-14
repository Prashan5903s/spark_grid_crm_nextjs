'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import { styled } from '@mui/material/styles'

// Utils
import classnames from 'classnames'

// Components
import CustomAvatar from '@core/components/mui/Avatar'

// Styled Card (hover + border effect)
const StyledCard = styled(Card)(({ color }) => ({
    insetBlockEnd: `2px solid var(--mui-palette-${color}-light)`,
    transition: 'all 0.3s ease',

    '&:hover': {
        insetBlockEnd: `3px solid var(--mui-palette-${color}-main)`,
        boxShadow: 'var(--mui-customShadows-lg)',
        transform: 'translateY(-2px)'
    }
}))

const StatCard = props => {
    const {
        title,
        stats,
        icon = 'ri-bar-chart-line',
        color = 'primary',
        trendNumber
    } = props

    return (
        <StyledCard color={color}>
            <CardContent className="flex flex-col gap-2">

                {/* Top Row */}
                <div className="flex items-center gap-4">
                    <CustomAvatar skin="light" color={color} variant="rounded">
                        <i className={classnames(icon, 'text-[24px]')} />
                    </CustomAvatar>

                    <Typography variant="h4">{stats}</Typography>
                </div>

                {/* Bottom */}
                <div className="flex flex-col">
                    <Typography variant="body1">{title}</Typography>

                    {trendNumber !== undefined && (
                        <div className="flex items-center gap-2">
                            <Typography
                                variant="body2"
                                className="font-medium"
                                color={trendNumber >= 0 ? 'success.main' : 'error.main'}
                            >
                                {trendNumber >= 0 ? '+' : ''}
                                {trendNumber}%
                            </Typography>

                            <Typography variant="caption" color="text.disabled">
                                vs last week
                            </Typography>
                        </div>
                    )}
                </div>
            </CardContent>
        </StyledCard>
    )
}

export default StatCard
