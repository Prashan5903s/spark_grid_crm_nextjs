'use client'

// React Imports
import { useState, useMemo, useEffect } from 'react'

// MUI Imports
import { Card, CardContent, MenuItem, Button, Typography, Checkbox, IconButton, Chip } from '@mui/material'

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
import CustomTextField from '@core/components/mui/TextField'
import TablePaginationComponent from '@components/TablePaginationComponent'
import LeadDialog from '@components/dialogs/leads-dialog/page'
import ProposalDialog from '@/components/dialogs/proposal-dialog/page'
import FollowUpTableDialog from '@/components/dialogs/follow_up_table_dialog/page'
import FollowUpDialog from '@/components/dialogs/follow-up-dialog/page'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

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

const LeadTable = ({ tableData, fetchLeadsData }) => {

  const [rowSelection, setRowSelection] = useState({})
  const [filteredData, setFilteredData] = useState([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedLead, setSelectedLead] = useState(null)

  const [openTableDialog, setOpenTableDialog] = useState(false)
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false)

  const [openFollowUpModal, setFollowUpModal] = useState(false)
  const [selectedLeadId, setSelectedLeadId] = useState();

  const getPermissions = usePermissionList();
  const [permissions, setPermissions] = useState({});

  useEffect(() => {
    if (tableData) {

      setFilteredData(tableData)
    }
  }, [tableData])

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
  }, [getPermissions]);

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
    columnHelper.accessor('company_name', {
      header: 'Company Name',
      cell: ({ row }) => (
        <Typography className='capitalize' color='text.primary'>
          {row.original.company_name}
        </Typography>
      )
    }),
    columnHelper.accessor('name', {
      header: 'Name',
      cell: ({ row }) => (
        <Typography className='capitalize' color='text.primary'>
          {row.original.name}
        </Typography>
      )
    }),
    columnHelper.accessor('email', {
      header: 'Email',
      cell: ({ row }) => (
        <Typography variant='body2' color='text.secondary'>
          {row.original.email}
        </Typography>
      )
    }),
    columnHelper.accessor('phone', {
      header: 'Phone',
      cell: ({ row }) => (
        <Typography variant='body2' color='text.secondary'>
          {row.original.phone}
        </Typography>
      )
    }),
    columnHelper.accessor('follow_up', {
      header: 'Follow Up',
      cell: ({ row }) => {
        return (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>

            {/* Add Icon */}
            <i
              className='tabler-plus cursor-pointer icon-btn'
              onClick={() => {

                setSelectedLead(row?.original)
                setSelectedLeadId(row?.original?._id)
                setFollowUpModal(true)
              }}
            />

            {/* View Icon */}
            <i
              className='tabler-eye cursor-pointer icon-btn'
              onClick={() => {

                setSelectedLead(row?.original)
                setSelectedLeadId(row?.original?._id)
                setOpenTableDialog(true)
              }}
            />
            <Typography>{row?.original?.followUp?.length} FollowUp</Typography>
          </div>
        )
      }
    }),
    columnHelper.accessor('proposal', {
      header: 'Send Proposal',
      cell: ({ row }) => {
        return (
          <div style={{ display: 'flex', justifyContent: "center", gap: '10px', alignItems: 'center' }}>

            {/* Add Icon */}
            <i
              className='tabler-send cursor-pointer icon-btn'
              onClick={() => {

                setSelectedLeadId(row?.original?._id)
                setSelectedLead(row?.original)
                setIsProposalModalOpen(true)
              }}
            />
          </div>
        )
      }
    }),
    columnHelper.accessor('average_monthly_consumption', {
      header: 'Average Monthly Consumption',
      cell: ({ row }) => (
        <Typography variant='body2' color='text.secondary'>
          {row.original.average_monthly_consumption}
        </Typography>
      )
    }),
    columnHelper.accessor('sanctioned_load', {
      header: 'Sanctioned Load',
      cell: ({ row }) => (
        <Typography variant='body2' color='text.secondary'>
          {row.original.sanctioned_load}
        </Typography>
      )
    }),
    columnHelper.accessor('lead_status', {
      header: 'Status',
      cell: ({ row }) => (
        <Typography variant='body2' color='text.secondary'>
          {row.original?.lead_status?.status.title}
        </Typography>
      )
    }),
    columnHelper.accessor('action', {
      header: 'Actions',
      cell: ({ row }) => (
        <div className='flex items-center'>
          {(
            <IconButton
              onClick={() => {
                setSelectedLead(row.original)
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
          <Button variant='contained' size='lg' onClick={() => {
            setOpenDialog(true)
            setSelectedLead()
          }}>
            Add Lead
          </Button>
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
        <LeadDialog
          tableData={tableData}
          open={openDialog}
          setOpen={setOpenDialog}
          selectedLead={selectedLead}
          fetchLeadsData={fetchLeadsData}
          permissionArr={permissions}
        />
      )}
      {
        openFollowUpModal && (
          <FollowUpDialog
            tableData={tableData}
            open={openFollowUpModal}
            selectedLeadId={selectedLeadId}
            selectedLead={selectedLead}
            fetchLeadsData={fetchLeadsData}
            setOpen={setFollowUpModal}
          />
        )
      }
      {
        openTableDialog && (
          <FollowUpTableDialog
            tableData={selectedLead}
            open={openTableDialog}
            setOpen={setOpenTableDialog}
            selectedLeadId={selectedLeadId}
          />
        )
      }
      {
        isProposalModalOpen && (
          <ProposalDialog
            open={isProposalModalOpen}
            setOpen={setIsProposalModalOpen}
            selectLeadId={selectedLeadId}
            selectedLead={selectedLead}
          />
        )
      }
    </Card>
  )
}

export default LeadTable
