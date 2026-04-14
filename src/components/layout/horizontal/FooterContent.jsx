'use client'

// Next Imports
import Link from 'next/link'

// Third-party Imports
import classnames from 'classnames'

// Hook Imports
import useHorizontalNav from '@menu/hooks/useHorizontalNav'

// Util Imports
import { horizontalLayoutClasses } from '@layouts/utils/layoutClasses'

const FooterContent = () => {
  // Hooks
  const { isBreakpointReached } = useHorizontalNav()

  return (
    <div
      className={classnames(horizontalLayoutClasses.footerContent, 'flex items-center justify-between flex-wrap gap-4')}
    >
      <p>
        <span className='text-textSecondary'>{`©2025, Made with `}</span>
        <span className='text-textSecondary'>{` by `}</span>
        <span>DreamWeavers</span>
      </p>
    </div>
  )
}

export default FooterContent
