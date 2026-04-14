'use client'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'

const Certificates = () => {
    return (
        <Card>
            <CardHeader title="Certificates" />
            <CardContent>
                <div className="flex justify-between">
                    <span>React Certificate</span>
                    <Button variant="outlined">Download</Button>
                </div>
            </CardContent>
        </Card>
    )
}

export default Certificates
