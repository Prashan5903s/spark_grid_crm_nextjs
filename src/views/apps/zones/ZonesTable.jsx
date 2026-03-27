'use client'

// React Imports
import { useState, useMemo, useEffect } from 'react'

// Next Imports
import { useParams } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import MenuItem from '@mui/material/MenuItem'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import Checkbox from '@mui/material/Checkbox'
import IconButton from '@mui/material/IconButton'

// Third-party Imports
import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'
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
} from '@tanstack/react-table'

// Component Imports
import OptionMenu from '@core/components/option-menu'
import CustomTextField from '@core/components/mui/TextField'
import TablePaginationComponent from '@components/TablePaginationComponent'

// Style Imports
import tableStyles from '@core/styles/table.module.css'
import ZoneDialog from '@/components/dialogs/zone-dialog/page'
import RegionDialog from '@/components/dialogs/region-dialog/page'
import { usePermissionList } from '@/utils/getPermission'

// Filter function
const fuzzyFilter = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)

  addMeta({ itemRank })

  return itemRank.passed

}

// Debounced Input
const DebouncedInput = ({ value: initialValue, onChange, debounce = 500, ...props }) => {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value)
    }, debounce)

    return () => clearTimeout(timeout)

  }, [value])

  return <CustomTextField {...props} value={value} onChange={e => setValue(e.target.value)} />

}

const columnHelper = createColumnHelper()

// States
const ZonesTable = ({ tableData, fetchZoneData }) => {
  const [role, setRole] = useState('')
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [openZoneDialog, setOpenZoneDialog] = useState(false)
  const [selectedZone, setSelectedZone] = useState(null)
  const [selectedRegion, setSelectedRegion] = useState(null)

  const { lang: locale } = useParams()

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

  useEffect(() => {
    if (tableData) {
      setData(tableData)
      setFilteredData(tableData)
    }
  }, [tableData])

  // Role filter effect
  useEffect(() => {
    const filtered = data.filter(user => {
      if (role && user.role !== role) return false

      return true
    })

    setFilteredData(filtered)
  }, [role, data])

  const columns = useMemo(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllRowsSelected()}
          indeterminate={table.getIsSomeRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          indeterminate={row.getIsSomeSelected()}
          onChange={row.getToggleSelectedHandler()}
        />
      )
    },
    columnHelper.accessor('name', {
      header: 'Zone Name',
      cell: ({ row }) => (
        <Typography className='capitalize' color='text.primary'>
          {row.original.name}
        </Typography>
      )
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: ({ row }) => (
        <Chip
          label={row.original.status ? 'Active' : 'Inactive'}
          color={row.original.status ? 'success' : 'default'}
          variant='tonal'
          size='small'
        />
      )
    }),
    columnHelper.accessor('action', {
      header: 'Actions',
      cell: ({ row }) => (
        <div className='flex items-center'>
          {permissions && permissions?.['hasRegionAddPermission'] && (
            <IconButton
              onClick={() => {
                setSelectedRegion(row.original) // or {}
                setOpenZoneDialog(true)
              }}
            >
              <i className='tabler-plus text-primary' />
            </IconButton>
          )}
          {permissions && permissions?.['hasZoneEditPermission'] && (
            <IconButton
              onClick={() => {
                setSelectedZone(row.original)
                setOpenDialog(true)
              }}
            >
              <i className='tabler-edit text-textSecondary' />
            </IconButton>
          )}
        </div>
      ),
      enableSorting: false
    })
  ], [permissions])

  const table = useReactTable({
    data: filteredData,
    columns,
    filterFns: { fuzzy: fuzzyFilter },
    state: { rowSelection, globalFilter },
    initialState: { pagination: { pageSize: 10 } },
    enableRowSelection: true,
    globalFilterFn: fuzzyFilter,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues()
  })

  return (
    <Card>
      <CardContent className='flex justify-between flex-col gap-4 items-start sm:flex-row sm:items-center'>
        <div className='flex items-center gap-2'>
          <Typography>Show</Typography>
          <CustomTextField
            select
            value={table.getState().pagination.pageSize}
            onChange={e => table.setPageSize(Number(e.target.value))}
            className='max-sm:is-full sm:is-[70px]'
          >
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={25}>25</MenuItem>
            <MenuItem value={50}>50</MenuItem>
          </CustomTextField>
        </div>
        <div className='flex gap-4 flex-col !items-start max-sm:is-full sm:flex-row sm:items-center'>
          <DebouncedInput
            value={globalFilter ?? ''}
            className='max-sm:is-full min-is-[250px]'
            onChange={value => setGlobalFilter(String(value))}
            placeholder='Search Role'
          />
          <CustomTextField
            select
            value={role}
            onChange={e => setRole(e.target.value)}
            id='roles-app-role-select'
            className='max-sm:is-full sm:is-[160px]'
            slotProps={{ select: { displayEmpty: true } }}
          >
            <MenuItem value=''>Select Role</MenuItem>
            {tableData.map((item, index) => {
              return (
                <MenuItem key={index} value={item._id}>
                  {item.name}
                </MenuItem>
              );
            })}
          </CustomTextField>
        </div>
      </CardContent>

      <div className='overflow-x-auto'>
        <table className={tableStyles.table}>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id}>
                    {header.isPlaceholder ? null : (
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
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getFilteredRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                  No data available
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <TablePaginationComponent table={table} />

      {/* Role Dialog */}
      {openDialog && (
        <ZoneDialog
          open={openDialog}
          setOpen={setOpenDialog}
          selectedZone={selectedZone}
          fetchZoneData={fetchZoneData}
          tableData={tableData}
        />
      )}

      {openZoneDialog && (
        <RegionDialog
          typeForm={true}
          open={openZoneDialog}
          setOpen={setOpenZoneDialog}
          selectZone={selectedZone}
          selectedRegion={selectedRegion}
          fetchRegionData={fetchZoneData}
        />
      )}
    </Card>
  )
}

export default ZonesTable
