'use client'

import crypto from "crypto";

import { useEffect, useRef, useState, useMemo } from 'react'

import { useSession } from 'next-auth/react'

import {
    Dialog,
    Avatar,
    Card,
    CardContent,
    Button,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    TextField,
    MenuItem,
    CircularProgress,
    IconButton,
    InputAdornment
} from '@mui/material'

import Grid from '@mui/material/Grid2'

import { useDropzone } from 'react-dropzone'

import { toast } from 'react-toastify'

import ExcelJS from "exceljs";

import {
    flexRender,
    getCoreRowModel,
    useReactTable,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel
} from '@tanstack/react-table'

import { Controller, useForm } from 'react-hook-form'

import { valibotResolver } from '@hookform/resolvers/valibot'

import {
    object,
    string,
    union,
    literal,
    nullable,
    trim,
    minLength,
    maxLength,
    pipe,
    maxSize,
    instance,
    optional
} from "valibot"

import classnames from 'classnames'

import tableStyles from '@core/styles/table.module.css'

import TablePaginationComponent from '@components/TablePaginationComponent'

import DialogCloseButton from '@components/dialogs/DialogCloseButton'
import CustomTextField from '@core/components/mui/TextField'

const MAX_PAIRS = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function normalizeEmail(email) {
    return email.trim().toLowerCase();
}

function hash(text) {
    return crypto.createHash("sha256").update(text).digest("hex");
}

const schema = object({
    title: pipe(
        string(),
        trim(),
        minLength(1, 'Title is required'),
        maxLength(100, 'Max 100 characters')
    ),
    user_type_id: pipe(
        string(),
        minLength(1, "User Type is required")
    ),
    document_type_id: pipe(
        string(),
        minLength(1, "Document Type is required")
    ),
    file: optional(
        nullable(
            pipe(
                instance(File),
                maxSize(1024 * 1024 * 5, 'File size must be less than 5MB')
            )
        )
    ),

    description: optional(
        pipe(
            string(),
            trim(),
            maxLength(255, 'Max 255 characters')
        )
    )
});

const ImportUserModal = ({
    open,
    handleClose,
    API_URL,
    mId,
    id,
    activityId,
    token,
    fetchActivities,
    users,
    setAllData
}) => {

    const { control, handleSubmit } = useForm();
    const [file, setFile] = useState(null);
    const [imageError, setImageError] = useState("");
    const [loading, setLoading] = useState(false);
    const [excelData, setExcelData] = useState([]);
    const [rowErrors, setRowErrors] = useState({});
    const [matchedUsers, setMatchedUsers] = useState([]);

    // Save uploaded data
    const handleDataSave = async () => {
        if (Object.keys(rowErrors)?.length > 0) {
            toast.error("Please fix the errors in the table before submitting.");

            return;
        }

        if (!file) {
            setImageError("Please upload a valid .xlsx file.");

            return;
        }

        setAllData(matchedUsers);

        // Close after state update
        setTimeout(() => {
            handleClose();
        }, 0);
    };

    const DebouncedInput = ({ value: initialValue, onChange, debounce = 500, ...props }) => {
        const [value, setValue] = useState(initialValue);

        useEffect(() => { setValue(initialValue); }, [initialValue]);
        useEffect(() => {

            const timeout = setTimeout(() => { onChange(value); }, debounce);


            return () => clearTimeout(timeout);
        }, [value]);

        return <CustomTextField {...props} value={value} onChange={e => setValue(e.target.value)} />;
    };

    const validateExcelHeaders = (headers) => {
        const requiredHeaders = ["sno", "empid/email"];

        for (let req of requiredHeaders) {
            if (!headers.includes(req.toLowerCase())) {
                throw new Error(`Missing required column: ${req}`);
            }
        }
    };

    const { getRootProps, getInputProps } = useDropzone({

        multiple: false,
        maxSize: 5 * 1024 * 1024, // 5MB
        accept: {
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"]
        },

        onDrop: async (acceptedFiles) => {
            if (!acceptedFiles?.length) return;

            const selectedFile = acceptedFiles[0];


            try {
                const arrayBuffer = await selectedFile.arrayBuffer();

                const workbook = new ExcelJS.Workbook();

                await workbook.xlsx.load(arrayBuffer);

                const worksheet = workbook.worksheets[0]; // first sheet

                if (!worksheet) throw new Error("Excel file is empty.");

                // Read header row
                const headerRow = worksheet.getRow(1).values.slice(1).map(h => String(h || "").trim());
                const cleanHeaders = headerRow.map((h, idx) => h || `Column${idx + 1}`);

                // Validate headers (you already have this function)
                validateExcelHeaders(cleanHeaders.map(h => h.toLowerCase()));

                // Read all rows starting from row 2
                const rows = [];

                worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {

                    if (rowNumber === 1) return;

                    const rowValues = row.values.slice(1);
                    const rowData = {};

                    cleanHeaders.forEach((header, idx) => {
                        rowData[header] = rowValues[idx] ?? "";
                    });
                    rows.push(rowData);
                });

                const errors = {};
                const matchedUsersArray = [];

                rows.forEach((row, index) => {
                    const snoVal = String(row["Sno"] || "").trim();
                    let empRaw = row["EmpId/Email"];
                    let empVal = "";

                    if (typeof empRaw === "object" && empRaw !== null) {
                        empVal = empRaw.text || "";
                    } else {
                        empVal = String(empRaw || "");
                    }

                    empVal = empVal.trim();

                    console.log("selectedFile", snoVal, empVal);

                    const snoFilled = snoVal !== "";
                    const empFilled = empVal !== "";

                    if (snoFilled !== empFilled) {

                        errors[index] = "Sno and EmpId/Email must both be filled or both be empty.";

                        return;
                    }

                    if (empFilled) {
                        const isEmail = empVal.includes("@");
                        let matchedUser = null;

                        if (isEmail) {
                            const norm = normalizeEmail(empVal);
                            const hashed = hash(norm);

                            matchedUser = users.find(user => user.email_hash === hashed);
                        } else {
                            matchedUser = users.find(user =>
                                user.codes.some(c => String(c.code).trim().toLowerCase() === empVal.trim().toLowerCase())
                            );
                        }

                        if (matchedUser) {
                            matchedUsersArray.push(matchedUser._id);
                        } else {
                            errors[index] = `${empVal} does not exist`;
                        }
                    }
                });

                setRowErrors(errors);
                setExcelData(rows);
                setFile(selectedFile);
                setImageError("");
                setMatchedUsers(matchedUsersArray);

            } catch (err) {
                console.error("Error processing Excel file:", err);
                setFile(null);
                setExcelData([]);
                setRowErrors({});
                setMatchedUsers([]);
                setImageError(err.message);
                toast.error(err.message);
            }
        },
        onDropRejected: (rejectedFiles) => {
            rejectedFiles.forEach(file => {
                file.errors.forEach(error => {
                    let msg = "";

                    switch (error.code) {
                        case "file-invalid-type":
                            msg = `Invalid file type. Only .xlsx files are allowed.`;
                            break;
                        case "file-too-large":
                            msg = `File is too large. Max allowed size is 5MB.`;
                            break;
                        case "too-many-files":
                            msg = `Only one file can be uploaded.`;
                            break;
                        default:
                            msg = `There was an issue with the uploaded file.`;
                    }

                    toast.error(msg);
                    setImageError(msg);
                });
            });
        }
    });

    const columns = useMemo(() => {
        if (!excelData?.length) return [];

        return Object.keys(excelData[0]).map(key => ({
            header: key,
            accessorKey: key,
            cell: ({ row, getValue }) => {
                let value = getValue();
                const error = rowErrors[row.index];

                if (typeof value === "object" && value !== null) {
                    if (value.text) {
                        value = value.text;
                    } else {
                        value = "";
                    }
                }

                return (
                    <div>
                        {value}
                        {rowErrors[row.index] && (
                            <Typography variant="caption" color="error">
                                {rowErrors[row.index]}
                            </Typography>
                        )}
                    </div>
                );
            }
        }));
    }, [excelData, rowErrors]);

    const table = useReactTable({
        data: excelData,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel()
    });

    useEffect(() => {
        if (open) {
            //  reset everything when modal opens
            setFile(null);
            setExcelData([]);
            setRowErrors({});
            setMatchedUsers([]);
            setImageError("");
        }
    }, [open]);

    const TableImportComponent = () => (
        <Card className="mt-4">
            <CardContent className="flex justify-between flex-col gap-4 items-start sm:flex-row sm:items-center">
                <div className="flex items-center gap-2">
                    <Typography>Show</Typography>
                    <CustomTextField
                        select
                        value={table.getState().pagination.pageSize}
                        onChange={e => table.setPageSize(Number(e.target.value))}
                        className="max-sm:is-full sm:is-[70px]"
                    >
                        <MenuItem value={10}>10</MenuItem>
                        <MenuItem value={25}>25</MenuItem>
                        <MenuItem value={50}>50</MenuItem>
                        <MenuItem value={200}>200</MenuItem>
                    </CustomTextField>
                </div>
                <DebouncedInput
                    value={table.getState().globalFilter ?? ""}
                    className="max-sm:is-full min-is-[250px]"
                    onChange={value => table.setGlobalFilter(String(value))}
                    placeholder="Search"
                />
            </CardContent>
            <div className="overflow-x-auto">
                <table className={tableStyles.table}>
                    <thead>
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map(header => (
                                    <th key={header.id}>
                                        <div
                                            className={classnames({
                                                "flex items-center": true,
                                                "cursor-pointer": header.column.getCanSort()
                                            })}
                                            onClick={header.column.getToggleSortingHandler()}
                                        >
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                            {header.column.getIsSorted() === "asc" && <i className="tabler-chevron-up text-xl" />}
                                            {header.column.getIsSorted() === "desc" && <i className="tabler-chevron-down text-xl" />}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {table.getRowModel().rows?.length === 0 ? (
                            <tr>
                                <td colSpan={columns?.length} className="text-center">No data available</td>
                            </tr>
                        ) : (
                            table.getRowModel().rows.map(row => (
                                <tr key={row.id}>
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
        </Card>
    );

    return (
        <Dialog open={open} fullWidth maxWidth="lg" sx={{ "& .MuiDialog-paper": { overflow: "visible" } }}>
            <DialogTitle>Import User</DialogTitle>
            <form onSubmit={handleSubmit(handleDataSave)} noValidate>
                <DialogContent sx={{ maxHeight: "80vh", overflowY: "auto" }}>
                    <Grid container spacing={5}>
                        <Grid size={{ xs: 12 }} item>
                            <Typography variant="body1" fontWeight={500} gutterBottom>
                                XLSX <span>*</span>
                                <Button variant="contained" href="/sample/import_user_sample.xlsx" sx={{ ml: 2 }}>
                                    Download sample file
                                </Button>
                            </Typography>
                            <div
                                {...getRootProps()}
                                style={{
                                    minHeight: "150px",
                                    border: "2px dashed #ccc",
                                    padding: "1rem",
                                    borderRadius: "8px",
                                    textAlign: "center",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "1rem"
                                }}
                            >
                                <input {...getInputProps()} />
                                <Avatar variant="rounded" sx={{ bgcolor: "#f5f5f5", width: 48, height: 48 }}>
                                    <i className="tabler-upload" />
                                </Avatar>
                                <Typography variant="body2">Allowed: *.xlsx, Max 5MB</Typography>

                                {file && (
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                                        <Avatar variant="rounded" sx={{ bgcolor: "#f5f5f5", color: "#0A2E73", width: 48, height: 48 }}>
                                            <i className="tabler-file" />
                                        </Avatar>
                                        <Typography variant="body2" fontWeight={500}>{file.name}</Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                        </Typography>
                                    </div>
                                )}

                                {imageError && (
                                    <Typography variant="caption" color="var(--mui-palette-error-main)" sx={{ mt: 1 }}>
                                        {imageError}
                                    </Typography>
                                )}
                            </div>
                        </Grid>
                    </Grid>

                    {excelData?.length > 0 && <TableImportComponent />}

                    <DialogActions sx={{ justifyContent: "center", gap: 2, mt: 4 }}>
                        {excelData.length > 0 && Object.keys(rowErrors)?.length === 0 && (
                            <Button
                                onClick={handleSubmit(handleDataSave)}
                                variant="contained"
                                sx={{ height: 40 }}
                                disabled={loading}
                            >
                                {loading ? "Uploading..." : "Submit"}
                            </Button>
                        )}

                        <Button
                            type="button"
                            variant="contained"
                            color="secondary"
                            onClick={() => {
                                setFile(null);
                                setExcelData([]);
                                setRowErrors({});
                                handleClose();
                            }}
                        >
                            Close
                        </Button>
                    </DialogActions>
                </DialogContent>
            </form>
        </Dialog>
    );
};

const DownloadCenterDialog = ({ open, handleClose, data, fetchRoleData }) => {

    const URL = process.env.NEXT_PUBLIC_API_URL
    const publicURL = process.env.NEXT_PUBLIC_ASSETS_URL;
    const { data: session } = useSession() || {}
    const token = session?.user?.token

    const [loading, setLoading] = useState(false)
    const [fileName, setFileName] = useState('')
    const fileInputRef = useRef(null)

    const [pairErrors, setPairErrors] = useState({});

    const [targetOptionPairs, setTargetOptionPairs] = useState([
        { target: "", options: [], secondOptions: [] },
    ]);

    const [targetError, setTargetError] = useState("");

    const [importLoading, setImportLoading] = useState(false);

    const [isOpen, setIsOpen] = useState(false);
    const [allData, setAllData] = useState([]);
    const [selectedPairIndex, setSelectedPairIndex] = useState(null);
    const [createData, setCreateData] = useState()

    const [selectedDocTypeId, setSelectedDocTypeId] = useState();
    const [selectedUserType, setSelectedUserType] = useState([])

    const { getRootProps, getInputProps } = useDropzone({

        multiple: false,
        maxSize: 5 * 1024 * 1024, // 5MB
        accept: {
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"]
        },

        onDrop: async (acceptedFiles) => {
            if (!acceptedFiles?.length) return;

            const selectedFile = acceptedFiles[0];

            try {
                const arrayBuffer = await selectedFile.arrayBuffer();

                const workbook = new ExcelJS.Workbook();

                await workbook.xlsx.load(arrayBuffer);

                const worksheet = workbook.worksheets[0]; // first sheet

                if (!worksheet) throw new Error("Excel file is empty.");

                // Read header row
                const headerRow = worksheet.getRow(1).values.slice(1).map(h => String(h || "").trim());
                const cleanHeaders = headerRow.map((h, idx) => h || `Column${idx + 1}`);

                // Validate headers (you already have this function)
                validateExcelHeaders(cleanHeaders.map(h => h.toLowerCase()));

                // Read all rows starting from row 2
                const rows = [];

                worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {

                    if (rowNumber === 1) return;

                    const rowValues = row.values.slice(1);
                    const rowData = {};

                    cleanHeaders.forEach((header, idx) => {
                        let cellValue = rowValues[idx];

                        // Normalize ExcelJS object values
                        if (typeof cellValue === "object" && cellValue !== null) {
                            if (cellValue.text) {
                                cellValue = cellValue.text;
                            } else {
                                cellValue = "";
                            }
                        }

                        rowData[header] = cellValue ?? "";
                    });
                    rows.push(rowData);
                });

                const errors = {};
                const matchedUsersArray = [];

                rows.forEach((row, index) => {
                    const snoVal = String(row["Sno"] || "").trim();
                    const empVal = String(row["EmpId/Email"] || "").trim();

                    const snoFilled = snoVal !== "";
                    const empFilled = empVal !== "";

                    if (snoFilled !== empFilled) {

                        errors[index] = "Sno and EmpId/Email must both be filled or both be empty.";

                        return;
                    }

                    if (empFilled) {
                        const isEmail = empVal.includes("@");
                        let matchedUser = null;

                        if (isEmail) {
                            const norm = normalizeEmail(empVal);
                            const hashed = hash(norm);

                            matchedUser = users.find(user => user.email_hash === hashed);
                        } else {
                            matchedUser = users.find(user =>
                                user.codes.some(c => String(c.code).trim().toLowerCase() === empVal.trim().toLowerCase())
                            );
                        }

                        if (matchedUser) {
                            matchedUsersArray.push(matchedUser._id);
                        } else {
                            errors[index] = `${empVal} does not exist`;
                        }
                    }
                });

                setRowErrors(errors);
                setExcelData(rows);
                setFile(selectedFile);
                setImageError("");
                setMatchedUsers(matchedUsersArray);

            } catch (err) {
                console.error("Error processing Excel file:", err);
                setFile(null);
                setExcelData([]);
                setRowErrors({});
                setMatchedUsers([]);
                setImageError(err.message);
                toast.error(err.message);
            }
        },
        onDropRejected: (rejectedFiles) => {
            rejectedFiles.forEach(file => {
                file.errors.forEach(error => {
                    let msg = "";

                    switch (error.code) {
                        case "file-invalid-type":
                            msg = `Invalid file type. Only .xlsx files are allowed.`;
                            break;
                        case "file-too-large":
                            msg = `File is too large. Max allowed size is 5MB.`;
                            break;
                        case "too-many-files":
                            msg = `Only one file can be uploaded.`;
                            break;
                        default:
                            msg = `There was an issue with the uploaded file.`;
                    }

                    toast.error(msg);
                    setImageError(msg);
                });
            });
        }
    });

    const handleImportUser = (index) => {
        if (index === null || index === undefined) return;

        setAllData([]);

        setImportLoading(true);
        setSelectedPairIndex(index);

        // simulate slight delay OR wait for modal ready
        setTimeout(() => {
            setIsOpen(true);
            setImportLoading(false);
        }, 300);
    };

    const handleAddClick = () => {
        setTargetOptionPairs((prev) => {
            if (prev?.length >= MAX_PAIRS) return prev;

            return [...prev, { target: "", options: [], secondOptions: [] }];

        });
    };

    const handleRemoveClick = (index) => {
        setTargetOptionPairs((prev) => {
            if (prev?.length === 1) return prev;
            const copy = [...prev];

            copy.splice(index, 1);

            return copy;
        });
    };

    const handleFirstChange = (index, value) => {

        setPairErrors(prev => {
            const copy = { ...prev };
            
            delete copy[index];
            
            return copy;
        });

        setTargetOptionPairs((prev) => {
            const updated = prev.map((p) => ({ ...p }));

            updated[index].target = value;
            updated[index].options = [];

            switch (value) {
                case "1":
                    updated[index].secondOptions = createData?.designation || [];
                    break;
                case "2":
                    updated[index].secondOptions = createData?.department || [];
                    break;
                case "3":
                    updated[index].secondOptions = createData?.group || [];
                    break;
                case "4":
                    updated[index].secondOptions = createData?.region || [];
                    break;
                case "5":
                    updated[index].secondOptions = createData?.user || [];
                    break;

                case "6":
                    updated[index].secondOptions = createData?.zone || []
                    break;

                case "7":
                    updated[index].secondOptions = createData?.branch || []
                    break;

                default:
                    updated[index].secondOptions = [];
            }

            return updated;
        });
    };

    const normalizeOptions = (val) => {
        if (!val) return [];
        if (Array.isArray(val)) return val.map((v) => String(v));

        return [String(val)];
    };

    const handleSecondChange = (index, value) => {
        setTargetOptionPairs((prev) => {
            const updated = prev.map((p) => ({ ...p }));
            const pair = updated[index];

            if (!pair) return prev;

            const allValues = pair.secondOptions.map(item =>
                String(item._id ?? item.id ?? item)
            );

            if (value.includes("ALL")) {
                pair.options =
                    pair.options.length === allValues.length ? [] : allValues;
            } else {
                pair.options = value;
            }

            return updated;
        });
    };

    const {
        control,
        reset,
        setValue,
        setError,
        clearErrors,
        handleSubmit,
        formState: { errors }
    } = useForm({
        resolver: valibotResolver(schema),
        defaultValues: {
            title: "",
            file: null,
            description: "",
            document_type_id: "",
            user_type_id: ""
        }
    })

    useEffect(() => {

        if (data && open && createData && publicURL) {

            const existingFileName = data?.file_path?.split('/').pop();

            reset({
                title: data?.title,
                description: data?.description || "",
                document_type_id: data?.document_type_id || "",
                user_type_id: data?.user_type_id || "",
                file: null
            });

            setSelectedDocTypeId(data?.user_type_id)

            setFileName(existingFileName || "Uploaded File")

            if (Array.isArray(data.targetPairs) && data.targetPairs?.length > 0) {
                const enriched = data.targetPairs.map((pair) => {
                    let secondOptions = [];

                    switch (pair.target) {
                        case "1":
                            secondOptions = createData?.designation || [];
                            break;
                        case "2":
                            secondOptions = createData?.department || [];
                            break;
                        case "3":
                            secondOptions = createData?.group || [];
                            break;
                        case "4":
                            secondOptions = createData?.region || [];
                            break;
                        case "5":
                            secondOptions = createData?.user || [];
                            break;

                        case "6":
                            secondOptions = createData?.zone || []
                            break;

                        case "7":
                            secondOptions = createData?.branch || []
                            break;

                        default:
                            secondOptions = [];
                    }

                    return {
                        target: pair.target ?? "",
                        options: normalizeOptions(pair.options ?? []),
                        secondOptions,
                    };
                });

                setTargetOptionPairs(enriched);
            } else {
                setTargetOptionPairs([{ target: "", options: [], secondOptions: [] }]);
            }

        }
    }, [data, open, createData, publicURL])

    // Fetch dropdown data
    const fetchCreateData = async () => {
        try {
            const response = await fetch(`${URL}/company/export/create/data`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            const value = await response.json()

            if (response.ok) {
                setCreateData(value?.data)
            }
        } catch (error) {
            console.error(error)
        }
    }

    useEffect(() => {
        if (URL && token && open) {
            fetchCreateData()
        }
    }, [URL, token, open])

    useEffect(() => {
        if (
            allData?.length > 0 &&
            selectedPairIndex !== null
        ) {
            setTargetOptionPairs((prevPairs) => {
                const updatedPairs = prevPairs.map((p) => ({ ...p }));
                const pair = updatedPairs[selectedPairIndex];

                if (!pair || pair.target !== "5") return prevPairs;

                const users = pair.secondOptions || [];

                const selectedUsers = users
                    .filter((u) => allData.includes(String(u._id)))
                    .map((u) => String(u._id));

                //  prevent unnecessary re-render
                const isSame =
                    JSON.stringify(pair.options) === JSON.stringify(selectedUsers);

                if (isSame) return prevPairs;

                pair.options = selectedUsers;

                return updatedPairs;
            });
        }
    }, [allData, selectedPairIndex]); //  removed targetOptionPairs

    // File Upload
    const handleFileUpload = (event) => {

        const file = event.target.files?.[0];

        if (!file) return;

        if (file.size > MAX_FILE_SIZE) {
            setError('file', {
                type: 'manual',
                message: 'File size must be less than 5MB'
            });
            setFileName('');
            
            return;
        }

        setFileName(file.name);
        setValue('file', file);
        clearErrors('file');
    };

    const validateTargetOptions = () => {
        let errors = {};
        let hasValidPair = false;

        targetOptionPairs.forEach((pair, index) => {
            const hasTarget = !!pair.target;
            const hasOptions = pair.options && pair.options.length > 0;

            if (hasTarget && !hasOptions) {
                errors[index] = "Please select at least one option";
            }

            if (!hasTarget && hasOptions) {
                errors[index] = "Please select target";
            }

            if (hasTarget && hasOptions) {
                hasValidPair = true;
            }
        });

        if (!hasValidPair) {
            setTargetError("Please select at least one module target with options.");
        } else {
            setTargetError("");
        }

        setPairErrors(errors);

        return Object.keys(errors).length === 0 && hasValidPair;
    };

    const handleFileClear = () => {
        setFileName('');
        setValue('file', undefined);
        setError('file', {
            type: 'manual',
            message: 'File is required.'
        });
    };

    const handleClosed = () => {
        setIsOpen(false);
        setSelectedPairIndex(null);
        setAllData([]);
    };

    const onSubmit = async (formDataValues) => {

        // TARGET VALIDATION
        if (!validateTargetOptions()) return;

        const formData = new FormData(); //  FIXED POSITION

        // File validation
        if (!data && !formDataValues.file) {
            setError('file', {
                type: "manual",
                message: "File is required."
            });
            
            return;
        }

        if (formDataValues.file && formDataValues.file.size > MAX_FILE_SIZE) {
            setError('file', {
                type: "manual",
                message: "File size must be less than 5MB"
            });
            
            return;
        }

        // Append fields
        formData.append("title", formDataValues.title);
        formData.append("document_type_id", formDataValues.document_type_id);
        formData.append('user_type_id', formDataValues.user_type_id);
        formData.append("description", formDataValues.description || "");
        formData.append("targets", JSON.stringify(targetOptionPairs));

        if (formDataValues.file instanceof File) {
            formData.append("file", formDataValues.file);
        }

        setLoading(true);

        try {
            const res = await fetch(
                data
                    ? `${URL}/company/export/put/data/${data?._id}`
                    : `${URL}/company/export/post/data`,
                {
                    method: data ? 'PUT' : 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    body: formData
                }
            );

            if (res.ok) {
                fetchRoleData();
                toast.success(`Documents ${data ? 'updated' : 'created'} successfully!`);
                handleClose();
                handleReset();
            } else {
                toast.error('Something went wrong!');
            }

        } catch (error) {
            console.error(error);
            toast.error('Error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        reset()
        setFileName('')
        handleClose()
    }

    useEffect(() => {

        if (selectedDocTypeId && createData) {

            const selectedDocType = createData?.docData.find(data => data._id == selectedDocTypeId)
            const selectedUser = selectedDocType?.document_type || [];
            
            setSelectedUserType(selectedUser)

        }
    }, [selectedDocTypeId, createData])

    return (
        <Dialog
            fullWidth
            open={open}
            onClose={handleReset}
            maxWidth='md'
            scroll='body'
            sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
        >
            <DialogCloseButton onClick={handleReset} disableRipple>
                <i className='tabler-x' />
            </DialogCloseButton>

            <DialogTitle className='text-center'>
                {data ? 'Edit' : 'Add'} Document
            </DialogTitle>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <DialogContent>
                    <Grid container spacing={5}>

                        {/* Title */}
                        <Grid size={{ xs: 12, }}>
                            <Controller
                                control={control}
                                name='title'
                                render={({ field }) => (
                                    <CustomTextField
                                        fullWidth
                                        required
                                        label='Title'
                                        {...field}
                                        error={!!errors.title}
                                        helperText={errors.title?.message}
                                    />
                                )}
                            />
                        </Grid>

                        {/* Users */}
                        <Grid size={{ xs: 12, }}>
                            <Typography variant="h6" gutterBottom>
                                Target User*
                            </Typography>
                            {targetOptionPairs.map((pair, idx) => (
                                <Grid container spacing={2} alignItems="center" mb={3} key={idx}>
                                    <Grid item size={{ xs: 12, md: 3 }}>
                                        <TextField
                                            select
                                            label="Select targets"
                                            fullWidth
                                            size="small"
                                            value={pair.target}
                                            onChange={(e) => handleFirstChange(idx, e.target.value)}
                                        >
                                            <MenuItem value="">Select Target</MenuItem>
                                            <MenuItem
                                                value="5"
                                                disabled={targetOptionPairs.some(
                                                    (p, i) => p.target === "5" && i !== idx
                                                )}
                                            >
                                                Users
                                            </MenuItem>
                                            <MenuItem
                                                value="1"
                                                disabled={targetOptionPairs.some(
                                                    (p, i) => p.target === "1" && i !== idx
                                                )}
                                            >
                                                Designation
                                            </MenuItem>
                                            <MenuItem
                                                value="2"
                                                disabled={targetOptionPairs.some(
                                                    (p, i) => p.target === "2" && i !== idx
                                                )}
                                            >
                                                Department
                                            </MenuItem>
                                            {/* <MenuItem
                                                value="3"
                                                disabled={targetOptionPairs.some(
                                                    (p, i) => p.target === "3" && i !== idx
                                                )}
                                            >
                                                Group
                                            </MenuItem> */}
                                            <MenuItem
                                                value="6"
                                                disabled={targetOptionPairs.some(
                                                    (p, i) => p.target === "6" && i !== idx
                                                )}
                                            >
                                                Zone
                                            </MenuItem>
                                            <MenuItem
                                                value="4"
                                                disabled={targetOptionPairs.some(
                                                    (p, i) => p.target === "4" && i !== idx
                                                )}
                                            >
                                                Region
                                            </MenuItem>
                                            <MenuItem
                                                value="7"
                                                disabled={targetOptionPairs.some(
                                                    (p, i) => p.target === "7" && i !== idx
                                                )}
                                            >
                                                Branch
                                            </MenuItem>
                                        </TextField>
                                    </Grid>

                                    <Grid item size={{ xs: 12, md: 6 }}>
                                        <TextField
                                            select
                                            label="Select option"
                                            fullWidth
                                            size="small"
                                            value={pair.options}
                                            onChange={(e) => handleSecondChange(idx, e.target.value)}
                                            SelectProps={{ multiple: true }}
                                            error={!!pairErrors[idx]}   //  highlight field
                                            helperText={pairErrors[idx]} //  show error
                                        >
                                            {pair.secondOptions && pair.secondOptions.length > 0
                                                ? [
                                                    // Select All option
                                                    <MenuItem key="ALL" value="ALL">
                                                        Select All
                                                    </MenuItem>,

                                                    // Normal options
                                                    ...(pair.target !== "5"
                                                        ? pair.secondOptions.map((item, i) => {
                                                            const value = String(item._id ?? item.id ?? item);
                                                            const label = item.name || item.title || item.label || item._id;

                                                            return (
                                                                <MenuItem key={value} value={value}>
                                                                    {label}
                                                                </MenuItem>
                                                            );
                                                        })
                                                        : pair.secondOptions.map((item, i) => {
                                                            const value = String(item._id ?? item.id ?? item);

                                                            return (
                                                                <MenuItem key={value} value={value}>
                                                                    {item.first_name} {item.last_name}
                                                                </MenuItem>
                                                            );
                                                        }))
                                                ]
                                                : [
                                                    <MenuItem key="no-data" disabled>
                                                        No Data Found
                                                    </MenuItem>
                                                ]}
                                        </TextField>
                                    </Grid>

                                    {pair.target === "5" && (
                                        <Grid item size={{ xs: 12, md: 2 }}>
                                            <Button
                                                variant="outlined"
                                                onClick={() => handleImportUser(idx)}
                                                disabled={importLoading}
                                            >
                                                {importLoading ? <CircularProgress size={20} /> : "Import User"}
                                            </Button>
                                        </Grid>
                                    )}

                                    <Grid
                                        item
                                        size={{ xs: 12, md: 1 }}
                                        display="flex"
                                        justifyContent="center"
                                    >
                                        {idx === 0 ? (
                                            <Button
                                                variant="contained"
                                                onClick={handleAddClick}
                                                disabled={targetOptionPairs?.length >= MAX_PAIRS}
                                            >
                                                + Add
                                            </Button>
                                        ) : (
                                            <IconButton
                                                color="error"
                                                onClick={() => handleRemoveClick(idx)}
                                            >
                                                <i className="tabler-trash" />
                                            </IconButton>
                                        )}
                                    </Grid>
                                </Grid>
                            ))}
                            {targetError && (
                                <Typography color="var(--mui-palette-error-main)" variant="body2" mb={2}>
                                    {targetError}
                                </Typography>
                            )}
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Controller
                                name="user_type_id"
                                control={control}
                                render={({ field }) => (
                                    <CustomTextField
                                        {...field}
                                        select
                                        fullWidth
                                        label="User Type*"
                                        onChange={(e) => {
                                            const selectedCountryId = e.target.value;
                                            
                                            field.onChange(selectedCountryId);
                                            setSelectedDocTypeId(selectedCountryId);
                                        }}
                                        error={!!errors.user_type_id}
                                        helperText={errors.user_type_id?.message}
                                    >
                                        {createData?.docData?.length > 0 ? (
                                            createData.docData.map((item, index) => (
                                                <MenuItem key={index} value={item._id}>
                                                    {item.title}
                                                </MenuItem>
                                            ))
                                        ) : (
                                            <MenuItem disabled value="">
                                                No User Types Available
                                            </MenuItem>
                                        )}
                                    </CustomTextField>
                                )}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, }}>
                            {/* State */}
                            <Controller
                                name="document_type_id"
                                control={control}
                                render={({ field }) => (
                                    <CustomTextField
                                        {...field}
                                        select
                                        fullWidth
                                        label="Document Type*"
                                        onChange={(e) => {
                                            field.onChange(e.target.value);
                                        }}
                                        error={!!errors.document_type_id}
                                        helperText={errors.document_type_id?.message}
                                    >
                                        <MenuItem disabled value="">
                                            Select User Type
                                        </MenuItem>

                                        {selectedUserType?.length > 0 ? (
                                            selectedUserType.map((item, index) => (
                                                <MenuItem key={index} value={item._id}>
                                                    {item.title}
                                                </MenuItem>
                                            ))
                                        ) : (
                                            <MenuItem disabled value="">
                                                No Document Types Available
                                            </MenuItem>
                                        )}
                                    </CustomTextField>
                                )}
                            />
                        </Grid>

                        {/* File */}
                        <Grid item size={{ xs: 12 }}>
                            <div className="flex gap-3 items-end w-full">

                                <Controller
                                    control={control}
                                    name="file"
                                    defaultValue={null}
                                    render={({ field: { onChange } }) => (
                                        <CustomTextField
                                            fullWidth
                                            label="Select File *"
                                            value={fileName || ""}
                                            InputProps={{
                                                readOnly: true,
                                                endAdornment: fileName && (
                                                    <InputAdornment position="end">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => {
                                                                setFileName("");
                                                                onChange(undefined)
                                                                
                                                                if (fileInputRef.current) {
                                                                    fileInputRef.current.value = "";
                                                                }
                                                            }}
                                                        >
                                                            <i className="tabler-x" />
                                                        </IconButton>
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    )}
                                />

                                <Button
                                    component="label"
                                    variant="contained"
                                    size="medium"
                                    sx={{ height: "40px", minWidth: "110px" }}
                                >
                                    Choose
                                    <input
                                        hidden
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];

                                            if (file) {
                                                setFileName(file.name);
                                                setValue("file", file, { shouldValidate: true }); // IMPORTANT
                                            }
                                        }}
                                    />
                                </Button>

                            </div>
                            {(errors?.file && !fileName) && (

                                <Typography color='var(--mui-palette-error-main)'>
                                    {errors?.file?.message}
                                </Typography>
                            )}
                        </Grid>


                        {/* Description */}
                        <Grid size={{ xs: 12 }}>
                            <Controller
                                control={control}
                                name='description'
                                render={({ field }) => (
                                    <CustomTextField
                                        fullWidth
                                        multiline
                                        minRows={3}
                                        label='Description'
                                        {...field}
                                        error={!!errors.description}
                                        helperText={errors.description?.message}
                                    />
                                )}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions className='justify-center'>
                    <Button type='submit' variant='contained' disabled={loading}>
                        {loading && <CircularProgress size={20} />}
                        Submit
                    </Button>

                    <Button variant='tonal' onClick={handleReset}>
                        Cancel
                    </Button>
                </DialogActions>

                <ImportUserModal
                    users={createData?.user || []}
                    open={isOpen}
                    handleClose={handleClosed}
                    allData={allData}
                    setAllData={setAllData}
                />
            </form>
        </Dialog>
    )
}

export default DownloadCenterDialog
