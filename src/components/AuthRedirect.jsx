'use client'

import { useState, useEffect } from 'react'

// Next Imports

import { redirect, usePathname } from 'next/navigation'

// Config Imports
import themeConfig from '@configs/themeConfig'
import { usePermissionList } from '@/utils/getPermission'

// Util Imports

import { getLocalizedUrl } from '@/utils/i18n'  

const AuthRedirect = ({ lang }) => {
  const pathname = usePathname()

  const getPermissions = usePermissionList(); // returns an async function
  const [permissions, setPermissions] = useState({});

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const result = await getPermissions();

        setPermissions(result);
      } catch (error) {
        console.error('Error fetching permissions:', error);
      }
    };

    if (getPermissions) {
      fetchPermissions();
    }
  }, [getPermissions]); // Include in dependency array

  // ℹ️ Bring me `lang`
  const redirectUrl = `/${lang}/login?redirectTo=${pathname}`
  const login = `/${lang}/login`
  const homePage = getLocalizedUrl(themeConfig.homePageUrl, lang)

  return redirect(pathname === login ? login : pathname === homePage ? login : redirectUrl)
}

export default AuthRedirect
