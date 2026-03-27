'use client'

import { useParams, useRouter } from 'next/navigation'

// MUI
import { Card, Breadcrumbs, Link, Skeleton } from '@mui/material'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import LinearProgress from '@mui/material/LinearProgress'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'

// ⭐ Status Color Helper
const getChipColor = status => {
  switch (status) {
    case 'In Progress': return 'warning'
    case 'Completed': return 'success'
    default: return 'default'
  }
}

export default function ProgramPage({ data }) {

  const { lang } = useParams()
  const router = useRouter()

  const assert_url = process.env.NEXT_PUBLIC_ASSETS_URL

  function formatEnrollDate(dateString) {
    const date = new Date(dateString)

    return `${String(date.getDate()).padStart(2, '0')} ${String(date.getMonth() + 1).padStart(2, '0')} ${date.getFullYear()}`
  }


  const isLoading = !data

  if (isLoading) {
    return (
      <Box className="p-6 space-y-5">

        {/* Skeleton Header */}
        <Card>
          <Box px={5} py={2}>
            <Skeleton width={120} height={20} />
          </Box>

          <CardContent className="flex flex-col sm:flex-row gap-5">
            <Skeleton variant="rectangular" width={260} height={230} />

            <Box flex={1} className='flex flex-col justify-between gap-3'>
              <Skeleton width="50%" height={32} />
              <Skeleton width="70%" height={28} />

              <Stack direction="row" spacing={4}>
                <Skeleton width={80} height={20} />
                <Skeleton width={80} height={20} />
              </Stack>

              <Skeleton variant="rectangular" width="100%" height={10} />
            </Box>
          </CardContent>
        </Card>

        <Skeleton width={200} height={28} />

        {/* Skeleton list */}
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="flex items-start gap-4">
              <Skeleton variant="rectangular" width={75} height={75} />
              <Box flex={1}>
                <Skeleton width="60%" height={24} />
                <Skeleton width="90%" height={20} />
                <Skeleton width="40%" height={20} sx={{ mt: 1 }} />
              </Box>
              <Box textAlign="right">
                <Skeleton width={100} height={18} />
                <Skeleton width={60} height={24} sx={{ mt: 1 }} />
              </Box>
            </CardContent>
            <Skeleton variant="rectangular" height={4} />
          </Card>
        ))}

      </Box>
    )
  }

  const logs = data?.courseDetails?.activity_logs || [];

  const avgCompletion =
    logs.length > 0
      ? logs.reduce((sum, item) => sum + Number(item.completion_percentage || 0), 0) / logs.length
      : 0;

  return (
    <Box className="p-6 space-y-5">

      {/* Program Header */}
      <Card>
        <Breadcrumbs
          px={5}
          aria-label="breadcrumb"
          separator="›"
          sx={{
            py: 2,
            backgroundColor: 'rgba(0,0,0,0.03)',
            borderBottom: '1px solid #e0e0e0',
            '& a, & span': {
              fontSize: '0.875rem',
              fontWeight: 500,
            },
            '& a': {
              color: '#1976d2',
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline'
              }
            }
          }}
        >
          <Link href={`/${lang}/apps/my-courses`}>
            <Typography component="span">Home</Typography>
          </Link>
        </Breadcrumbs>

        <CardContent className="flex flex-col sm:flex-row gap-5">

          {/* Thumbnail */}
          <Box
            component="img"
            src={`${assert_url}/program_module/${data?.courseDetails?.image_url}`}
            sx={{ width: 260, height: 230, borderRadius: 2, objectFit: 'cover' }}
          />

          {/* Program Info */}
          <Box className='flex flex-col justify-between'>
            <div>
              <Typography variant='h6'>Program:</Typography>
              <Typography fontWeight={600} variant='h5'>
                {data?.courseDetails?.title}
              </Typography>
            </div>

            <Box className='flex gap-10 mt-3'>
              <div>
                <Typography variant='body2' color='text.secondary'>Modules Enrolled</Typography>
                <Typography fontWeight={600}>{data?.courses?.length}</Typography>
              </div>
              {/* <div>
                <Typography variant='body2' color='text.secondary'>Learners Enrolled</Typography>
                <Typography fontWeight={600}>291</Typography>
              </div> */}
            </Box>

            <Box mt={2}>
              <Typography variant='body2'>{avgCompletion.toFixed(1) > 100 ? 100 : avgCompletion.toFixed(1)}% Completed</Typography>
              <LinearProgress variant='determinate' value={avgCompletion.toFixed(1) > 100 ? 100 : avgCompletion.toFixed(1)} sx={{ mt: 1, height: 8, borderRadius: 2 }} />
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Typography variant="h6" className="mt-2">Enrolled Modules</Typography>

      {/* Modules List */}
      {data?.courses?.length > 0
        ?
        (
          data?.courses?.map((item, index) => {

            // Calculate average completion
            const logs = item?.activity_logs || [];

            const avgCompletion = logs.length
              ? logs.reduce((sum, l) => sum + Number(l.completion_percentage || 0), 0) / logs.length
              : 0;

            // Determine status
            let status = "Pending";

            if (avgCompletion.toFixed(1) >= 100) status = "Completed";
            else if (avgCompletion.toFixed(1) > 0) status = "In Progress";

            return (
              <Card
                key={index}
                className="rounded-lg hover:shadow-sm transition-all"
                onClick={() => {
                  router.push(`/${lang}/apps/content?id=${item._id}&content-folder-id=${data?.courseDetails?._id}`);
                }}
              >
                <CardContent className="flex items-start justify-between gap-4">
                  <Stack direction="row" spacing={2}>
                    <Box
                      component="img"
                      src={`${assert_url}/program_module/${item.image_url}`}
                      sx={{ width: 75, height: 75, borderRadius: 1, objectFit: 'cover' }}
                    />

                    <Box>
                      <Typography fontWeight={600}>{item.title}</Typography>
                      <Typography variant="body2" color="text.secondary">{item.description}</Typography>

                      <Stack direction="row" spacing={1} alignItems="center" mt={1}>
                        <i className="tabler-file-description text-sm" />
                        <Typography variant="caption">{"type"}</Typography>
                        <Typography variant="caption">•</Typography>

                        <i className="tabler-device-laptop text-sm" />
                        <i className="tabler-device-mobile text-sm" />
                        <Typography variant="caption">•</Typography>

                        <Typography variant="caption">{data?.courseDetails?.title}</Typography>
                      </Stack>
                    </Box>
                  </Stack>

                  <Box textAlign="right">
                    <Typography variant="body2" color="text.secondary">
                      Enrolled on {formatEnrollDate(item?.created_at)}
                    </Typography>

                    <Chip
                      label={status}
                      size="small"
                      color={
                        status === "Completed"
                          ? "success"
                          : status === "In Progress"
                            ? "warning"
                            : "default"
                      }
                      sx={{ mt: 1 }}
                    />

                    <IconButton size="small">{">"}</IconButton>
                  </Box>
                </CardContent>

                {status !== "Pending" && (
                  <LinearProgress
                    variant="determinate"
                    value={avgCompletion.toFixed(1) > 100 ? 100 : avgCompletion.toFixed(1)}
                    sx={{
                      height: 3,
                      borderRadius: 0,
                      '& .MuiLinearProgress-bar': { backgroundColor: '#fbbc04' }
                    }}
                  />
                )}
              </Card>
            );
          })
        )
        : (
          <Box
            className="flex justify-center items-center"
            sx={{
              py: 6,
              border: '1px solid #ECECEC',
              borderRadius: 2,
              backgroundColor: '#FAFAFA',
            }}
          >
            <Typography variant="body1" color="text.secondary" fontStyle="italic">
              No Program found.
            </Typography>
          </Box>
        )}

    </Box>
  )
}
