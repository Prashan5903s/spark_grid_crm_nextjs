'use client'

// Next Imports
import { useEffect, useState } from 'react'

import { useParams } from 'next/navigation'

import { useSession } from 'next-auth/react'

// MUI Imports
import { useTheme } from '@mui/material/styles'
import { Skeleton } from '@mui/material'

// Third-party Imports
import PerfectScrollbar from 'react-perfect-scrollbar'

// Component Imports
import { Menu, SubMenu, MenuItem, MenuSection } from '@menu/vertical-menu'
import CustomChip from '@core/components/mui/Chip'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'

// Styled Component Imports
import StyledVerticalNavExpandIcon from '@menu/styles/vertical/StyledVerticalNavExpandIcon'

// Style Imports

import menuItemStyles from '@core/styles/vertical/menuItemStyles'
import menuSectionStyles from '@core/styles/vertical/menuSectionStyles'

const RenderExpandIcon = ({ open, transitionDuration }) => (
  <StyledVerticalNavExpandIcon open={open} transitionDuration={transitionDuration}>
    <i className='tabler-chevron-right' />
  </StyledVerticalNavExpandIcon>
)

const VerticalMenu = ({ dictionary, scrollMenu }) => {
  const theme = useTheme()
  const verticalNavOptions = useVerticalNav()
  const params = useParams()
  const { isBreakpointReached, transitionDuration } = verticalNavOptions
  const { lang: locale, role: role } = params


  const [permissArray, setPermissArray] = useState()

  const { data: session } = useSession()
  const token = session?.user?.token
  const API_URL = process.env.NEXT_PUBLIC_API_URL

  const fetchPermissionList = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/role/allow/permission`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok) {

        setPermissArray(data?.data || [])
      } else {
        console.error('Failed to fetch permissions:', data?.message)
      }
    } catch (error) {
      console.error('Error fetching permissions:', error)
    }
  }

  useEffect(() => {
    if (API_URL && token) {
      fetchPermissionList()
    }
  }, [API_URL, token])

  const ScrollWrapper = isBreakpointReached ? 'div' : PerfectScrollbar

  if (!permissArray) {
    return <Skeleton variant="rectangular" height={400} />
  }

  return (
    // eslint-disable-next-line lines-around-comment
    /* Custom scrollbar instead of browser scroll, remove if you want browser scroll only */
    <ScrollWrapper
      {...(isBreakpointReached
        ? {
          className: 'bs-full overflow-y-auto overflow-x-hidden',
          onScroll: container => scrollMenu(container, false),
        }
        : {
          options: { wheelPropagation: false, suppressScrollX: true },
          onScrollY: container => scrollMenu(container, true),
        })}
    >
      <Menu
        popoutMenuOffset={{ mainAxis: 23 }}
        menuItemStyles={menuItemStyles(verticalNavOptions, theme)}
        renderExpandIcon={({ open }) => (
          <RenderExpandIcon open={open} transitionDuration={transitionDuration} />
        )}
        renderExpandedMenuItemIcon={{ icon: <i className='tabler-circle text-xs' /> }}
        menuSectionStyles={menuSectionStyles(verticalNavOptions, theme)}
      >

        {(permissArray?.notUser) && (
          <MenuItem
            key={"dashboard"}
            href={`/${locale}/dashboard/crm`}
            icon={<i className='tabler-smart-home' />}
          >
            Dashboard
          </MenuItem>
        )}

        {permissArray?.isUser && (
          <MenuItem
            key={"dashboard"}
            href={`/${locale}/dashboard/user/learner`}
            icon={<i className='tabler-smart-home' />}
          >
            Dashboard
          </MenuItem>
        )}
        {/* <SubMenu label="Front Pages" icon={<i className='tabler-files' />}>
          <MenuItem href='/front-pages/landing-page' target='_blank'>
            Landing
          </MenuItem>
          <MenuItem href='/front-pages/pricing' target='_blank'>
            Pricing
          </MenuItem>
          <MenuItem href='/front-pages/payment' target='_blank'>
            Payment
          </MenuItem>
          <MenuItem href='/front-pages/checkout' target='_blank'>
            Checkout
          </MenuItem>
          <MenuItem href='/front-pages/help-center' target='_blank'>
            HelpCenter
          </MenuItem>
        </SubMenu> */}
        <MenuSection label="App Pages">
          {/* <SubMenu label="ECommerce" icon={<i className='tabler-shopping-cart' />}>
            <MenuItem href={`/${locale}/apps/ecommerce/dashboard`}>Dashboard</MenuItem>
            <SubMenu label="Products">
              <MenuItem href={`/${locale}/apps/ecommerce/products/list`}>List</MenuItem>
              <MenuItem href={`/${locale}/apps/ecommerce/products/add`}>Add</MenuItem>
              <MenuItem href={`/${locale}/apps/ecommerce/products/category`}>
                Category
              </MenuItem>
            </SubMenu>
            <SubMenu label="orders">
              <MenuItem href={`/${locale}/apps/ecommerce/orders/list`}>List</MenuItem>
              <MenuItem
                href={`/${locale}/apps/ecommerce/orders/details/5434`}
                exactMatch={false}
                activeUrl='/apps/ecommerce/orders/details'
              >
                Details
              </MenuItem>
            </SubMenu>
            <SubMenu label="Customers">
              <MenuItem href={`/${locale}/apps/ecommerce/customers/list`}>List</MenuItem>
              <MenuItem
                href={`/${locale}/apps/ecommerce/customers/details/879861`}
                exactMatch={false}
                activeUrl='/apps/ecommerce/customers/details'
              >
                details
              </MenuItem>
            </SubMenu>
            <MenuItem href={`/${locale}/apps/ecommerce/manage-reviews`}>
              Manage Reviews
            </MenuItem>
            <MenuItem href={`/${locale}/apps/ecommerce/referrals`}>Referrals</MenuItem>
            <MenuItem href={`/${locale}/apps/ecommerce/settings`}>Settings</MenuItem>
          </SubMenu>
          <SubMenu label="Academy" icon={<i className='tabler-school' />}>
            <MenuItem href={`/${locale}/apps/academy/dashboard`}>Dashboard</MenuItem>
            <MenuItem href={`/${locale}/apps/academy/my-courses`}>MyCourses</MenuItem>
            <MenuItem href={`/${locale}/apps/academy/course-details`}>
              Course Details
            </MenuItem>
          </SubMenu>
          <SubMenu label="Logistics" icon={<i className='tabler-truck' />}>
            <MenuItem href={`/${locale}/apps/logistics/dashboard`}>Dashboard</MenuItem>
            <MenuItem href={`/${locale}/apps/logistics/fleet`}>Fleet</MenuItem>
          </SubMenu>
          <MenuItem
            href={`/${locale}/apps/email`}
            icon={<i className='tabler-mail' />}
            exactMatch={false}
            activeUrl='/apps/email'
          >
            Email
          </MenuItem>
          <MenuItem href={`/${locale}/apps/chat`} icon={<i className='tabler-message-circle-2' />}>
            Chat
          </MenuItem>
          <MenuItem href={`/${locale}/apps/calendar`} icon={<i className='tabler-calendar' />}>
            Calendar
          </MenuItem>
          <MenuItem href={`/${locale}/apps/kanban`} icon={<i className='tabler-copy' />}>
            Kanban
          </MenuItem>
          <SubMenu label="Invoice" icon={<i className='tabler-file-description' />}>
            <MenuItem href={`/${locale}/apps/invoice/list`}>List</MenuItem>
            <MenuItem
              href={`/${locale}/apps/invoice/preview/4987`}
              exactMatch={false}
              activeUrl='/apps/invoice/preview'
            >
              Preview
            </MenuItem>
            <MenuItem href={`/${locale}/apps/invoice/edit/4987`} exactMatch={false} activeUrl='/apps/invoice/edit'>
              Edit
            </MenuItem>
            <MenuItem href={`/${locale}/apps/invoice/add`}>Add</MenuItem>
          </SubMenu> */}
          {permissArray?.isSuperAdmin && (
            <SubMenu label="Role & Permission" icon={<i className="tabler-lock" />}>
              <MenuItem key="Role" href={`/${locale}/apps/roles`}>Roles</MenuItem>
              <MenuItem key="PermissionModule" href={`/${locale}/apps/permission-module`}>Permission module</MenuItem>
              <MenuItem key="Permission" href={`/${locale}/apps/permission`}>Permission</MenuItem>
              <MenuItem key="PackageType" href={`/${locale}/apps/package-type`}>Package type</MenuItem>
              <MenuItem key="Package" href={`/${locale}/apps/package`}>Package</MenuItem>
            </SubMenu>
          )}
          {permissArray?.isUser && (
            <>

              <MenuItem key="my_leads" href={`/${locale}/apps/leads`} icon={<i className='tabler-users'></i>}>
                Leads
              </MenuItem>
              <SubMenu label={"Follow Up"} icon={<i className="tabler-list"></i>}>

                <MenuItem href={`/${locale}/apps/follow-up/today`}>
                  Today
                </MenuItem>
                <MenuItem href={`/${locale}/apps/follow-up/tommorow`}>
                  Tommorow
                </MenuItem>
                <MenuItem href={`/${locale}/apps/follow-up/view-all`}>
                  View All
                </MenuItem>
              </SubMenu>
            </>
          )}
          {permissArray?.isCompany && (
            <MenuItem key="training_and_program" href={`/${locale}/apps/program`} icon={<i className="tabler-adjustments" />}>Training Program</MenuItem>
          )}
          {permissArray?.isCompany && permissArray?.hasRolePermission && (
            <MenuItem key="role_and_permission" href={`/${locale}/apps/role`} icon={<i className="tabler-lock" />}>Role & Permission</MenuItem>
          )}
          {permissArray?.isCompany && (permissArray?.hasZonePermission || permissArray?.hasRegionPermission || permissArray?.hasBranchPermission || permissArray?.hasChannelPermission || permissArray?.hasDepartmentPermission || permissArray?.hasDesignationPermission) && (
            <SubMenu label={dictionary['navigation']['manage-organization_plural']} icon={<i className='tabler-world' />}>
              {permissArray?.hasZonePermission && (
                <MenuItem href={`/${locale}/apps/zones`}>
                  {dictionary['navigation'].zone_plural}
                </MenuItem>
              )}
              {permissArray?.hasRegionPermission && (
                <MenuItem href={`/${locale}/apps/region`}>
                  {dictionary['navigation'].region_plural}
                </MenuItem>
              )}
              {permissArray?.hasBranchPermission && (
                <MenuItem href={`/${locale}/apps/branch`}>
                  {dictionary['navigation'].branch_plural}
                </MenuItem>
              )}
              {permissArray?.hasChannelPermission && (
                <MenuItem href={`/${locale}/apps/channels`}>
                  {dictionary['navigation'].channel_plural}
                </MenuItem>
              )}
              {permissArray?.hasDepartmentPermission && (
                <MenuItem href={`/${locale}/apps/departments`}>
                  {dictionary['navigation'].department_plural}
                </MenuItem>
              )}
              {permissArray?.hasDesignationPermission && (
                <MenuItem href={`/${locale}/apps/designations`}>
                  {dictionary['navigation'].designation_plural}
                </MenuItem>
              )}
              <MenuItem href={`/${locale}/apps/participation-types`}>
                Participation type
              </MenuItem>
            </SubMenu>
          )}
          {permissArray?.isSuperAdmin && (
            <MenuItem key={"company_listing"} href={`/${locale}/apps/company/list`} icon={<i className='tabler-user' />}>Company</MenuItem>
          )}
          {permissArray?.isCompany && permissArray?.hasUserPermission && (

            <MenuItem href={`/${locale}/apps/user/list`} icon={<i className='tabler-user' />}>{dictionary['navigation'].user_plural}</MenuItem>

          )}
          {permissArray?.isCompany && permissArray?.hasGroupPermission && (
            <MenuItem key="Groups" href={`/${locale}/apps/group`} icon={<i className="tabler-users" />}>Groups</MenuItem>
          )}
          {permissArray?.isCompany && permissArray?.hasGroupPermission && (
            <MenuItem key="Certificate" href={`/${locale}/apps/certificate`} icon={<i className="tabler-certificate" />}>Certificate</MenuItem>
          )}
          {permissArray?.isCompany && (
            <MenuItem key="download_center" href={`/${locale}/apps/download-center`} icon={<i className="tabler-download" />}>Download center</MenuItem>
          )}
          {permissArray?.isCompany && (
            <SubMenu label="Reports" icon={<i className="tabler-report" />}>
              <MenuItem key="completion_ratio_report" href={`/${locale}/apps/completion-ratio-report`}>Completion Ratio Report</MenuItem>
              <MenuItem key="quiz_assessment_report" href={`/${locale}/apps/quiz-assessment-report`}>Quiz Assessment Report</MenuItem>
              <MenuItem key="scorm_report" href={`/${locale}/apps/scorm-report`}>Scorm Report</MenuItem>
              <MenuItem key="login_report" href={`/${locale}/apps/login-report`}>Login Report</MenuItem>
              <MenuItem key="user_report" href={`/${locale}/apps/user-report`}>User Report</MenuItem>
              <MenuItem key="advance_training_report" href={`/${locale}/apps/advance-training-report`}>Advance Training Report</MenuItem>
              <MenuItem key="miscellaneous_report" href={`/${locale}/apps/miscellaneous-report`}>Miscellaneous Report</MenuItem>
            </SubMenu>
          )}
          {permissArray?.isSuperAdmin && (
            <MenuItem key="notification_listing" href={`/${locale}/apps/admin/notification`} icon={<i className="tabler-notification" />}>Notification</MenuItem>

          )}
          {((permissArray?.isCompany && permissArray?.hasLabelPermission) || permissArray?.isSuperAdmin) && (
            <SubMenu label="Settings" icon={<i className="tabler-settings" />}>
              {permissArray?.isSuperAdmin && (
                [
                  <MenuItem key="language" href={`/${locale}/apps/language`}>Language</MenuItem>,
                  <MenuItem key="terminology" href={`/${locale}/apps/terminology`}>Terminology</MenuItem>,
                ]
              )}
              {permissArray?.isCompany && permissArray?.hasLabelPermission && (
                <MenuItem href={`/${locale}/apps/label`}>Label</MenuItem>
              )}
              {permissArray?.isCompany && (
                <MenuItem href={`/${locale}/apps/notification`}>Notification</MenuItem>
              )}
            </SubMenu>
          )}
          {/* <SubMenu label={"Pages"} icon={<i className='tabler-file' />}>
            <MenuItem href={`/${locale}/pages/user-profile`}>user Profile</MenuItem>
            <MenuItem href={`/${locale}/pages/account-settings`}>Account Settings</MenuItem>
            <MenuItem href={`/${locale}/pages/faq`}>faq</MenuItem>
            <MenuItem href={`/${locale}/pages/pricing`}>pricing</MenuItem>
            <SubMenu label="miscellaneous">
              <MenuItem href={`/${locale}/pages/misc/coming-soon`} target='_blank'>
                Coming Soon
              </MenuItem>
              <MenuItem href={`/${locale}/pages/misc/under-maintenance`} target='_blank'>
                Under Maintenance
              </MenuItem>
              <MenuItem href={`/${locale}/pages/misc/404-not-found`} target='_blank'>
                Page Not Found 404
              </MenuItem>
              <MenuItem href={`/${locale}/pages/misc/401-not-authorized`} target='_blank'>
                Not Authorized 401
              </MenuItem>
            </SubMenu>
          </SubMenu>
          <SubMenu label="Auth Pages" icon={<i className='tabler-shield-lock' />}>
            <SubMenu label="Login">
              <MenuItem href={`/${locale}/pages/auth/login-v1`} target='_blank'>
                LoginV1
              </MenuItem>
              <MenuItem href={`/${locale}/pages/auth/login-v2`} target='_blank'>
                loginV2
              </MenuItem>
            </SubMenu>
            <SubMenu label={dictionary['navigation'].register}>
              <MenuItem href={`/${locale}/pages/auth/register-v1`} target='_blank'>
                {dictionary['navigation'].registerV1}
              </MenuItem>
              <MenuItem href={`/${locale}/pages/auth/register-v2`} target='_blank'>
                {dictionary['navigation'].registerV2}
              </MenuItem>
              <MenuItem href={`/${locale}/pages/auth/register-multi-steps`} target='_blank'>
                {dictionary['navigation'].registerMultiSteps}
              </MenuItem>
            </SubMenu>
            <SubMenu label={dictionary['navigation'].verifyEmail}>
              <MenuItem href={`/${locale}/pages/auth/verify-email-v1`} target='_blank'>
                {dictionary['navigation'].verifyEmailV1}
              </MenuItem>
              <MenuItem href={`/${locale}/pages/auth/verify-email-v2`} target='_blank'>
                {dictionary['navigation'].verifyEmailV2}
              </MenuItem>
            </SubMenu>
            <SubMenu label={dictionary['navigation'].forgotPassword}>
              <MenuItem href={`/${locale}/pages/auth/forgot-password-v1`} target='_blank'>
                {dictionary['navigation'].forgotPasswordV1}
              </MenuItem>
              <MenuItem href={`/${locale}/pages/auth/forgot-password-v2`} target='_blank'>
                {dictionary['navigation'].forgotPasswordV2}
              </MenuItem>
            </SubMenu>
            <SubMenu label={dictionary['navigation'].resetPassword}>
              <MenuItem href={`/${locale}/pages/auth/reset-password-v1`} target='_blank'>
                {dictionary['navigation'].resetPasswordV1}
              </MenuItem>
              <MenuItem href={`/${locale}/pages/auth/reset-password-v2`} target='_blank'>
                {dictionary['navigation'].resetPasswordV2}
              </MenuItem>
            </SubMenu>
            <SubMenu label={dictionary['navigation'].twoSteps}>
              <MenuItem href={`/${locale}/pages/auth/two-steps-v1`} target='_blank'>
                {dictionary['navigation'].twoStepsV1}
              </MenuItem>
              <MenuItem href={`/${locale}/pages/auth/two-steps-v2`} target='_blank'>
                {dictionary['navigation'].twoStepsV2}
              </MenuItem>
            </SubMenu>
          </SubMenu>
          <SubMenu label={dictionary['navigation'].wizardExamples} icon={<i className='tabler-dots' />}>
            <MenuItem href={`/${locale}/pages/wizard-examples/checkout`}>{dictionary['navigation'].checkout}</MenuItem>
            <MenuItem href={`/${locale}/pages/wizard-examples/property-listing`}>
              {dictionary['navigation'].propertyListing}
            </MenuItem>
            <MenuItem href={`/${locale}/pages/wizard-examples/create-deal`}>
              {dictionary['navigation'].createDeal}
            </MenuItem>
          </SubMenu>
          <MenuItem href={`/${locale}/pages/dialog-examples`} icon={<i className='tabler-square' />}>
            {dictionary['navigation'].dialogExamples}
          </MenuItem>
          <SubMenu label={dictionary['navigation'].widgetExamples} icon={<i className='tabler-chart-bar' />}>
            <MenuItem href={`/${locale}/pages/widget-examples/basic`}>{dictionary['navigation'].basic}</MenuItem>
            <MenuItem href={`/${locale}/pages/widget-examples/advanced`}>{dictionary['navigation'].advanced}</MenuItem>
            <MenuItem href={`/${locale}/pages/widget-examples/statistics`}>
              {dictionary['navigation'].statistics}
            </MenuItem>
            <MenuItem href={`/${locale}/pages/widget-examples/charts`}>{dictionary['navigation'].charts}</MenuItem>
            <MenuItem href={`/${locale}/pages/widget-examples/actions`}>{dictionary['navigation'].actions}</MenuItem>
          </SubMenu> */}
        </MenuSection>
        {/* <MenuSection label={dictionary['navigation'].formsAndTables}>
          <MenuItem href={`/${locale}/forms/form-layouts`} icon={<i className='tabler-layout' />}>
            {dictionary['navigation'].formLayouts}
          </MenuItem>
          <MenuItem href={`/${locale}/forms/form-validation`} icon={<i className='tabler-checkup-list' />}>
            {dictionary['navigation'].formValidation}
          </MenuItem>
          <MenuItem href={`/${locale}/forms/form-wizard`} icon={<i className='tabler-git-merge' />}>
            {dictionary['navigation'].formWizard}
          </MenuItem>
          <MenuItem href={`/${locale}/react-table`} icon={<i className='tabler-table' />}>
            {dictionary['navigation'].reactTable}
          </MenuItem>
          <MenuItem
            icon={<i className='tabler-checkbox' />}
            href={`${process.env.NEXT_PUBLIC_DOCS_URL}/docs/user-interface/form-elements`}
            suffix={<i className='tabler-external-link text-xl' />}
            target='_blank'
          >
            {dictionary['navigation'].formELements}
          </MenuItem>
          <MenuItem
            icon={<i className='tabler-layout-board-split' />}
            href={`${process.env.NEXT_PUBLIC_DOCS_URL}/docs/user-interface/mui-table`}
            suffix={<i className='tabler-external-link text-xl' />}
            target='_blank'
          >
            {dictionary['navigation'].muiTables}
          </MenuItem>
        </MenuSection>
        <MenuSection label={dictionary['navigation'].chartsMisc}>
          <SubMenu label={dictionary['navigation'].charts} icon={<i className='tabler-chart-donut-2' />}>
            <MenuItem href={`/${locale}/charts/apex-charts`}>{dictionary['navigation'].apex}</MenuItem>
            <MenuItem href={`/${locale}/charts/recharts`}>{dictionary['navigation'].recharts}</MenuItem>
          </SubMenu>
          <MenuItem
            icon={<i className='tabler-cards' />}
            href={`${process.env.NEXT_PUBLIC_DOCS_URL}/docs/user-interface/foundation`}
            suffix={<i className='tabler-external-link text-xl' />}
            target='_blank'
          >
            {dictionary['navigation'].foundation}
          </MenuItem>
          <MenuItem
            icon={<i className='tabler-atom' />}
            href={`${process.env.NEXT_PUBLIC_DOCS_URL}/docs/user-interface/components`}
            suffix={<i className='tabler-external-link text-xl' />}
            target='_blank'
          >
            {dictionary['navigation'].components}
          </MenuItem>
          <MenuItem
            icon={<i className='tabler-list-search' />}
            href={`${process.env.NEXT_PUBLIC_DOCS_URL}/docs/menu-examples/overview`}
            suffix={<i className='tabler-external-link text-xl' />}
            target='_blank'
          >
            {dictionary['navigation'].menuExamples}
          </MenuItem>
          <MenuItem
            icon={<i className='tabler-lifebuoy' />}
            suffix={<i className='tabler-external-link text-xl' />}
            target='_blank'
            href='https://pixinvent.ticksy.com'
          >
            {dictionary['navigation'].raiseSupport}
          </MenuItem>
          <MenuItem
            icon={<i className='tabler-book-2' />}
            suffix={<i className='tabler-external-link text-xl' />}
            target='_blank'
            href={`${process.env.NEXT_PUBLIC_DOCS_URL}`}
          >
            {dictionary['navigation'].documentation}
          </MenuItem>
          <SubMenu label={dictionary['navigation'].others} icon={<i className='tabler-box' />}>
            <MenuItem suffix={<CustomChip label='New' size='small' color='info' round='true' />}>
              {dictionary['navigation'].itemWithBadge}
            </MenuItem>
            <MenuItem
              href='https://pixinvent.com'
              target='_blank'
              suffix={<i className='tabler-external-link text-xl' />}
            >
              {dictionary['navigation'].externalLink}
            </MenuItem>
            <SubMenu label={dictionary['navigation'].menuLevels}>
              <MenuItem>{dictionary['navigation'].menuLevel2}</MenuItem>
              <SubMenu label={dictionary['navigation'].menuLevel2}>
                <MenuItem>{dictionary['navigation'].menuLevel3}</MenuItem>
                <MenuItem>{dictionary['navigation'].menuLevel3}</MenuItem>
              </SubMenu>
            </SubMenu>
            <MenuItem disabled>{dictionary['navigation'].disabledMenu}</MenuItem>
          </SubMenu>
        </MenuSection> */}
      </Menu>
    </ScrollWrapper >
  )
}

export default VerticalMenu
