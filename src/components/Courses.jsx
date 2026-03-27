'use client'

import { useState, useEffect } from 'react'

import Link from 'next/link'

import { useParams } from 'next/navigation'

// MUI
import Grid from '@mui/material/Grid2'

import { Card, CardContent, Typography, Chip, Box } from '@mui/material'

// Utils
import { getLocalizedUrl } from '@/utils/i18n'

const Courses = ({ searchValue, type }) => {

  const assert_url = process.env.NEXT_PUBLIC_ASSETS_URL;

  const [filteredCourses, setFilteredCourses] = useState([])
  const { lang: locale } = useParams()

  const slugify = text =>
    text
      .toLowerCase()
      .trim()
      .replace(/[\s_]+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')

  useEffect(() => {
    if (searchValue) {
      setFilteredCourses(searchValue)
    }
  }, [searchValue])

  return (
    <Grid container spacing={6}>
      {
        filteredCourses?.length > 0 ?
          (

            filteredCourses.map((course, index) => (
              <Grid item key={index} size={{ xs: 12, sm: 6, lg: 4 }}>
                <Card
                  className='rounded-xl shadow-md transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-primary'
                  sx={{
                    blockSize: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    border: '1px solid transparent',
                    '&:hover': {
                      borderColor: theme => theme.palette.primary.main
                    }
                  }}
                >
                  <Link href={getLocalizedUrl(`/apps/moduleProgram/detail/${(course._id)}`, locale)}>
                    <img
                      src={`${assert_url}/program_module/${course.tutorImg}`}
                      alt={course.courseTitle}
                      className='w-full object-cover'
                      style={{ blockSize: 120 }}
                    />
                  </Link>

                  <CardContent
                    sx={{
                      flexGrow: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: 1
                    }}
                  >
                    <div>
                      <Typography
                        variant='subtitle1'
                        fontWeight={600}
                        component={Link}
                        href={getLocalizedUrl(`/apps/moduleProgram/detail/${course._id}`, locale)}
                        className='line-clamp-2 hover:text-primary'
                      >
                        {course.courseTitle}
                      </Typography>

                      {type === 1 && course.tags && (
                        <div className='flex flex-wrap gap-1 my-1'>
                          <Chip
                            label={course.tags}
                            variant='outlined'
                            size='small'
                            sx={{ fontSize: '0.7rem', borderRadius: '12px' }}
                          />
                        </div>
                      )}

                      {type === 0 && (
                        <Typography className='mt-5 text-center w-full flex justify-center'>
                          Estimated to 2
                        </Typography>
                      )}
                    </div>

                    {type === 0 && (
                      <Typography
                        variant='body2'
                        className='line-clamp-3 text-sm text-grey-600'
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical'
                        }}
                      >
                        Angular is a TypeScript-based front-end web application framework...
                      </Typography>
                    )}

                    {type === 1 && (
                      <div>
                        <Typography variant='body2' color='text.primary'>
                          In Progress
                        </Typography>
                        <Typography variant='body2' color='error.main' fontWeight={600}>
                          Overdue
                        </Typography>
                      </div>
                    )}
                  </CardContent>

                  {type === 1 && (
                    <div
                      style={{
                        blockSize: 4,
                        inlineSize: `${course.percentage || 60}%`,
                        backgroundColor: '#FACC15'
                      }}
                    />
                  )}
                </Card>
              </Grid>
            ))
          ) : (
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
                No courses found.
              </Typography>
            </Box>
          )
      }
    </Grid>
  )
}

export default Courses
