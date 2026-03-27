'use client'

import { useRef, useState, useEffect } from 'react'

import { Box } from '@mui/material'

import ReactPlayer from 'react-player'

const YouTubePlayerComponent = ({ url, setFieldData, pageData }) => {
  const playerRef = useRef(null)
  const pendingSeekRef = useRef(null)
  const hasSeekedRef = useRef(false)

  const [totalVideoTime, setTotalVideoTime] = useState(0)
  const [currentVideoTime, setCurrentVideoTime] = useState(0)
  const [viewedVideoTime, setViewedVideoTime] = useState(0)

  // Load DB values on mount (highest wins)
    useEffect(() => {
      if (!pageData) return

      const dbTotal = Number(pageData.total_video_time) || 0
      const dbCurrent = Number(pageData.current_video_time) || 0
      const dbViewed = Number(pageData.viewed_video_time) || 0

      setTotalVideoTime(prev => Math.max(prev, dbTotal))
      setCurrentVideoTime(prev => Math.max(prev, dbCurrent))
      setViewedVideoTime(prev => Math.max(prev, dbViewed))

      // Store seek time — actual seek happens on onReady
      if (dbCurrent > 0) {
        pendingSeekRef.current = dbCurrent
        hasSeekedRef.current = false
      }
    }, [pageData])

  // Push updated times upward (only increasing)
  useEffect(() => {
    if (!setFieldData) return

    setFieldData(prev => ({
      ...prev,
      totalVideoTime,
      currentVideoTime,
      viewedVideoTime,
    }))
  }, [totalVideoTime, currentVideoTime, viewedVideoTime, setFieldData])

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        borderRadius: 2,
        overflow: 'hidden',
        boxShadow: 1,
      }}
    >
      <ReactPlayer
        ref={playerRef}
        url={url}
        controls
        width="100%"
        height="100%"

        onReady={() => {
          if (
            playerRef.current &&
            pendingSeekRef.current !== null &&
            !hasSeekedRef.current
          ) {
            playerRef.current.seekTo(pendingSeekRef.current, 'seconds')
            hasSeekedRef.current = true
            pendingSeekRef.current = null
          }
        }}

        onDuration={(duration) => {
          
          const rounded = Math.ceil(duration)
          
          setTotalVideoTime(prev => Math.max(prev, rounded))
        }}

        onProgress={(state) => {
          const rounded = Math.floor(state.playedSeconds)

          setCurrentVideoTime(prev => Math.max(prev, rounded))
          setViewedVideoTime(prev => Math.max(prev, rounded))
        }}

        onEnded={() => {
          setCurrentVideoTime(totalVideoTime)
          setViewedVideoTime(totalVideoTime)
        }}
      />
    </Box>
  )
}

export default YouTubePlayerComponent
