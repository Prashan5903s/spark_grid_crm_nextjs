'use client'

// React Imports
import { useEffect, useRef, useState } from 'react'

// Next Imports
import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'

// MUI Imports
import IconButton from '@mui/material/IconButton'
import Popper from '@mui/material/Popper'
import Fade from '@mui/material/Fade'
import Paper from '@mui/material/Paper'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import MenuList from '@mui/material/MenuList'
import MenuItem from '@mui/material/MenuItem'

// Hook Imports

import { useSession } from 'next-auth/react'

import { useSettings } from '@core/hooks/useSettings'


const getLocalePath = (pathName, locale) => {
  if (!pathName) return '/'
  const segments = pathName.split('/')

  segments[1] = locale

  return segments.join('/')
}

const LanguageDropdown = () => {
  // States
  const [open, setOpen] = useState(false)
  const [data, setData] = useState();

  const { data: session } = useSession()
  const token = session?.user?.token
  const API_URL = process.env.NEXT_PUBLIC_API_URL

  const fetchLanguage = async () => {

    try {
      const response = await fetch(`${API_URL}/company/language/menu`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setData(data?.data);
      }
    } catch (error) {
      throw new Error(error);
    }

  }

  useEffect(() => {
    if (API_URL && token) {
      fetchLanguage();
    }
  }, [API_URL, token])

  // Vars
  const languageData = !data ? [] : data.map(item => ({
    langCode: item.short_name,
    langName: item.language_name
  }));

  // Refs
  const anchorRef = useRef(null)

  // Hooks
  const pathName = usePathname()
  const { settings } = useSettings()
  const { lang } = useParams()

  const handleClose = () => {
    setOpen(false)
  }

  const handleToggle = () => {
    setOpen(prevOpen => !prevOpen)
  }

  return (
    <>
      <IconButton ref={anchorRef} onClick={handleToggle} className='text-textPrimary'>
        <i className='tabler-language' />
      </IconButton>
      <Popper
        open={open}
        transition
        disablePortal
        placement='bottom-start'
        anchorEl={anchorRef.current}
        className='min-is-[160px] !mbs-3 z-[1]'
      >
        {({ TransitionProps, placement }) => (
          <Fade
            {...TransitionProps}
            style={{ transformOrigin: placement === 'bottom-start' ? 'left top' : 'right top' }}
          >
            <Paper className={settings.skin === 'bordered' ? 'border shadow-none' : 'shadow-lg'}>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList onKeyDown={handleClose}>
                  {languageData.map(locale => (
                    <MenuItem
                      key={locale.langCode}
                      component={Link}
                      href={getLocalePath(pathName, locale.langCode)}
                      onClick={handleClose}
                      selected={lang === locale.langCode}
                    >
                      {locale.langName}
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Fade>
        )}
      </Popper>
    </>
  )
}

export default LanguageDropdown
