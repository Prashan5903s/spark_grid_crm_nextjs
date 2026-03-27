'use client'

// React Imports

import React, { useState, useMemo, useEffect, useCallback } from 'react'

import { useSession } from 'next-auth/react'

// MUI Imports
import {
  Card,
  CardContent,
  MenuItem,
  Typography,
  TextField,
  Button
} from '@mui/material'

// Third-party Imports
import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getSortedRowModel
} from '@tanstack/react-table'

import { toast } from 'react-toastify'

// Component Imports
import LabelDialog from '@components/dialogs/label-dialog/page'

// Styles
import tableStyles from '@core/styles/table.module.css'

import CustomTextField from '@core/components/mui/TextField'

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

const LabelTable = ({ tableData, fetchLanguageData }) => {
  const [rowSelection, setRowSelection] = useState({})
  const [showErrors, setShowErrors] = useState(false)
  const [filteredData, setFilteredData] = useState([])
  const [hasFormError, setHasErrorForm] = useState(false)
  const [globalFilter, setGlobalFilter] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState(null)

  const url = process.env.NEXT_PUBLIC_API_URL
  const { data: session } = useSession()
  const token = session?.user?.token

  useEffect(() => {
    if (tableData?.menu) {
      const menuWithLangValues = tableData.menu.map(row => {
        if (!row.language_values?.length && row.default_translation?.length) {
          return { ...row, language_values: JSON.parse(JSON.stringify(row.default_translation)) }
        }

        return row
      })

      setFilteredData(menuWithLangValues)
    }
  }, [tableData])

  const handleLanguageChange = useCallback((rowIndex, langId, type, value) => {
    setFilteredData(prev => {
      const updated = [...prev]
      const row = { ...updated[rowIndex] }

      const existing = row.language_values ? [...row.language_values] : []

      const index = existing.findIndex(
        item => item.language_id === langId && item.type === type
      )

      const newEntry = { language_id: langId, type, translation: value }

      if (index !== -1) {
        existing[index] = newEntry
      } else {
        existing.push(newEntry)
      }

      row.language_values = existing
      updated[rowIndex] = row

      return updated
    })
  }, [])

  const hasEmptyTranslation = row => {
    const values = row.language_values ?? []

    return [1, 2].some(type => {
      const entry = values.find(v => v.type === type)

      return !entry || !entry.translation?.trim()
    })
  }

  const handleMenuSubmit = () => {
    setShowErrors(true)

    const updatedFilteredData = filteredData.map(row => {

      const values = row.language_values ?? []

      return {
        ...row,
        language_values: values.filter(v => v.translation?.trim())
      }
    })

    const hasError = filteredData.some(row => {
      const values = row.language_values ?? []
      const languageLength = tableData.language.length * 2
      const valueLength = values.length

      if (valueLength !== languageLength) {
        return true
      }

      return values.some(item => item.translation?.trim() === '')
    })

    setHasErrorForm(hasError)

    if (hasError) return

    const updatedData = updatedFilteredData
      .map(row => {
        if (hasEmptyTranslation(row)) return null

        return {
          label_id: row._id,
          language_values: row.language_values
        }
      })
      .filter(Boolean)

    if (!updatedData.length) return

    handleFormSubmit(updatedData)
  }

  const handleFormSubmit = async updatedData => {
    try {
      const response = await fetch(`${url}/company/terminology/app/menu`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedData)
      })

      const data = await response.json()

      if (response.ok) {

        fetchLanguageData()
        toast.success(`App menu updated successfully!`, {
          autoClose: 700
        })
      }
    } catch (error) {
      console.error('Error occurred', error)
    }
  }

  const handleMenuDiscard = () => {
    if (tableData?.menu) {
      const menuWithLangValues = tableData.menu.map(row => {
        if (!row.language_values?.length && row.default_translation?.length) {
          return { ...row, language_values: JSON.parse(JSON.stringify(row.default_translation)) }
        }

        return row
      })

      setFilteredData(menuWithLangValues)
      setShowErrors(false)
    }
  }

  useEffect(() => {
    if (!showErrors || !filteredData?.length) {
      setHasErrorForm(false)

      return
    }

    const hasError = filteredData.some(hasEmptyTranslation)

    setHasErrorForm(hasError)
  }, [showErrors, filteredData])

  const columns = useMemo(() => {
    if (!tableData?.language) return []

    const baseColumns = [
      columnHelper.accessor('label_name', {
        header: 'Label Name',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary'>
            {row.original.label_name}
          </Typography>
        )
      })
    ]

    const languageColumns = tableData.language.map(lang =>
      columnHelper.accessor(`language_values.${lang._id}`, {
        id: `language-${lang._id}`,
        header: lang.language_name,
        cell: ({ row }) => {
          const rowIndex = row.index
          const translations = row.original.language_values ?? []

          const getValue = type =>
            translations.find(v => v.language_id === lang._id && v.type === type)?.translation || ''

          const singular = getValue(1)
          const plural = getValue(2)

          const singularError = showErrors && singular.trim() === ''
          const pluralError = showErrors && plural.trim() === ''

          return (
            <div className='flex flex-col gap-2'>
              <TextField
                label='Singular'
                size='small'
                required
                value={singular}
                onChange={e => handleLanguageChange(rowIndex, lang._id, 1, e.target.value)}
                error={singularError}
                helperText={singularError ? 'Singular is required' : ''}
              />
              <TextField
                label='Plural'
                size='small'
                required
                value={plural}
                onChange={e => handleLanguageChange(rowIndex, lang._id, 2, e.target.value)}
                error={pluralError}
                helperText={pluralError ? 'Plural is required' : ''}
              />
            </div>
          )
        }
      })
    )

    return [...baseColumns, ...languageColumns]
  }, [tableData?.language, handleLanguageChange, showErrors])

  const table = useReactTable({
    data: filteredData,
    columns,
    filterFns: { fuzzy: fuzzyFilter },
    state: { rowSelection, globalFilter },
    enableRowSelection: true,
    globalFilterFn: fuzzyFilter,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel()
  })

  return (
    <Card>
      <CardContent className="flex flex-col sm:flex-row sm:items-center justify-end gap-4">
        {/* Search + Button */}
        <div className="flex items-center gap-2">
          <DebouncedInput
            value={globalFilter ?? ''}
            className="w-full sm:w-[250px]"
            onChange={value => setGlobalFilter(String(value))}
            placeholder="Search Label"
          />
          <Button variant="contained" size="small" onClick={() => setOpenDialog(true)}>
            Add Label
          </Button>
        </div>
      </CardContent>

      {/* Table */}
      <div className="overflow-x-auto">
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
                        {({
                          asc: <i className="tabler-chevron-up text-xl" />,
                          desc: <i className="tabler-chevron-down text-xl" />
                        })[header.column.getIsSorted()] ?? null}
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
                <td colSpan={table.getVisibleFlatColumns().length} className="text-center py-4">
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

        {/* Action Buttons */}
        {table.getFilteredRowModel().rows.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-4 mb-4">
            <Button variant="contained" color="primary" onClick={handleMenuSubmit}>
              Submit
            </Button>
            <Button variant="tonal" color="secondary" onClick={handleMenuDiscard}>
              Discard
            </Button>
          </div>
        )}
      </div>

      {/* Dialog */}
      {openDialog && (
        <LabelDialog
          open={openDialog}
          setOpen={setOpenDialog}
          selectedLanguage={selectedLanguage}
          fetchLanguageData={fetchLanguageData}
          tableData={tableData}
        />
      )}
    </Card>
  )
}

export default LabelTable
