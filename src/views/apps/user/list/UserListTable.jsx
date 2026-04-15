'use client'

// -------------------- React Imports --------------------
import { useEffect, useState, useMemo } from 'react';

// -------------------- Next.js Imports --------------------
import { useRouter, useParams } from 'next/navigation';

// -------------------- MUI Imports --------------------
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Checkbox from '@mui/material/Checkbox';
import TablePagination from '@mui/material/TablePagination';
import MenuItem from '@mui/material/MenuItem';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';

// -------------------- External Libraries --------------------
import { toast } from 'react-toastify';
import classnames from 'classnames';
import { rankItem } from '@tanstack/match-sorter-utils';

// -------------------- React Table Imports --------------------
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  getPaginationRowModel,
  getSortedRowModel
} from '@tanstack/react-table';

// -------------------- Dialog & View Components --------------------
import UpdatePasswordDialog from '@components/dialogs/user/update-password-dialog/page';
import DeleteUserDialog from '@components/dialogs/user/delete-user-dialog/page';
import ManageEmpCodeDialog from '@/components/dialogs/user/manage-emp-code-dialog/index';
import ImportUsers from '../../../../views/apps/user/import/ImportUsers';

// -------------------- Local/Custom Components --------------------
import OptionMenu from '@core/components/option-menu';
import TablePaginationComponent from '@components/TablePaginationComponent';
import CustomTextField from '@core/components/mui/TextField';
import CustomAvatar from '@core/components/mui/Avatar';

// -------------------- Utilities --------------------
import { getInitials } from '@/utils/getInitials';
import { useApi } from '../../../../utils/api';

// -------------------- Styles --------------------
import tableStyles from '@core/styles/table.module.css';

import { usePermissionList } from '@/utils/getPermission';

const fuzzyFilter = (row, columnId, value, addMeta) => {
  // Rank the item
  const itemRank = rankItem(row.getValue(columnId), value)

  // Store the itemRank info
  addMeta({
    itemRank
  })

  // Return if the item should be filtered in/out
  return itemRank.passed
}

const DebouncedInput = ({ value: initialValue, onChange, debounce = 500, ...props }) => {
  // States
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])
  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value)
    }, debounce)

    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return <CustomTextField {...props} value={value} onChange={e => setValue(e.target.value)} />
}

// Column Definitions
const columnHelper = createColumnHelper()

const UserListTable = ({ userData, loadData, setIsUserCardShow, getStatsCount }) => {
  // States
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [open, setOpen] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [openManageEmpCodeDialog, setManageEmpCodeDialog] = useState(false)
  const [openImportWindow, setOpenImportWindow] = useState(false)
  const [user, setUser] = useState()
  const { doPostFormData } = useApi();
  const public_url = process.env.NEXT_PUBLIC_ASSETS_URL;

  const router = useRouter();

  const getPermissions = usePermissionList();
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

  const updateNewPasswordhandle = (row) => {
    setUser(row);
    setOpen(true);
  }

  const handleManageEmpDialog = (row) => {
    setUser(row);
    setManageEmpCodeDialog(true);
  }

  const openDeleteDialogHandle = (row) => {
    setUser(row);
    setOpenDeleteDialog(true)
  }

  const handleImportDialog = (row) => {
    setOpenImportWindow(true)
    setIsUserCardShow(false)
  }

  const onBack = () => {
    setOpenImportWindow(false);
    setIsUserCardShow(true)
    loadData();
    getStatsCount();
  }

  const handleStatusChange = async (userId, status) => {
    const endpoint = `admin/user/status/update/${userId}`;

    await doPostFormData({
      endpoint,
      values: { status: status },
      method: 'PUT',
      onSuccess: (response) => {
        toast.success(response.message, { autoClose: 2000 });
        getStatsCount();
      },
      onError: (error) => {

      }
    });
  };

  useEffect(() => {
    if (userData) {
      setData(userData);
      setFilteredData(userData);
    }
  }, [userData])

  // Hooks
  const { lang: locale } = useParams()

  const columns = useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            {...{
              checked: table.getIsAllRowsSelected(),
              indeterminate: table.getIsSomeRowsSelected(),
              onChange: table.getToggleAllRowsSelectedHandler()
            }}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            {...{
              checked: row.getIsSelected(),
              disabled: !row.getCanSelect(),
              indeterminate: row.getIsSomeSelected(),
              onChange: row.getToggleSelectedHandler()
            }}
          />
        )
      },
      columnHelper.accessor('first_name', {
        header: 'User',
        cell: ({ row }) => (
          <div className='flex items-center gap-4'>
            {getAvatar({ avatar: row.original.photo, fullName: row.original.first_name + " " + row.original.last_name })}
            <div className='flex flex-col'>
              <Typography color='text.primary' className='font-medium'>
                {row.original.first_name + " " + row.original.last_name}
              </Typography>
              <Typography variant='body2'>{row.original.email}</Typography>
            </div>
          </div>
        )
      }),
      columnHelper.accessor('designation', {
        header: 'Designation',
        cell: ({ row }) => <Typography>{row.original.designation_id.name}</Typography>
      }),
      columnHelper.accessor('roles', {
        header: 'Role',
        cell: ({ row }) => {
          
          const roles = row.original.roles || []

          return (
            <div className="flex flex-wrap gap-1">
              {roles.length > 0 ? (
                roles.map((r) => (
                  <Typography
                    key={r._id}
                    variant="body2"
                    className="bg-gray-100 text-gray-800 px-2 py-1 rounded-md"
                  >
                    {r.role_id?.name || 'N/A'}
                  </Typography>
                ))
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No Roles
                </Typography>
              )}
            </div>
          )
        }
      }),
      columnHelper.accessor('phone', {
        header: 'Phone',
        cell: ({ row }) => <Typography>{row.original.phone}</Typography>
      }),
      columnHelper.accessor('address', {
        header: 'Address',
        cell: ({ row }) => <Typography>{row.original.address}</Typography>
      }),
      columnHelper.accessor('role', {
        header: 'Role',
        cell: ({ row }) => <Typography>{row.original.role}</Typography>
      }),
      columnHelper.accessor('emp_id', {
        header: 'Employee ID',
        cell: ({ row }) => <Typography>{row.original.emp_id}</Typography>
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: ({ row }) => (
          <div className='flex items-center gap-3'>
            <FormControlLabel control={
              <Switch
                defaultChecked={row.original.status}
                color="success"
                onChange={(e) => {
                  handleStatusChange(row.original.id, e.target.checked);
                }}
                size="medium" />} />
            {/* <Chip
              variant='tonal'
              label={row.original.status ? "Active" : "Inactive"}
              size='small'
              color={userStatusObj[row.original.status ? "active" : "inactive"]}
              className='capitalize'
            /> */}
          </div>
        )
      }),
      columnHelper.display({
        id: 'action',
        header: 'Action',
        cell: ({ row }) => (
          <div className='flex items-center'>
            <OptionMenu
              iconButtonProps={{ size: 'medium' }}
              iconClassName='text-textSecondary'
              options={[
                permissions?.hasUserEditPermission && {
                  text: 'Edit account',
                  icon: 'tabler-edit',
                  menuItemProps: {
                    className: 'flex items-center gap-2 text-textSecondary',
                    onClick: () => {
                      router.push(`/${locale}/apps/user/form/${row.original._id}`)
                    }
                  }
                },
                {
                  text: 'Update password',
                  icon: 'tabler-lock',
                  menuItemProps: {
                    className: 'flex items-center gap-2 text-textSecondary',
                    onClick: () => {
                      updateNewPasswordhandle(row.original)
                    }
                  }
                },
                {
                  text: 'Manage employee ID',
                  icon: 'tabler-user',
                  menuItemProps: {
                    className: 'flex items-center gap-2 text-textSecondary',
                    onClick: () => {
                      handleManageEmpDialog(row.original)
                    }
                  }
                },
                {
                  text: 'Delete account',
                  icon: 'tabler-trash',
                  menuItemProps: {
                    className: 'flex items-center gap-2 text-textSecondary',
                    onClick: () => {
                      openDeleteDialogHandle(row.original)
                    }
                  }
                }
              ].filter(Boolean)}
            />
          </div>
        ),
        enableSorting: false
      })

    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, filteredData, permissions]
  )

  const table = useReactTable({
    data: filteredData,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter
    },
    state: {
      rowSelection,
      globalFilter
    },
    initialState: {
      pagination: {
        pageSize: 10
      }
    },
    enableRowSelection: true, //enable row selection for all rows
    // enableRowSelection: row => row.original.age > 18, // or enable row selection conditionally per row
    globalFilterFn: fuzzyFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues()
  })

  const getAvatar = params => {
    const { avatar, fullName } = params

    if (avatar) {
      return <CustomAvatar src={`${public_url}/${avatar}`} size={34} />
    } else {
      return <CustomAvatar size={34}>{getInitials(fullName)}</CustomAvatar>
    }
  }

  return (
    <>
      {openImportWindow ? (
        <ImportUsers batch={[]} onBack={onBack} />
      ) : (
        <Card >
          {/* <CardHeader title='Filters' className='pbe-4' /> */}
          {/* <TableFilters setData={setFilteredData} tableData={data} /> */}
          <div className='flex justify-between flex-col items-start md:flex-row md:items-center p-6 border-bs gap-4'>
            <CustomTextField
              select
              value={table.getState().pagination.pageSize}
              onChange={e => table.setPageSize(Number(e.target.value))}
              className='max-sm:is-full sm:is-[70px]'
            >
              <MenuItem value='10'>10</MenuItem>
              <MenuItem value='25'>25</MenuItem>
              <MenuItem value='50'>50</MenuItem>
            </CustomTextField>
            <div className='flex flex-col sm:flex-row max-sm:is-full items-start sm:items-center gap-4'>
              <DebouncedInput
                value={globalFilter ?? ''}
                onChange={value => setGlobalFilter(String(value))}
                placeholder='Search User'
                className='max-sm:is-full'
              />
              {permissions && permissions?.['hasUserImportPermission'] && (
                <Button
                  variant='tonal'
                  startIcon={<i className='tabler-upload' />}
                  className='max-sm:is-full'
                  onClick={() => handleImportDialog()}
                >
                  Import
                </Button>
              )}

              {permissions && permissions['hasUserAddPermission'] && (
                <Button
                  variant='contained'
                  startIcon={<i className='tabler-plus' />}
                  onClick={() => router.push(`/${locale}/apps/user/form`)}
                  className='max-sm:is-full'
                >
                  Add New User
                </Button>
              )}

            </div>
          </div>
          <div className='overflow-x-auto'>
            <table className={tableStyles.table}>
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th key={header.id}>
                        {header.isPlaceholder ? null : (
                          <>
                            <div
                              className={classnames({
                                'flex items-center': header.column.getIsSorted(),
                                'cursor-pointer select-none': header.column.getCanSort()
                              })}
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {{
                                asc: <i className='tabler-chevron-up text-xl' />,
                                desc: <i className='tabler-chevron-down text-xl' />
                              }[header.column.getIsSorted()] ?? null}
                            </div>
                          </>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              {table.getFilteredRowModel().rows.length === 0 ? (
                <tbody>
                  <tr>
                    <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                      No data available
                    </td>
                  </tr>
                </tbody>
              ) : (
                <tbody>
                  {table
                    .getRowModel()
                    .rows.slice(0, table.getState().pagination.pageSize)
                    .map(row => {
                      return (
                        <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                          {row.getVisibleCells().map(cell => (
                            <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                          ))}
                        </tr>
                      )
                    })}
                </tbody>
              )}
            </table>
          </div>
          <TablePagination
            component={() => <TablePaginationComponent table={table} />}
            count={table.getFilteredRowModel().rows.length}
            rowsPerPage={table.getState().pagination.pageSize}
            page={table.getState().pagination.pageIndex}
            onPageChange={(_, page) => {
              table.setPageIndex(page)
            }}
          />
          <UpdatePasswordDialog open={open} setOpen={setOpen} data={user} />
          <DeleteUserDialog open={openDeleteDialog} setOpen={setOpenDeleteDialog} type='delete-account' user={user} loadData={loadData} />
          <ManageEmpCodeDialog open={openManageEmpCodeDialog} setOpen={setManageEmpCodeDialog} user={user} loadData={loadData} />
        </Card>
      )}
    </>
  )
}

export default UserListTable
