'use client'

import { useState, useEffect } from 'react'

import dynamic from 'next/dynamic'

import { useParams } from 'next/navigation'

import { useSession } from 'next-auth/react'

// MUI Imports
import Grid from '@mui/material/Grid2'
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Avatar,
  Stack,
  Skeleton
} from '@mui/material'

import PermissionGuardClient from '@/hocs/PermissionClientGuard'

import ModeOfLearningChart from '@/components/ModeOfLearningChart'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

/* ================= COMPONENTS ================= */

const StatCard = ({ title, value, subtitle, icon, color = 'primary.main' }) => (
  <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
    <CardContent>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>

          <Typography variant="h4" fontWeight={700} mt={0.5}>
            {value}
          </Typography>

          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>

        {icon && (
          <Avatar
            sx={{
              bgcolor: color,
              width: 48,
              height: 48,
              borderRadius: 2,
              '& i': { fontSize: 22, color: '#fff' }
            }}
          >
            {icon}
          </Avatar>
        )}
      </Stack>
    </CardContent>
  </Card>
)

const ProgressRow = ({ name, progress }) => (
  <Box mb={2}>
    <Stack direction="row" justifyContent="space-between" mb={0.5}>
      <Typography variant="body2">{name}</Typography>
      <Typography variant="body2" fontWeight={600}>
        {progress}%
      </Typography>
    </Stack>

    <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 5 }} />
  </Box>
)

const ActivityItem = ({ text, index, description }) => (
  <Box mb={1.5}>
    <Stack direction="row" spacing={2} alignItems="center">
      <Avatar sx={{ width: 32, height: 32 }}>{index + 1}</Avatar>
      <Typography variant="body2">{"Watched " + text}</Typography>
    </Stack>
    {description && (
      <Typography variant="caption" color="text.secondary" ml={6}>
        ({description})
      </Typography>
    )}
  </Box>
)

const CardSkeleton = () => (
  <Card sx={{ borderRadius: 3 }}>
    <CardContent>
      <Skeleton width="40%" height={30} />
      <Skeleton width="60%" height={40} />
      <Skeleton variant="rectangular" height={100} sx={{ mt: 2 }} />
    </CardContent>
  </Card>
)

const NoData = ({ text = 'No Data Found' }) => (
  <Box textAlign="center" py={4}>
    <Typography variant="body2" color="text.secondary">
      {text}
    </Typography>
  </Box>
)

export default function Dashboard() {

  const { lang: locale } = useParams()
  const API_URL = process.env.NEXT_PUBLIC_API_URL
  const { data: session } = useSession()
  const token = session?.user?.token

  const [dashboardData, setDashboardData] = useState({})
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      const response = await fetch(`${API_URL}/company/dashboard/company/data`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      const value = await response.json()

      if (response.ok) {

        setDashboardData(value?.data || {})
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (API_URL && token) fetchDashboardData()
  }, [API_URL, token])

  const formatNumber = (value) => Number((value ?? 0).toFixed(0))

  const courseSeries = [
    formatNumber(dashboardData?.CourseProgressStatus?.completed_percentage),
    formatNumber(dashboardData?.CourseProgressStatus?.in_progress_percentage),
    formatNumber(dashboardData?.CourseProgressStatus?.not_started_percentage)
  ]

  const quizSeries = [
    formatNumber(dashboardData?.QuizProgressStatus?.passed_percentage),
    formatNumber(dashboardData?.QuizProgressStatus?.not_passed_percentage),
    formatNumber(dashboardData?.QuizProgressStatus?.not_attempted_percentage)
  ]

  const courseOptions = { labels: ['Completed', 'In Progress', 'Not Started'] }
  const quizOptions = { labels: ['Passed', 'Not Passed', 'Not Attempted'] }

  return (
    <PermissionGuardClient locale={locale} element={'notUser'}>
      <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f9fafb', minHeight: '100vh' }}>

        {/* ================= STATS ================= */}
        <Grid container spacing={3} mb={3}>
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
              <Grid key={i} item size={{ xs: 12, sm: 6, md: 3 }}>
                <CardSkeleton />
              </Grid>
            ))
            : (
              <>
                <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                  <StatCard
                    title="Total Module"
                    value={dashboardData?.totalModule?.length ?? 0}
                    icon={<i className='tabler-book'></i>}
                  />
                </Grid>

                <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                  <StatCard
                    title="Total Learners"
                    value={dashboardData?.totalLearner?.length ?? 0}
                    icon={<i className='tabler-users'></i>}
                  />
                </Grid>

                <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                  <StatCard
                    title="Active Learners"
                    value={dashboardData?.activeLearner?.length ?? 0}
                    subtitle="Today"
                    icon={<i className='tabler-user-check'></i>}
                  />
                </Grid>

                <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                  <StatCard
                    title="Completed Module"
                    value={dashboardData?.completedModules?.length ?? 0}
                    icon={<i className='tabler-check'></i>}
                  />
                </Grid>
              </>
            )}
        </Grid>

        {/* ================= MODULES ================= */}
        <Grid container spacing={3} mb={3}>
          <Grid item size={{ xs: 12, md: 4 }}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" mb={2}>Module Activity</Typography>

                {loading ? (
                  <CardSkeleton />
                ) : dashboardData?.moduleActivity?.length ? (
                  dashboardData.moduleActivity.map((item, i) => (
                    <ProgressRow key={i} name={item?.moduleType} progress={Number(item?.completionPercentage)} />
                  ))
                ) : <NoData />}
              </CardContent>
            </Card>
          </Grid>

          <Grid item size={{ xs: 12, md: 4 }}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" mb={2}>Learner Progress</Typography>

                {loading ? (
                  <CardSkeleton />
                ) : dashboardData?.learnerProgress?.length ? (
                  dashboardData.learnerProgress.map((item, i) => (
                    <ProgressRow key={i} name={item?.module_title} progress={Number(item?.completionPercentage)} />
                  ))
                ) : <NoData />}
              </CardContent>
            </Card>
          </Grid>

          <Grid item size={{ xs: 12, md: 4 }}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" mb={2}>Pending Tasks</Typography>

                {loading ? (
                  <CardSkeleton />
                ) : dashboardData?.pendingTask?.length ? (
                  dashboardData.pendingTask.map((item, i) => (
                    <Typography key={i}>{item?.count} {"pending task of"} {item?.title}</Typography>
                  ))
                ) : <NoData />}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* ================= CHARTS ================= */}
        <Grid container spacing={3} mb={3}>
          <Grid item size={{ xs: 12, md: 6 }}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6">Course Completion Rate</Typography>

                {loading ? (
                  <Skeleton variant="rectangular" height={240} />
                ) : courseSeries.every(v => v === 0) ? (
                  <NoData text="No Course Data" />
                ) : (
                  <Chart type="donut" series={courseSeries} options={courseOptions} height={240} />
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item size={{ xs: 12, md: 6 }}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6">Quiz Performance</Typography>

                {loading ? (
                  <Skeleton variant="rectangular" height={240} />
                ) : quizSeries.every(v => v === 0) ? (
                  <NoData text="No Quiz Data" />
                ) : (
                  <Chart type="donut" series={quizSeries} options={quizOptions} height={240} />
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* ================= ACTIVITY ================= */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <ModeOfLearningChart dashboardData={dashboardData.modesLearning} />
          </Grid>
          <Grid item size={{ xs: 12, md: 6 }}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" mb={2}>Recent Activity</Typography>

                {loading ? (
                  <CardSkeleton />
                ) : dashboardData?.recentActivity?.length ? (
                  dashboardData.recentActivity.map((item, i) => (
                    <ActivityItem
                      key={i}
                      index={i}
                      text={item?.title}
                      description={""}
                    />
                  ))
                ) : <NoData />}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

      </Box>
    </PermissionGuardClient>
  )
}
