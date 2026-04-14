'use client'

import crypto from "crypto";

import { useEffect, useState, useMemo, useCallback } from "react"

import { useRouter, useParams } from "next/navigation"

import Error from "next/error"

import { useSession } from "next-auth/react"

import ReactPlayer from 'react-player'

import JSZip from 'jszip'

import { rankItem } from '@tanstack/match-sorter-utils'

import { XMLParser } from 'fast-xml-parser'

import classnames from 'classnames'

import {
  Box,
  Button,
  Card,
  InputBase,
  Dialog,
  Skeleton,
  useTheme,
  useMediaQuery,
  DialogActions,
  Select,
  CardContent,
  List,
  ListItem,
  Avatar,
  FormControlLabel,
  Radio,
  CircularProgress,
  LinearProgress,
  RadioGroup,
  Checkbox,
  Typography,
  IconButton,
  TextField,
  DialogTitle,
  MenuItem,
  Switch,
  Alert,
  InputAdornment,
  Tab,
  DialogContent,
} from '@mui/material'

import Grid from '@mui/material/Grid2'

import { useDropzone } from 'react-dropzone'

import { valibotResolver } from '@hookform/resolvers/valibot'

import {
  object,
  string,
  pipe,
  maxLength,
  minLength,
  regex
} from 'valibot'

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel
} from '@tanstack/react-table'

import { useForm, Controller, set } from 'react-hook-form'

import { TabContext, TabList, TabPanel } from "@mui/lab"

import { toast } from "react-toastify"

import ExcelJS from "exceljs";

import DatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";

import tableStyles from '@core/styles/table.module.css'

import TablePaginationComponent from '@components/TablePaginationComponent'

import PermissionGuard from "@/hocs/PermissionClientGuard"

import AppReactDropzone from '@/libs/styles/AppReactDropzone'

import DialogCloseButton from "@/components/dialogs/DialogCloseButton"

import CustomTextField from "@/@core/components/mui/TextField"

const assert_url = process.env.NEXT_PUBLIC_ASSETS_URL || ''

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

const createEmptyQuestion = () => ({
  id: Date.now() + Math.random(),
  text: '',
  type: '',
  options: null, // ✅ REQUIRED
  mandatory: false,
  errors: { text: false, type: false }
})

function hash(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

const ImportQuizModal = ({ open, onClose, activityId, handleClose }) => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const { data: session } = useSession();
  const token = session?.user?.token;

  const router = useRouter();
  const { mId: mId, lang: lang } = useParams();

  const [missingHeaders, setMissingHeaders] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);

  const [fileInput, setFileInput] = useState();
  const [progress, setProgress] = useState(0);
  const [uploadData, setUploadData] = useState();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [srNoArr, setSRNOArr] = useState([]);
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState('');

  const columnHelper = createColumnHelper();

  const DebouncedInput = ({ value: initialValue, onChange, debounce = 500, ...props }) => {
    const [value, setValue] = useState(initialValue);

    useEffect(() => { setValue(initialValue); }, [initialValue]);
    useEffect(() => {
      const timeout = setTimeout(() => { onChange(value); }, debounce);

      return () => clearTimeout(timeout);
    }, [value]);

    return <CustomTextField {...props} value={value} onChange={e => setValue(e.target.value)} />;
  };

  const fuzzyFilter = (row, columnId, value, addMeta) => {
    const itemRank = rankItem(row.getValue(columnId), value);

    addMeta({ itemRank });

    return itemRank.passed;
  };

  const handleRemoveFile = () => {
    setData([]);
    setFileInput(null);
    setUploadData([]);
    setValidationErrors([]);
    setMissingHeaders([]);
    setLoading(false);
    setProgress(0);
  };

  const { getRootProps, getInputProps } = useDropzone({
    multiple: false,
    maxSize: 2 * 1024 * 1024, // 2MB
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    },
    onDrop: async (acceptedFiles) => {
      // reset
      setFileInput(null);
      setMissingHeaders([]);
      setValidationErrors([]);
      setLoading(true);
      setProgress(0);
      setData([]);
      setUploadData([]);

      if (!acceptedFiles?.length) {
        setLoading(false);
        toast.error("No file selected.");

        return;
      }

      const selectedFile = acceptedFiles[0];

      if (!selectedFile) {
        setLoading(false);

        toast.error("File read failed.");

        return;
      }

      try {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const workbook = new ExcelJS.Workbook();

        await workbook.xlsx.load(arrayBuffer);

        const worksheet = workbook.worksheets[0]; // first sheet

        // Read headers
        const headerRow = worksheet.getRow(1).values.slice(1);

        const requiredHeaders = [
          "Sno",
          "Question",
          "Option 1",
          "Option 2",
          "Option 3",
          "Option 4",
          "Option 5",
          "Option 6",
          "Correct Answer",
          "Difficulty Level",
          "Section",
          "Answer Explanation",
          "Use Answer Explanation",
          "Question Type",
        ];

        const missingHeaders = requiredHeaders.filter(
          (h) => !headerRow.includes(h)
        );

        if (missingHeaders.length > 0) {
          setMissingHeaders(missingHeaders);
          setLoading(false);
          setProgress(0);

          return;
        }

        // Read data rows
        const jsonData = [];

        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
          if (rowNumber === 1) return;
          const rowValues = row.values.slice(1);
          const rowData = {};

          headerRow.forEach((header, index) => {
            rowData[header] = rowValues[index] ?? "";
          });
          jsonData.push(rowData);
        });

        // Validation
        const seenSno = new Set();
        const duplicateSno = [];
        const errors = [];

        function parseCorrectAnswer(raw) {
          if (raw == null) return [];

          const s = String(raw)
            .replace(/[\[\]\(\)\{\}'"]/g, " ")
            .trim();

          return s
            .split(/[^0-9]+/)
            .map((p) => p.trim())
            .filter(Boolean);
        }

        jsonData.forEach((row, index) => {
          const rowNum = index + 2; // Excel row index
          const sno = String(row["Sno"] || "").trim();
          const question = String(row["Question"] || "").trim();
          const difficulty = String(row["Difficulty Level"] || "").trim();
          const questionType = String(row["Question Type"] || "").trim();
          const section = String(row["Section"] || "").trim();
          const answerExplanation = String(row["Answer Explanation"] || "").trim();
          let useAnswerExplanation = String(row["Use Answer Explanation"] || "")
            .trim()
            .toLowerCase();

          if (useAnswerExplanation === "") useAnswerExplanation = "false";

          const options = [
            String(row["Option 1"] || "").trim(),
            String(row["Option 2"] || "").trim(),
            String(row["Option 3"] || "").trim(),
            String(row["Option 4"] || "").trim(),
            String(row["Option 5"] || "").trim(),
            String(row["Option 6"] || "").trim(),
          ];

          if (!sno) errors.push(`Row ${rowNum}: Sno is required.`);
          else {
            if (seenSno.has(sno)) duplicateSno.push(sno);
            seenSno.add(sno);
          }

          if (!question) errors.push(`Row ${rowNum}: Question cannot be empty.`);
          else if (question.length > 500)
            errors.push(`Row ${rowNum}: Question must not exceed 500 characters.`);

          if (options.every((o) => o === ""))
            errors.push(`Row ${rowNum}: At least one option must have a value.`);

          if (!["1", "2", "3"].includes(difficulty))
            errors.push(`Row ${rowNum}: Difficulty Level must be 1, 2, or 3.`);

          if (!section) errors.push(`Row ${rowNum}: Section cannot be empty.`);
          else if (section.length > 10)
            errors.push(`Row ${rowNum}: Section must not exceed 10 characters.`);

          if (answerExplanation.length > 500)
            errors.push(`Row ${rowNum}: Answer Explanation must not exceed 500 characters.`);

          if (!["true", "false"].includes(useAnswerExplanation))
            errors.push(`Row ${rowNum}: Use Answer Explanation must be TRUE or FALSE.`);

          if (!["Single Correct", "Multiple Correct"].includes(questionType))
            errors.push(
              `Row ${rowNum}: Question Type must be 'Single Correct' or 'Multiple Correct'.`
            );

          const parsedAnswers = parseCorrectAnswer(row["Correct Answer"]);
          const uniqueAnswers = [...new Set(parsedAnswers)];

          if (uniqueAnswers.length === 0)
            errors.push(
              `Row ${rowNum}: Correct Answer must contain at least one option number (1–6).`
            );
          else {
            uniqueAnswers.forEach((ans) => {
              if (!/^[1-6]$/.test(ans))
                errors.push(
                  `Row ${rowNum}: Correct Answer contains invalid option number: ${ans}`
                );
              else if (!options[Number(ans) - 1])
                errors.push(
                  `Row ${rowNum}: Correct Answer references Option ${ans} but that option is empty.`
                );
            });
          }

          if (questionType === "Single Correct" && uniqueAnswers.length !== 1)
            errors.push(
              `Row ${rowNum}: For Single Correct, Correct Answer must contain exactly ONE option number.`
            );

          if (questionType === "Multiple Correct" && uniqueAnswers.length < 2)
            errors.push(
              `Row ${rowNum}: For Multiple Correct, Correct Answer must contain at least TWO option numbers.`
            );

          if (useAnswerExplanation === "true" && !answerExplanation)
            errors.push(
              `Row ${rowNum}: Answer Explanation cannot be empty when Use Answer Explanation is TRUE.`
            );
          if (useAnswerExplanation === "false" && answerExplanation)
            errors.push(
              `Row ${rowNum}: Answer Explanation must be empty when Use Answer Explanation is FALSE.`
            );
        });

        if (duplicateSno.length > 0)
          errors.unshift(`Duplicate Sno values found: ${[...new Set(duplicateSno)].join(", ")}`);

        if (errors.length > 0) {
          setValidationErrors(errors);
          setLoading(false);
          setProgress(0);

          return;
        }

        const normalized = jsonData.map((row) => {
          const opts = [
            String(row["Option 1"] || "").trim(),
            String(row["Option 2"] || "").trim(),
            String(row["Option 3"] || "").trim(),
            String(row["Option 4"] || "").trim(),
            String(row["Option 5"] || "").trim(),
            String(row["Option 6"] || "").trim(),
          ];

          const parsed = parseCorrectAnswer(row["Correct Answer"]);
          const unique = [...new Set(parsed)].filter((v) => /^[1-6]$/.test(String(v)));
          const filtered = unique.filter((ans) => opts[Number(ans) - 1] !== "");

          return {
            Sno: row["Sno"],
            Question: String(row["Question"] || "").trim(),
            Option1: opts[0],
            Option2: opts[1],
            Option3: opts[2],
            Option4: opts[3],
            Option5: opts[4],
            Option6: opts[5],
            DifficultyLevel: String(row["Difficulty Level"] || "").trim(),
            CorrectAnswer: filtered.map(Number),
            Section: String(row["Section"] || "").trim(),
            AnswerExplanation: String(row["Answer Explanation"] || "").trim(),
            UseAnswerExplanation: String(row["Use Answer Explanation"] || "").trim().toLowerCase() === "true",
            QuestionType: String(row["Question Type"] || "").trim(),
          };
        });

        setUploadData(normalized);
        setFileInput(selectedFile);
        setLoading(false);
        setProgress(100);
      } catch (err) {
        console.error("Error processing Excel file:", err);
        toast.error("Error processing the Excel file. Check the file and headers.");
        setLoading(false);
        setProgress(0);
        setUploadData([]);
        setData([]);
      }
    },
    onDropRejected: (rejectedFiles) => {
      setLoading(false);
      setProgress(0);
      setUploadData([]);
      setData([]);
      rejectedFiles.forEach((file) => {
        file.errors.forEach((error) => {
          switch (error.code) {
            case "file-invalid-type":
              toast.error(`Invalid file type for ${file.file.name}`);
              break;
            case "file-too-large":
              toast.error(`File ${file.file.name} is too large.`);
              break;
            default:
              toast.error(`Error with file ${file.file.name}`);
          }
        });
      });
    },
  });

  const handleDialogClose = () => {
    onClose();
  };

  const submitAnswer = async (dataToSend) => {


    try {
      const response = await fetch(
        `${API_URL}/company/quiz/question/${mId}/${activityId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(dataToSend)
        }
      );

      let datas = null;
      const text = await response.text();

      if (text) {
        try {
          datas = JSON.parse(text);
        } catch (err) {
          console.error("Invalid JSON from server:", text);
          throw err;
        }
      }

      if (response.ok) {
        router.replace(`/${lang}/apps/quiz/${mId}/${activityId}`);
        toast.success(`Quiz has been imported`, { autoClose: 900 });
        onClose();
        handleClose();
      } else {
        console.error("Error:", datas || response.statusText);
        toast.error('Import failed. Check console for details.');
      }
    } catch (error) {
      console.error("Submit answer error:", error);
      toast.error('Unexpected error when sending data.');
      throw error;
    }
  };

  const handleUploadData = () => {
    if (uploadData && uploadData?.length > 0) {
      // For API expectation: adjust shape if required by backend; currently sending array of normalized objects
      submitAnswer(uploadData).then(() => {
        // Clear everything after save
        setData([]);
        setFileInput(null);
        setUploadData([]);
        setValidationErrors([]);
        setMissingHeaders([]);
        setLoading(false);
        setProgress(0);
        setRowSelection({});
        setGlobalFilter('');
      }).catch(() => {
        // keep data so user can fix/resubmit
      });
    } else {
      toast.error('No data to upload.');
    }
  };

  const columns = useMemo(() => [
    columnHelper.accessor('Sno', { header: 'Sno', cell: info => <Typography>{info.getValue()}</Typography> }),
    columnHelper.accessor('Question', { header: 'Question', cell: info => <Typography>{info.getValue()}</Typography> }),
    columnHelper.accessor('Option1', { header: 'Option 1', cell: info => <Typography>{info.getValue()}</Typography> }),
    columnHelper.accessor('Option2', { header: 'Option 2', cell: info => <Typography>{info.getValue()}</Typography> }),
    columnHelper.accessor('Option3', { header: 'Option 3', cell: info => <Typography>{info.getValue()}</Typography> }),
    columnHelper.accessor('Option4', { header: 'Option 4', cell: info => <Typography>{info.getValue()}</Typography> }),
    columnHelper.accessor('Option5', { header: 'Option 5', cell: info => <Typography>{info.getValue()}</Typography> }),
    columnHelper.accessor('Option6', { header: 'Option 6', cell: info => <Typography>{info.getValue()}</Typography> }),
    columnHelper.accessor('DifficultyLevel', { header: 'Difficulty Level', cell: info => <Typography>{info.getValue()}</Typography> }),
    columnHelper.accessor('CorrectAnswer', { header: 'Correct Answer', cell: info => <Typography>{Array.isArray(info.getValue()) ? info.getValue().join(',') : String(info.getValue())}</Typography> }),
    columnHelper.accessor('Section', { header: 'Section', cell: info => <Typography>{info.getValue()}</Typography> }),
    columnHelper.accessor('AnswerExplanation', { header: 'Answer Explanation', cell: info => <Typography>{info.getValue()}</Typography> }),
    columnHelper.accessor('UseAnswerExplanation', { header: 'Use Answer Explanation', cell: info => <Typography>{info.getValue() ? 'true' : 'false'}</Typography> }),
    columnHelper.accessor('QuestionType', { header: 'Question Type', cell: info => <Typography>{info.getValue()}</Typography> }),

  ], [srNoArr]);

  const table = useReactTable({
    data: uploadData || [],
    columns,
    state: { rowSelection, globalFilter },
    filterFns: { fuzzy: fuzzyFilter },
    globalFilterFn: fuzzyFilter,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  const TableImportComponent = () => (
    <Card className='mt-4'>
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
            <MenuItem value={200}>200</MenuItem>
          </CustomTextField>
        </div>
        <DebouncedInput
          value={globalFilter ?? ''}
          className='max-sm:is-full min-is-[250px]'
          onChange={value => setGlobalFilter(String(value))}
          placeholder='Search Question'
        />
      </CardContent>
      <div className='overflow-x-auto'>
        <table className={tableStyles.table}>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id}>
                    <div
                      className={classnames({
                        'flex items-center': true,
                        'cursor-pointer': header.column.getCanSort()
                      })}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === 'asc' && <i className='tabler-chevron-up text-xl' />}
                      {header.column.getIsSorted() === 'desc' && <i className='tabler-chevron-down text-xl' />}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows?.length === 0 ? (
              <tr>
                <td colSpan={columns?.length} className='text-center'>No data available</td>
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
    <Dialog fullWidth maxWidth='lg' scroll='body' open={open} onClose={onClose} sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}>
      <DialogCloseButton onClick={onClose}><i className="tabler-x" /></DialogCloseButton>
      <DialogTitle variant='h4' className='text-center'>Import Quiz Question</DialogTitle>

      <Card>
        <CardContent>
          <Alert severity='info'>Note: Allowed only Excel files with *.xls or *.xlsx extension.</Alert>
          {missingHeaders?.length > 0 && (
            <Alert severity='error'>Missing Headers: {missingHeaders.join(', ')}</Alert>
          )}
          {validationErrors?.length > 0 && (
            <Alert severity='error' className='mt-2'>
              {validationErrors.map((err, idx) => <div key={idx}>{err}</div>)}
            </Alert>
          )}
          <Typography className='mt-3'>
            Use this format:
            <span style={{ marginLeft: '0.5rem' }}>
              <Button variant='outlined' href="/sample/QuizSection.xlsx" download>Download sample file</Button>
            </span>
          </Typography>
        </CardContent>

        <CardContent>
          <AppReactDropzone>
            <div {...getRootProps()} className='dropzone'>
              <input {...getInputProps()} />
              <div className='flex items-center flex-col'>
                <Avatar variant='rounded' className='bs-12 is-12 mbe-9'><i className='tabler-upload' /></Avatar>
                <Typography variant='h4'>Drop files here or click to upload</Typography>
                <Typography>Allowed *.xls, *.xlsx – Max 2 MB</Typography>
              </div>
            </div>

            {loading && <LinearProgress variant='determinate' color='success' value={progress} />}

            {fileInput && (
              <List className='mt-3'>
                <ListItem>
                  <div className='file-details'>
                    <div className='file-preview'><i className='vscode-icons-file-type-excel w-6 h-6' /></div>
                    <Typography>{fileInput.name}</Typography>
                  </div>
                  <IconButton onClick={handleRemoveFile}><i className='tabler-x text-xl' /></IconButton>
                </ListItem>
              </List>
            )}

            {uploadData && uploadData?.length > 0 && <TableImportComponent />}
          </AppReactDropzone>
        </CardContent>
      </Card>

      <DialogActions className='justify-center'>
        {uploadData && uploadData?.length > 0 && missingHeaders?.length === 0 && validationErrors?.length === 0 && (
          <Button variant='contained' onClick={handleUploadData}>Start Import</Button>
        )}
        <Button variant='tonal' type='button' color='secondary' onClick={handleDialogClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

const QuizCard = ({ title, onClick, badge }) => {
  return (
    <div
      className="relative bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition cursor-pointer w-64 text-center"
      onClick={onClick}
    >
      {badge && (
        <span className="absolute top-3 right-3 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}

      {title === 'Import from Spreadsheet' && (
        <svg xmlns="http://www.w3.org/2000/svg" fill="green" viewBox="0 0 24 24" width="40" height="40">
          <path d="M6 2h9l5 5v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill="#34a853" />
          <path d="M14 2v6h6" fill="#2c7" />
          <path fill="#fff" d="M8 10h8v2H8zm0 3h8v2H8z" />
        </svg>
      )}

      {title === 'Create Manually' && (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="dodgerblue" strokeWidth="2" viewBox="0 0 24 24" width="40" height="40">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
      )}

      <p className="text-sm font-semibold text-gray-800">{title}</p>
    </div>
  );
};

const ShowFileModal = ({ open, setOpen, docURL }) => {

  const router = useRouter()
  const ASSET_URL = process.env.NEXT_PUBLIC_ASSETS_URL
  const fullURL = `${ASSET_URL}/activity/${docURL}`
  const ext = docURL?.split('.').pop()?.toLowerCase()
  const backURL = '/activities'

  const [isOnlineEnv, setIsOnlineEnv] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnlineEnv(!window.location.origin.includes('localhost'))
    }
  }, [])

  const handleClose = () => setOpen(false)

  const isPDF = ext === 'pdf'
  const isOfficeFile = ['doc', 'docx', 'ppt', 'pptx'].includes(ext)

  const officeViewerURL = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fullURL)}`
  const googleViewerURL = `https://docs.google.com/gview?url=${encodeURIComponent(fullURL)}&embedded=true`

  return (
    <Dialog
      open={open}
      fullWidth
      maxWidth="lg"
      onClose={handleClose}
      scroll="body"
      closeAfterTransition={false}
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
    >

      <DialogCloseButton onClick={handleClose} disableRipple>
        <i className="tabler-x" />
      </DialogCloseButton>

      <DialogTitle>Document Preview</DialogTitle>

      <DialogContent dividers sx={{ minHeight: 600 }}>
        {isPDF ? (
          <iframe
            src={fullURL}
            style={{ width: '100%', height: '100%', minHeight: '600px', border: 'none' }}
            title="PDF Viewer"
          />
        ) : isOfficeFile && isOnlineEnv ? (
          <iframe
            src={officeViewerURL}
            style={{ width: '100%', height: '100%', minHeight: '600px', border: 'none' }}
            title="Office Viewer"
          />
        ) : isOfficeFile && !isOnlineEnv ? (
          <iframe
            src={googleViewerURL}
            style={{ width: '100%', height: '100%', minHeight: '600px', border: 'none' }}
            title="Google Viewer"
          />
        ) : (
          <Typography variant="body2">
            File preview not supported.{' '}
            <a href={fullURL} target="_blank" rel="noopener noreferrer">
              Click here to download
            </a>
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'center', gap: 2, mt: "18px" }}>
        <Button variant="contained">Submit</Button>
        <Button
          variant="outlined"
          color="error"
          onClick={() => {
            handleClose()
          }}
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const ActivityModal = ({ open, id, setISOpen, editData, API_URL, token, mId, activityId, fetchActivities }) => {

  const { lang } = useParams();

  const [preview, setPreview] = useState()
  const [imageError, setImageError] = useState()
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState()

  const [isModalOpen, setIsModalOpen] = useState(false);

  const isYoutube = id == '688723af5dd97f4ccae68836'
  const isVideo = id == '688723af5dd97f4ccae68835'
  const isScrom = id == '688723af5dd97f4ccae68837'
  const isQuiz = id == '68886902954c4d9dc7a379bd';

  const router = useRouter();

  const schema = object({
    title: pipe(
      string(),
      minLength(1, 'Title is required'),
      maxLength(100, 'Title can be max of 100 characters'),
      regex(/^[A-Za-z0-9\s]+$/, 'Only letters and numbers allowed')
    ),
    live_session_type: pipe(),
    video_url: (isYoutube || isVideo)
      ? pipe(
        minLength(1, 'Video URL is required'),
        maxLength(200, 'Video URL too long'),
        regex(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/[^\s]+$/, 'Enter a valid YouTube URL')
      )
      : pipe()
  })

  const {
    reset,
    control,
    watch,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: valibotResolver(schema),
    defaultValues: {
      title: '',
      video_url: '',
      live_session_type: ''
    }
  })

  useEffect(() => {
    if (editData && open) {

      if (isYoutube || isVideo) {
        reset({
          title: editData?.video_data?.title || '',
          video_url: editData?.video_data?.video_url || '',
          live_session_type: ''
        })
      } else if (isScrom) {
        reset({
          title: editData?.scorm_data?.title,
          video_url: '',
          live_session_type: ''
        })
      } else {
        reset({
          title: editData?.title || '',
          video_url: '',
          live_session_type: ''
        })
        setPreview(editData?.file_url)
      }
    }
  }, [editData, id, open, isYoutube, isVideo, reset])

  const getFileConfig = () => {
    if (id === '688723af5dd97f4ccae68834') {
      return {
        accept: {
          'application/pdf': ['.pdf'],
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
          'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
          'application/msword': ['.doc']
        },
        maxSize: 5 * 1024 * 1024,
        type: 'Document'
      }
    }

    if (id === '688723af5dd97f4ccae68835') {
      return {
        accept: { 'video/mp4': ['.mp4'] },
        maxSize: 500 * 1024 * 1024,
        type: 'Video'
      }
    }

    if (id === '688723af5dd97f4ccae68837') {
      return {
        accept: { 'application/zip': ['.zip'] },
        maxSize: 500 * 1024 * 1024,
        type: 'SCORM Content'
      }
    }

    if (id === '688723af5dd97f4ccae68836') {
      return { type: 'Youtube videos' }
    }

    if (isQuiz) {
      return {
        accept: { 'application/zip': ['.zip'] },
        maxSize: 500 * 1024 * 1024,
        type: 'Objective Quiz'
      }
    }

    return { accept: {}, maxSize: 0, type: '' }
  }

  const fileConfig = getFileConfig()

  const { getRootProps, getInputProps } = useDropzone({
    multiple: false,
    maxSize: fileConfig.maxSize,
    accept: fileConfig.accept,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles && !acceptedFiles?.length) return
      const selectedFile = acceptedFiles[0]

      setFile(null)
      setImageError('')
      setPreview(null)

      if (fileConfig.type === 'SCORM Content') {
        try {
          const zip = await JSZip.loadAsync(selectedFile)
          const manifestFile = zip.file("imsmanifest.xml")

          if (!manifestFile) {
            const msg = "SCORM zip must include 'imsmanifest.xml' at the root level."

            toast.error(msg)
            setImageError(msg)

            return
          }

          const manifestText = await manifestFile.async("string")
          const parser = new XMLParser({ ignoreAttributes: false })
          const manifest = parser.parse(manifestText)

          if (!manifest?.manifest) {
            const msg = "'imsmanifest.xml' is not a valid SCORM manifest file."

            toast.error(msg)
            setImageError(msg)

            return
          }
        } catch (err) {
          console.error(err)
          const msg = "Invalid SCORM zip. Could not parse 'imsmanifest.xml'."

          toast.error(msg)

          setImageError(msg)

          return
        }
      }

      setFile(selectedFile)

      if (fileConfig.type === 'Video') {
        setPreview(URL.createObjectURL(selectedFile))
      }
    },
    onDropRejected: (rejectedFiles) => {
      rejectedFiles.forEach(file => {
        file.errors.forEach(error => {
          let msg = ''

          switch (error.code) {
            case 'file-invalid-type':
              msg = `Invalid file type for ${fileConfig.type}.`
              break
            case 'file-too-large':
              msg = `File is too large. Max allowed size is ${fileConfig.maxSize / (1024 * 1024)}MB.`
              break
            case 'too-many-files':
              msg = `Only one ${fileConfig.type} can be uploaded.`
              break
            default:
              msg = `There was an issue with the uploaded file.`
          }

          toast.error(msg)
          setImageError(msg)
        })
      })
    }
  })

  const handleDataSave = async (data) => {

    const isEdit = !!editData;

    // Determine if a file is required based on conditions
    const requiresFile =
      !isYoutube &&
      !isVideo &&
      !isScrom &&
      (!file && (!isEdit || !editData?.file_url));

    if (requiresFile) {
      setImageError(`Please upload a ${fileConfig.type.toLowerCase()}.`);

      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      formData.append('title', data.title);
      formData.append('file_type', fileConfig.type);

      if (file) formData.append('file', file);
      if (isYoutube) formData.append('video_url', data.video_url);

      const response = await fetch(`${API_URL}/company/activity/data/${mId}/${id}/${activityId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const value = await response.json()

      if (response.ok) {

        toast.success(`${fileConfig.type} uploaded successfully`, {
          autoClose: 1000
        });
        fetchActivities();
        handleClose();
        setISOpen(false);
      } else {

        toast.error(`${value?.message}`, {
          autoClose: 1000
        })

      }
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile()
    setPreview()
    setImageError()
    reset({ title: '', video_url: '', live_session_type: '' })
    setISOpen(false)
  }

  const onClose = () => {
    setIsModalOpen(false);
  }

  return (
    <Dialog open={open} fullWidth maxWidth="lg" sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}>
      <DialogCloseButton onClick={handleClose} disableRipple>
        <i className="tabler-x"></i>
      </DialogCloseButton>

      <DialogTitle>Upload {fileConfig.type}</DialogTitle>

      <form onSubmit={handleSubmit(handleDataSave)} noValidate>
        <DialogContent sx={{ maxHeight: '80vh', overflowY: 'auto' }}>
          <Grid container spacing={5}>

            {isQuiz && (
              <Box py={4} sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                <Grid container spacing={4} justifyContent="center" alignItems="center">

                  <QuizCard
                    title="Import from Spreadsheet"
                    onClick={() => {
                      setIsModalOpen(true)
                    }}
                  />
                  <QuizCard
                    title="Create Manually"
                    onClick={() => {
                      router.replace(`/${lang}/apps/quiz/${mId}/${activityId}`)
                    }}
                  />

                </Grid>
              </Box>
            )}

            {!isQuiz && (
              <Grid item size={{ xs: 12 }}>
                <Controller
                  name="title"
                  defaultValue=""
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      fullWidth
                      label="Title*"
                      placeholder="Enter title"
                      error={!!errors.title}
                      helperText={errors.title?.message}
                    />
                  )}
                />
              </Grid>
            )}

            {!isYoutube && !isQuiz && (
              <Grid item size={{ xs: 12 }}>
                <Typography variant="body1" fontWeight={500} gutterBottom>
                  {fileConfig.type} <span>*</span>
                </Typography>

                <AppReactDropzone>
                  <div
                    {...getRootProps()}
                    style={{
                      minHeight: '150px',
                      border: '2px dashed #ccc',
                      padding: '1rem',
                      borderRadius: '8px',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '1rem'
                    }}
                  >
                    <input {...getInputProps()} />
                    <Avatar variant="rounded" className="bs-12 is-12 mbe-1">
                      <i className="tabler-upload" />
                    </Avatar>

                    <Typography variant="body2">
                      {fileConfig.type === 'Document' && 'Allowed *.pdf, *.pptx, *.docx, *.doc. Max 5MB'}
                      {fileConfig.type === 'Video' && 'Allowed *.mp4. Max 500MB'}
                      {fileConfig.type === 'SCORM Content' && 'Allowed *.zip. Must include imsmanifest.xml. Max 500MB'}
                    </Typography>

                    {(file || editData?.file_url) && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                        <Avatar variant="rounded" sx={{ bgcolor: '#f5f5f5', color: '#0A2E73', width: 48, height: 48 }}>
                          <i className="tabler-file" />
                        </Avatar>

                        <Typography variant="body2" fontWeight={500}>
                          {file?.name || editData?.file_url}
                        </Typography>

                        <Typography variant="caption" color="textSecondary">
                          {file && `${(file.size / 1024 / 1024).toFixed(2)} MB`}
                        </Typography>
                      </div>
                    )}

                    {imageError && (
                      <Typography variant="caption" color="var(--mui-palette-error-main)" sx={{ mt: 1 }}>
                        {imageError}
                      </Typography>
                    )}
                  </div>
                </AppReactDropzone>
              </Grid>
            )}

            {(isYoutube || isVideo) && (
              <>
                {isYoutube && (

                  <>
                    <Grid item size={{ xs: 12 }}>
                      <Controller
                        name="video_url"
                        control={control}
                        render={({ field }) => (
                          <CustomTextField
                            {...field}
                            fullWidth
                            label="Video URL*"
                            placeholder="Enter YouTube video URL"
                            error={!!errors.video_url}
                            helperText={errors.video_url?.message}
                          />
                        )}
                      />
                    </Grid>
                  </>
                )}

                <>

                  {ReactPlayer.canPlay(preview ? preview : (isVideo ? `${assert_url}/activity/${watch('video_url')}` : watch('video_url'))) && (
                    <Grid item size={{ xs: 12 }}>
                      <Typography variant="subtitle1" gutterBottom>Video Preview</Typography>
                      <Box sx={{ position: 'relative', width: '100%', height: '300px', borderRadius: 2, overflow: 'hidden', boxShadow: 1 }}>
                        <ReactPlayer
                          url={preview ? preview : (isVideo ? `${assert_url}/activity/${watch('video_url')}` : watch('video_url'))}
                          controls
                          width="100%"
                          height="100%"
                          style={{ position: 'absolute', top: 0, left: 0 }}
                        />
                      </Box>
                    </Grid>
                  )}
                </>

              </>
            )}
          </Grid>

          <DialogActions sx={{
            justifyContent: 'center',
            gap: 2,
            mt: 4
          }}>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{ height: 40, position: 'relative' }}
            >
              {loading ? (
                <CircularProgress size={24} sx={{
                  color: 'white', position: 'absolute', top: '50%', left: '50%',
                  mt: '-12px', ml: '-12px'
                }} />
              ) : 'Submit'}
            </Button>
            <Button variant="tonal" color="error" onClick={handleClose}>Cancel</Button>
          </DialogActions>
        </DialogContent>
      </form>
      <ImportQuizModal open={isModalOpen} onClose={onClose} activityId={activityId} handleClose={handleClose} />
    </Dialog>
  )
}

const QUESTION_TYPES = [
  { label: 'Yes or No', value: '1' },
  { label: 'Rating (1–5)', value: '2' },
  { label: 'Rating (1–10)', value: '3' },
  { label: 'Rating (1–5) - Emoji', value: '4' },
  { label: 'Rating (1–5) - Star', value: '5' },
  { label: 'Subjective Answer', value: '6' },
  { label: 'Multiple Choice', value: '7' },
  { label: 'Likert Scale', value: '8' },
  { label: 'Satisfaction Scale', value: '9' },
  { label: 'Quality Scale', value: '10' },
]

const OPTION_BASED_TYPES = ['7', '8', '9', '10']

const SurveySkeleton = ({ isTablet }) => (
  <>
    {[1, 2, 3].map(i => (
      <Box
        key={i}
        sx={{
          display: 'grid',
          gridTemplateColumns: isTablet
            ? '40px 1fr auto'
            : '30px 1fr 170px 140px 40px',
          gap: 2,
          mb: 4
        }}
      >
        <Skeleton width={20} height={30} />
        <Skeleton height={40} />
        {!isTablet && <Skeleton height={40} />}
        <Skeleton width={80} height={30} />
        <Skeleton width={30} height={30} />
      </Box>
    ))}
  </>
)

const labelOption = {
  "7": "Define your custom options",
  "8": "Define your Likert scale",
  "9": "Define your Satisfaction scale",
  "10": "Define your Quality scale"
}

const MCQModalComponent = ({ open, setOpen, activeQuestionId, setOptionData, optionData }) => {
  const handleClose = () => setOpen(false)

  const [customOptions, setCustomOptions] = useState([''])
  const [allowMulti, setAllowMulti] = useState(false)
  const [errors, setErrors] = useState([])
  const [addNeutral, setAddNeutral] = useState(false)
  const [minOptionError, setMinOptionError] = useState('')

  // Pre-fill modal state from optionData
  useEffect(() => {
    if (!open) return

    setErrors([])
    setAllowMulti(false)
    setAddNeutral(false)
    setCustomOptions([''])

    if (optionData?.option?.length) {
      if (activeQuestionId === '7') {
        setCustomOptions(optionData.option.map(o => o.value))
        setAllowMulti(optionData.multiOption || false)
      }

      if (activeQuestionId === '8') {
        const hasNeutral = optionData.option.some(o => o.value === 'Neutral')

        setAddNeutral(hasNeutral)
      }

      if (activeQuestionId === '9') {
        // Prefill if needed
      }

      if (activeQuestionId === '10') {
        // Prefill if needed
      }
    }
  }, [open, optionData])

  const likertOptions = addNeutral
    ? ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']
    : ['Strongly Disagree', 'Disagree', 'Agree', 'Strongly Agree']

  const satisfactionOptions = [
    'Very Dissatisfied',
    'Dissatisfied',
    'Neutral',
    'Satisfied',
    'Very Satisfied'
  ]

  const qualityOptions = ['Poor', 'Good', 'Excellent']

  const MAX_OPTIONS = 10

  const addCustomOption = () => {
    if (customOptions.length >= MAX_OPTIONS) return
    setCustomOptions(prev => [...prev, ''])
  }

  const updateCustomOption = (index, value) => {
    const updated = [...customOptions]

    updated[index] = value

    setCustomOptions(updated)

    setErrors(prev => {
      const err = [...prev]

      err[index] = false

      return err
    })
    setMinOptionError('')
  }

  const removeCustomOption = index => {
    if (customOptions.length <= 2) return
    setCustomOptions(prev => prev.filter((_, i) => i !== index))
    setErrors(prev => prev.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    let payload = []

    setMinOptionError('')
    setErrors([])

    if (activeQuestionId === '7') {

      if (customOptions.length < 2) {
        setMinOptionError('At least 2 options are required')

        return
      }

      const validationErrors = customOptions.map(opt => !opt.trim())

      if (validationErrors.some(Boolean)) {

        setErrors(validationErrors)

        return
      }

      payload = customOptions.map((opt, index) => ({
        index,
        value: opt.trim()
      }))
    }

    if (activeQuestionId === '8') {
      payload = likertOptions.map((opt, index) => ({
        index,
        value: opt
      }))
    }

    if (activeQuestionId === '9') {
      payload = satisfactionOptions.map((opt, index) => ({
        index,
        value: opt
      }))
    }

    if (activeQuestionId === '10') {
      payload = qualityOptions.map((opt, index) => ({
        index,
        value: opt
      }))
    }

    setOptionData({
      option: payload,
      multiOption: activeQuestionId === '7' ? allowMulti : false
    })

    setOpen(false)
  }

  return (
    <Dialog open={open} fullWidth maxWidth="lg" sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}>
      <DialogCloseButton onClick={handleClose} disableRipple>
        <i className="tabler-x" />
      </DialogCloseButton>

      <DialogTitle textAlign="center">{labelOption?.[activeQuestionId] || ''}</DialogTitle>

      <DialogContent>
        {activeQuestionId === '7' &&
          customOptions.map((opt, index) => (
            <Box key={index} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ flex: 1 }}>
                <Typography>Option {index + 1}</Typography>
                <TextField
                  fullWidth
                  value={opt}
                  error={errors[index]}
                  helperText={errors[index] && 'Option cannot be empty'}
                  onChange={e => updateCustomOption(index, e.target.value)}
                />
                {minOptionError && (
                  <Typography color="error" variant="caption" sx={{ mb: 1 }}>
                    {minOptionError}
                  </Typography>
                )}
              </Box>
              <IconButton
                color="error"
                size="small"
                disabled={customOptions.length <= 2}
                onClick={() => removeCustomOption(index)}
                sx={{ mt: 3 }}
              >
                <i className="tabler-trash" />
              </IconButton>
            </Box>
          ))}

        {activeQuestionId === '7' && (
          <>
            <Button onClick={addCustomOption} variant="contained">
              Add Option
            </Button>
            <Box sx={{ display: 'flex', justifyContent: 'end' }}>
              <FormControlLabel
                control={<Checkbox checked={allowMulti} onChange={e => setAllowMulti(e.target.checked)} />}
                label="Allow Multiselect"
              />
            </Box>
          </>
        )}

        {activeQuestionId === '8' && (
          <>
            <FormControlLabel
              control={<Checkbox checked={addNeutral} onChange={e => setAddNeutral(e.target.checked)} />}
              label="Add Neutral"
            />
            {likertOptions.map((opt, i) => (
              <TextField key={i} fullWidth disabled value={opt} sx={{ mb: 2 }} />
            ))}
          </>
        )}

        {activeQuestionId === '9' &&
          satisfactionOptions.map((opt, i) => (
            <TextField key={i} fullWidth disabled value={opt} sx={{ mb: 2 }} />
          ))}

        {activeQuestionId === '10' &&
          qualityOptions.map((opt, i) => (
            <TextField key={i} fullWidth disabled value={opt} sx={{ mb: 2 }} />
          ))}
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'center' }}>
        <Button variant="contained" onClick={handleSave}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ---------- Survey Modal Component ----------
const SurveyModalComponent = ({ open, setISOpen, API_URL, token, mId, questions, setQuestions, handleFetchQuestion, fetching }) => {
  const [loading, setLoading] = useState(false)
  const [optionData, setOptionData] = useState()
  const [activeQuestionRowId, setActiveQuestionRowId] = useState(null)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.down('md'))
  const [mcqOpen, setMCQOpen] = useState(false)
  const [activeQuestionId, setActiveQuestionId] = useState(null)
  const { handleSubmit } = useForm()

  const handleClose = () => {
    setISOpen(false)
    handleFetchQuestion()
  }

  const handleQuestionChange = (id, field, value) => {
    setQuestions(prev =>
      prev.map(q =>
        q.id === id
          ? {
            ...q,
            [field]: value,
            errors: { ...q.errors, [field]: false }
          }
          : q
      )
    )
  }

  const addQuestion = () => setQuestions(prev => [...prev, createEmptyQuestion()])
  const removeQuestion = id => questions?.length > 1 && setQuestions(prev => prev.filter(q => q.id !== id))

  const validateQuestions = () => {
    let valid = true

    setQuestions(prev =>
      prev.map(q => {
        const textError = !q.text.trim()
        const typeError = !q.type

        if (textError || typeError) valid = false

        return { ...q, errors: { text: textError, type: typeError } }
      })
    )

    return valid
  }

  // Sync optionData from modal to questions
  useEffect(() => {
    if (!optionData || !activeQuestionRowId) return
    setQuestions(prev =>
      prev.map(q =>
        q.id === activeQuestionRowId
          ? { ...q, options: optionData.option, multiOption: optionData.multiOption }
          : q
      )
    )
  }, [optionData])

  const handleSaveSurvey = async () => {
    if (!validateQuestions()) return
    setLoading(true)
    let activeError = false

    try {
      const payload = questions.map((q, index) => {
        const baseQuestion = { text: q.text.trim(), type: q.type, mandatory: q.mandatory }

        if (OPTION_BASED_TYPES.includes(q.type)) {
          if (!q.options || q.options.length === 0) {
            toast.error(`Question ${index + 1} requires at least one option`)
            activeError = true
          }
        }

        if (q.options?.length) {
          baseQuestion.options = q.options
          baseQuestion.multiOption = q.multiOption
        }

        return baseQuestion
      })

      if (activeError) return

      const response = await fetch(`${API_URL}/company/module/survey/setting/${mId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ questions: payload })
      })

      if (response.ok) {
        toast.success('Survey setting saved successfully')
        handleFetchQuestion()
        handleClose()
      } else {
        toast.error('Failed to save survey settings')
      }
    } catch (err) {
      console.error(err)
      toast.error('An error occurred while saving survey')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} fullWidth maxWidth="lg" fullScreen={isMobile} sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}>
      <DialogCloseButton onClick={handleClose} disableRipple>
        <i className="tabler-x" />
      </DialogCloseButton>

      <DialogTitle sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Add Survey</DialogTitle>

      <form onSubmit={handleSubmit(handleSaveSurvey)} noValidate>
        <DialogContent sx={{ maxHeight: isMobile ? 'none' : '70vh', overflowY: 'auto', px: { xs: 2, sm: 4 }, pt: 2 }}>
          {fetching ? (
            <SurveySkeleton isTablet={isTablet} />
          ) : (
            questions.map((q, index) => (
              <Box key={index} sx={{ display: 'grid', gridTemplateColumns: isTablet ? '40px 1fr auto' : '30px 1fr 200px 140px 40px', gap: 2, mb: 4, pb: isTablet ? 2 : 0, borderBottom: isTablet ? `1px solid ${theme.palette.divider}` : 'none' }}>
                <Typography sx={{ mt: 1 }}>{index + 1}.</Typography>

                <Box sx={{ gridColumn: isTablet ? '2 / 4' : 'auto' }}>
                  <TextField fullWidth size="small" value={q.text} placeholder="Enter question" error={q.errors.text} helperText={q.errors.text ? 'Question text is required' : `${q.text?.length}/300`} onChange={e => handleQuestionChange(q.id, 'text', e.target.value)} inputProps={{ maxLength: 300 }} />
                </Box>

                <Box sx={{ gridColumn: isTablet ? '2 / 4' : 'auto', display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ flex: 1, minWidth: 200 }}>
                    <Select size="small" fullWidth value={q.type} error={q.errors.type} onChange={e => handleQuestionChange(q.id, 'type', e.target.value)}>
                      {QUESTION_TYPES.map(type => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                    {q.errors.type && <Typography variant="caption" color="error">Question type is required</Typography>}
                  </Box>

                  {OPTION_BASED_TYPES.includes(q.type) && (
                    <Button
                      size="small"
                      variant="contained"
                      sx={{ whiteSpace: 'nowrap' }}
                      onClick={() => {
                        setActiveQuestionId(q.type)
                        setActiveQuestionRowId(q.id)
                        const currentQuestion = questions.find(ques => ques.id === q.id)

                        setOptionData(currentQuestion?.options ? { option: currentQuestion.options, multiOption: currentQuestion.multiOption } : { option: [], multiOption: false })
                        setMCQOpen(true)
                      }}
                    >
                      View Options
                    </Button>
                  )}

                  <Box sx={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                    <Checkbox size="small" checked={q.mandatory} onChange={e => handleQuestionChange(q.id, 'mandatory', e.target.checked)} />
                    <Typography variant="body2">Mandatory</Typography>
                  </Box>
                </Box>

                <Box>
                  <IconButton size="small" color="error" disabled={questions.length === 1} onClick={() => removeQuestion(q.id)}>
                    <i className="tabler-trash" />
                  </IconButton>
                </Box>
              </Box>
            ))
          )}

          <Button variant="contained" sx={{ ml: isTablet ? 0 : 8 }} onClick={addQuestion}>
            Add Question
          </Button>
        </DialogContent>

        <DialogActions sx={{ flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 6, px: 3, py: 3 }}>
          <Button type="submit" variant="contained" disabled={loading} fullWidth={isMobile}>
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Submit'}
          </Button>
          <Button variant="tonal" color="error" onClick={handleClose} fullWidth={isMobile}>
            Cancel
          </Button>
        </DialogActions>
      </form>

      <MCQModalComponent open={mcqOpen} setOpen={setMCQOpen} activeQuestionId={activeQuestionId} setOptionData={setOptionData} optionData={optionData} />
    </Dialog>
  )
}

const ContentFlowComponent = ({ setOpen, activities, API_URL, token, fetchActivities, mId }) => {

  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingError, setEditingError] = useState("");

  const [selectedId, setSelectedId] = useState();
  const [isOpen, setISOpen] = useState(false);
  const [activityId, setActivityId] = useState();
  const [docURL, setDocURL] = useState();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [logData, setLogData] = useState();

  const [questions, setQuestions] = useState([]);
  const [fetching, setFetching] = useState(false);

  const [orderType, setOrderType] = useState("any"); // ✅ correct useState syntax

  const handleOrderChange = (event) => {
    setOrderType(event.target.value); // update state when radio changes
  };

  const [checkCertificate, setCheckCertificate] = useState(false);
  const [selectedCertificateId, setSelectedCertificateId] = useState(null);
  const [certificateData, setCertificateData] = useState([]);

  const [isFeedbackChecked, setIsFeedbackChecked] = useState(false);
  const [isMandatoryChecked, setIsMandatoryChecked] = useState(false);

  const [surveyModal, setSurveyModal] = useState(false);

  const [loading, setLoading] = useState(false);

  const { lang } = useParams();
  const router = useRouter();
  const { handleSubmit, control } = useForm();

  // Fetch certificates
  const handleFetchCertificate = async () => {
    try {
      const response = await fetch(`${API_URL}/company/certificate/data`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();

      if (response.ok) setCertificateData(result.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  // Fetch survey questions
  const handleFetchQuestion = async () => {
    setFetching(true);

    try {
      const response = await fetch(`${API_URL}/company/module/survey/setting/${mId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const value = await response.json();

      if (response.ok && Array.isArray(value?.data)) {
        setQuestions(
          value.data?.length
            ? value.data.map((q) => ({
              id: Date.now() + Math.random(),
              text: q.question || "",
              options: q.options || [],
              multiOption: q.multiOption || false,
              type: q.questionsType || "",
              mandatory: q.mandatory || false,
              errors: { text: false, type: false },
            }))
            : []
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  const fetchModuleSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/company/modules/save/settings/${mId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();

      if (response.ok && result.data) {
        setOrderType(result.data.orderType || "any");
        setCheckCertificate(result.data.certificateEnabled || false);
        setSelectedCertificateId(result.data.selectedCertificateId || null);
        setIsFeedbackChecked(result.data.feedbackSurveyEnabled || false);
        setIsMandatoryChecked(result.data.mandatory || false);
      }
    } catch (error) {
      console.error("Error fetching module settings:", error);
    }
  };

  useEffect(() => {
    if (API_URL && token) {
      fetchModuleSettings()
      handleFetchCertificate();
      handleFetchQuestion();
    }
  }, [API_URL, token]);

  // Handle activity card click
  const handleCardClick = (activity) => {
    const isDocumentType = activity.module_type_id === "688723af5dd97f4ccae68834";
    const quesLength = activity?.questions?.length || 0;

    if (quesLength > 0) {
      router.replace(`/${lang}/apps/quiz/${mId}/${activity?._id}`);
    } else {
      setISOpen(false);
      setIsModalOpen(false);

      setTimeout(() => {
        setLogData(activity);
        setActivityId(activity._id);
        setSelectedId(activity.module_type_id);

        if (isDocumentType && activity.document_data?.image_url) {
          setDocURL(activity.document_data.image_url);
          setIsModalOpen(true);
        } else {
          setISOpen(true);
        }
      }, 10);
    }
  };

  const handleChangeName = async (id) => {
    if (!editingTitle.trim()) {
      setEditingError("Title is required");

      return;
    }

    if (editingTitle?.length > 150) {
      setEditingError("Title cannot exceed 150 characters");

      return;
    }

    setEditingError("");

    try {
      const response = await fetch(`${API_URL}/company/activity/set-name/${mId}/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ title: editingTitle }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Activity name saved successfully", { autoClose: 1000 });
        fetchActivities();
      } else {
        toast.error(result.message || "Failed to update name");
      }
    } catch (error) {
      toast.error("Error updating activity name");
    }

    setEditingId(null);
    setEditingTitle("");
  };

  const handleEditClick = (activity) => {
    setEditingId(activity._id);
    setEditingTitle(activity?.name || activity?.activity_type?.activity_data?.title || "");
    setEditingError("");
  };

  const handleDeleteContent = async (id) => {
    try {
      const response = await fetch(`${API_URL}/company/activity/delete/${mId}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Activity deleted successfully", { autoClose: 1000 });
        fetchActivities();
      } else {
        toast.error(data.message || "Failed to delete activity");
      }
    } catch (error) {
      toast.error("Error deleting activity");
    }
  };

  const handleCheckboxChange = (event) => {
    setSelectedCertificateId(null);
    setCheckCertificate(event.target.checked);
  };

  const moduleSettingSave = async (formData) => {
    try {

      setLoading(true);

      if (checkCertificate && !selectedCertificateId) {
        toast.error("Please select a certificate", {
          autoClose: 1000
        });

        return; // stop submission
      }

      const payload = {
        orderType: orderType || "any",
        certificateEnabled: checkCertificate,
        selectedCertificateId: checkCertificate ? selectedCertificateId : null,
        feedbackSurveyEnabled: isFeedbackChecked,
        mandatory: isMandatoryChecked,
      };


      const response = await fetch(`${API_URL}/company/modules/save/settings/${mId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success("Module settings saved successfully", { autoClose: 1000 });
        setLoading(false);
      }

    } catch (error) {
      console.error("Error saving module settings:", error);
      toast.error("Failed to save module settings");
    }
  };

  return (
    <Box p={3}>
      <Grid container spacing={3}>
        {/* Left Column - Activities */}
        <Grid item size={{ xs: 12, md: 7 }}>
          <Box sx={{ maxHeight: "70vh", overflowY: "auto", pr: 1 }}>
            {activities?.length > 0 ? (
              activities.map((activity, index) => (
                <Card
                  key={index}
                  variant="outlined"
                  sx={{
                    borderColor: "#0A2E73",
                    borderRadius: 2,
                    p: 2,
                    mb: 4,
                    mt: 1,
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    "&:hover": {
                      boxShadow: 3,
                      transform: "translateY(-2px)",
                      borderColor: "#0845b3",
                    },
                  }}
                >
                  <Grid container alignItems="center" justifyContent="space-between" spacing={2}>
                    <Grid item xs>
                      <Box display="flex" alignItems="flex-start" gap={2}>
                        <Box
                          sx={{ inlineSize: 40, blockSize: 40, cursor: "pointer" }}
                          onClick={() => handleCardClick(activity)}
                          dangerouslySetInnerHTML={{
                            __html: activity?.activity_type?.activity_data?.svg_content,
                          }}
                        />
                        <Box flex={1}>
                          <Box display="flex" alignItems="center">
                            {editingId === activity._id ? (
                              <Box display="flex" alignItems="center" gap={1}>
                                <InputBase
                                  value={editingTitle}
                                  onChange={(e) => setEditingTitle(e.target.value)}
                                  sx={{
                                    fontWeight: 600,
                                    fontSize: 16,
                                    borderBottom: editingError ? "1px solid red" : "1px solid #ccc",
                                    width: "100%",
                                  }}
                                  autoFocus
                                  placeholder="Enter title"
                                />
                                <IconButton
                                  onClick={() => handleChangeName(activity._id)}
                                  size="small"
                                  sx={{ color: "#0A2E73" }}
                                >
                                  <i className="tabler-check" />
                                </IconButton>
                                {editingError && (
                                  <Typography variant="caption" color="error" ml={0.5}>
                                    {editingError}
                                  </Typography>
                                )}
                              </Box>
                            ) : (
                              <Box display="flex" alignItems="center" gap={1}>
                                <Typography fontWeight={600}>
                                  {activity?.name || activity?.activity_type?.activity_data?.title}
                                </Typography>
                                <IconButton
                                  onClick={() => handleEditClick(activity)}
                                  size="small"
                                  sx={{ color: "#0A2E73" }}
                                >
                                  <i className="tabler-edit" style={{ fontSize: 18 }} />
                                </IconButton>
                              </Box>
                            )}
                          </Box>

                          <Typography color="error" variant="body2" sx={{ mt: 0.5 }}>
                            {activity.description}
                          </Typography>

                          <Button
                            size="small"
                            variant="contained"
                            sx={{
                              mt: 1,
                              fontSize: "0.75rem",
                              textTransform: "none",
                              backgroundColor: "#00b66c",
                              "&:hover": { backgroundColor: "#009956" },
                              borderRadius: 10,
                              px: 2,
                              minWidth: "unset",
                            }}
                          >
                            Draft
                          </Button>
                        </Box>
                      </Box>
                    </Grid>

                    <Grid item>
                      <IconButton
                        size="small"
                        sx={{ color: "#0A2E73" }}
                        onClick={() => handleDeleteContent(activity._id)}
                      >
                        <i className="tabler-trash" />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Card>
              ))
            ) : (
              <Typography textAlign="center">No activity found</Typography>
            )}
          </Box>
        </Grid>

        {/* Right Column - Module Settings */}
        <Grid item size={{ xs: 12, md: 5 }}>
          <Box display="flex" justifyContent="flex-start" gap={2} mb={2}>
            <Button type="button" variant="contained" color="primary" onClick={() => setOpen(true)}>
              Add Activity
            </Button>
          </Box>

          <form onSubmit={handleSubmit(moduleSettingSave)}>
            {/* Order Selection */}
            <RadioGroup
              value={orderType}        // ✅ controlled component
              onChange={handleOrderChange} // ✅ handle state update
              sx={{ mb: 3 }}
              name="orderType"
            >
              <FormControlLabel value="ordered" control={<Radio />} label="Learner needs to follow the order" />
              <FormControlLabel value="any" control={<Radio />} label="Learner can attempt any order" />
            </RadioGroup>

            <Typography variant="subtitle1" gutterBottom>
              On completion of Module launch the following
            </Typography>

            <Box display="flex" flexDirection="column" gap={3}>
              {/* Certificate Checkbox */}
              <FormControlLabel
                control={<Checkbox checked={checkCertificate} onChange={handleCheckboxChange} />}
                label={<Typography>Certificate</Typography>}
              />

              {checkCertificate && (
                <Box sx={{ display: "flex", gap: 2, minWidth: "max-content", flexWrap: "wrap" }}>
                  {certificateData.map((item, index) => {
                    const id = item._id ?? index;
                    const isSelected = selectedCertificateId === id;

                    return (
                      <Card
                        key={id}
                        sx={{
                          width: 180,
                          height: 120,
                          borderRadius: 2,
                          border: isSelected ? "2px solid #1976d2" : "1px solid #e0e0e0",
                          cursor: "pointer",
                          position: "relative",
                        }}
                        onClick={() => setSelectedCertificateId(id)}
                      >
                        {isSelected && (
                          <Box
                            sx={{
                              position: "absolute",
                              top: 6,
                              right: 6,
                              backgroundColor: "primary.main",
                              color: "#fff",
                              borderRadius: "50%",
                              width: 18,
                              height: 18,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 12,
                            }}
                          >
                            <i className="tabler-check" />
                          </Box>
                        )}
                        <Box
                          sx={{
                            width: "100%",
                            height: "100%",
                            backgroundImage: `url(${assert_url}/frames/${item.backgroundImage})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }}
                        >
                          <Box sx={{ p: 1, textAlign: "center" }}>
                            {item?.logoURL && (
                              <img
                                src={`${assert_url}/company_logo/${item.logoURL}`}
                                alt="Logo"
                                width={40}
                                height={20}
                                style={{ objectFit: "contain" }}
                              />
                            )}
                            <Typography sx={{ fontSize: 10, fontWeight: 600 }}>{item.title}</Typography>
                            <Typography sx={{ fontSize: 9 }}>[UserName]</Typography>
                            <Typography sx={{ fontSize: 8, color: "text.secondary" }}>On [date]</Typography>
                          </Box>
                        </Box>
                      </Card>
                    );
                  })}
                </Box>
              )}

              {/* Feedback Survey */}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isFeedbackChecked}
                    onChange={(e) => setIsFeedbackChecked(e.target.checked)}
                    disabled={!fetching && questions?.length === 0}
                  />
                }
                label={
                  <Box display="flex" alignItems="center" gap={2}>
                    <Typography>Feedback survey</Typography>
                    <Button size="small" variant="outlined" onClick={() => setSurveyModal(true)}>
                      Add A Survey
                    </Button>
                  </Box>
                }
              />

              {/* Mandatory Checkbox */}
              {isFeedbackChecked && (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isMandatoryChecked}
                      onChange={(e) => setIsMandatoryChecked(e.target.checked)}
                      disabled={!fetching && questions?.length === 0}
                    />
                  }
                  label="Mandatory"
                />
              )}
            </Box>

            <Box mt={3}>
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? (
                  <CircularProgress
                    size={24}
                  />
                ) : (
                  "Save"
                )}
              </Button>
            </Box>
          </form>
        </Grid>
      </Grid>

      <SurveyModalComponent
        open={surveyModal}
        setISOpen={setSurveyModal}
        API_URL={API_URL}
        setFetching={setFetching}
        fetching={fetching}
        token={token}
        setQuestions={setQuestions}
        questions={questions}
        handleFetchQuestion={handleFetchQuestion}
        mId={mId}
      />

      <ShowFileModal open={isModalOpen} setOpen={setIsModalOpen} docURL={docURL} />

      <ActivityModal
        fetchActivities={fetchActivities}
        key={activityId}
        open={isOpen}
        id={selectedId}
        setISOpen={setISOpen}
        editData={logData}
        API_URL={API_URL}
        token={token}
        mId={mId}
        activityId={activityId}
      />
    </Box>
  );
};

const ImportUserModal = ({
  open, handleClose, API_URL, mId, id, activityId, token,
  fetchActivities, users, setAllData
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

  const columns = useMemo(() => {
    if (!excelData?.length) return [];

    return Object.keys(excelData[0]).map(key => ({
      header: key,
      accessorKey: key,
      cell: ({ row, getValue }) => {
        const value = getValue();

        const error = rowErrors[row.index];

        return (
          <div>
            {value}
            {key === "EmpId/Email" && (
              <div>
                {error && (
                  <Typography variant="caption" color="var(--mui-palette-error-main)">
                    {error}
                  </Typography>
                )}
              </div>
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

const MAX_PAIRS = 5;

// Helper to normalize values into strings
const normalizeOptions = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val.map((v) => String(v));

  return [String(val)];
};

const SettingComponent = ({ activities }) => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const { data: session } = useSession();
  const token = session?.user?.token;
  const { mId } = useParams();

  const [pushEnrollmentSetting, setPushEnrollmentSetting] = useState("3");
  const [selfEnrollmentSetting, setSelfEnrollmentSetting] = useState("3");

  const [dueType, setDueType] = useState("relative");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [dueDays, setDueDays] = useState(5);
  const [lockModule, setLockModule] = useState(false);

  const [selectedPairIndex, setSelectedPairIndex] = useState(null);
  const [allData, setAllData] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const [createData, setCreateData] = useState({
    designation: [],
    department: [],
    group: [],
    region: [],
    user: [],
  });

  const [targetOptionPairs, setTargetOptionPairs] = useState([
    { target: "", options: [], secondOptions: [] },
  ]);

  // Fetch available designations, departments, groups, etc.
  const fetchCreateData = useCallback(async () => {
    if (!API_URL || !token) return;

    try {
      const res = await fetch(`${API_URL}/company/program/schedule/create`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      const body = await res.json();

      if (res.ok) {

        const cd = {
          designation: body?.data?.designation || [],
          department: body?.data?.department || [],
          group: body?.data?.group || [],
          region: body?.data?.region || [],
          user: body?.data?.user || [],
        };

        setCreateData(cd);

        return cd;
      } else {
        console.error("Error fetching create data:", body);
      }
    } catch (err) {
      console.error("Error fetching create data:", err);
    }

    return null;
  }, [API_URL, token]);

  useEffect(() => {
    if (API_URL && token) {
      fetchCreateData();
    }
  }, [API_URL, token, fetchCreateData]);

  // Fetch program schedule
  useEffect(() => {
    const fetchProgramSchedule = async () => {
      try {
        if (!token || !mId) return;

        const res = await fetch(
          `${API_URL}/company/program/schedule/data/${mId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.ok) {
          const errText = await res.text();

          throw new Error(
            `Request failed with ${res.status} ${res.statusText}: ${errText}`
          );
        }

        const body = await res.json();

        const result = body?.data || {};

        setPushEnrollmentSetting(
          (result.pushEnrollmentSetting ?? "3").toString()
        );
        setSelfEnrollmentSetting(
          (result.selfEnrollmentSetting ?? "3").toString()
        );
        setLockModule(result.lockModule ?? false);

        if (result.start_date && result.end_date) {
          setDueType("fixed");
          setStartDate(new Date(result.start_date));
          setEndDate(new Date(result.end_date));
        } else if (result.dueDays != null) {
          setDueType("relative");
          setDueDays(result.dueDays);
        }

        if (Array.isArray(result.targetPairs) && result.targetPairs?.length > 0) {
          const enriched = result.targetPairs.map((pair) => {
            let secondOptions = [];

            switch (pair.target) {
              case "1":
                secondOptions = createData.designation || [];
                break;
              case "2":
                secondOptions = createData.department || [];
                break;
              case "3":
                secondOptions = createData.group || [];
                break;
              case "4":
                secondOptions = createData.region || [];
                break;
              case "5":
                secondOptions = createData.user || [];
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
      } catch (err) {
        console.error("Error fetching program schedule:", err);
      }
    };

    fetchProgramSchedule();
  }, [API_URL, token, mId, createData]);

  // Re-enrich secondOptions when createData changes
  useEffect(() => {
    setTargetOptionPairs((prev) =>
      prev.map((pair) => {
        let secondOptions = [];

        switch (pair.target) {
          case "1":
            secondOptions = createData.designation || [];
            break;
          case "2":
            secondOptions = createData.department || [];
            break;
          case "3":
            secondOptions = createData.group || [];
            break;
          case "4":
            secondOptions = createData.region || [];
            break;
          case "5":
            secondOptions = createData.user || [];
            break;
          default:
            secondOptions = [];
        }

        return { ...pair, secondOptions, options: normalizeOptions(pair.options) };
      })
    );
  }, [createData]);

  // Auto-select users from modal
  useEffect(() => {
    if (
      allData?.length > 0 &&
      selectedPairIndex !== null &&
      targetOptionPairs[selectedPairIndex]?.target === "5"
    ) {
      setTargetOptionPairs((prevPairs) => {
        const updatedPairs = prevPairs.map((p, i) => ({ ...p }));
        const users = updatedPairs[selectedPairIndex]?.secondOptions || [];

        const selectedUsers = users
          .filter((u) => allData.includes(String(u._id)))
          .map((u) => String(u._id));

        updatedPairs[selectedPairIndex].options = normalizeOptions(selectedUsers);

        return updatedPairs;
      });
    }
  }, [allData, selectedPairIndex, targetOptionPairs]);

  // Handlers
  const handleFirstChange = (index, value) => {
    setTargetOptionPairs((prev) => {
      const updated = prev.map((p) => ({ ...p }));

      updated[index].target = value;
      updated[index].options = [];

      switch (value) {
        case "1":
          updated[index].secondOptions = createData.designation || [];
          break;
        case "2":
          updated[index].secondOptions = createData.department || [];
          break;
        case "3":
          updated[index].secondOptions = createData.group || [];
          break;
        case "4":
          updated[index].secondOptions = createData.region || [];
          break;
        case "5":
          updated[index].secondOptions = createData.user || [];
          break;
        default:
          updated[index].secondOptions = [];
      }

      return updated;
    });
  };

  const handleSecondChange = (index, value) => {
    setTargetOptionPairs((prev) => {
      const updated = prev.map((p) => ({ ...p }));

      updated[index].options = normalizeOptions(value);

      return updated;
    });
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

  const [isPublish, setIsPublish] = useState(false)

  const handleImportUser = (index) => {
    setSelectedPairIndex(index);
    setIsOpen(true);
  };

  const handleDataSave = async (value) => {
    if (!API_URL || !token || !mId) return;

    setIsPublish(true)

    try {
      const res = await fetch(`${API_URL}/company/program/schedule/${mId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(value),
      });

      const body = await res.json();

      if (res.ok) {

        setIsPublish(false)

        toast.success(body?.message || "Setting saved successfully", {
          autoClose: 1000,
        });

      } else {

        toast.error(body?.message || "Failed to save settings");
      }
    } catch (err) {

      console.error("Error saving settings:", err?.message || err);
      toast.error("Something went wrong!");
    } finally {

      setIsPublish(false)
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();

    if (dueType === "fixed" && startDate > endDate) {
      toast.error("Start date cannot be later than end date");

      return;
    }

    const payload = {
      pushEnrollmentSetting,
      selfEnrollmentSetting,
      targetPairs: targetOptionPairs.map((p) => ({
        target: p.target,
        options: p.options,
      })),
      lockModule,
      dueType,
      start_date: dueType === "fixed" ? startDate.toISOString() : null,
      end_date: dueType === "fixed" ? endDate.toISOString() : null,
      dueDays: dueType === "relative" ? Number(dueDays) : null,
    };

    handleDataSave(payload);
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedPairIndex(null);
    setAllData([]);
  };

  const now = new Date();

  const isSameDay = (d1, d2) =>
    d1 && d2 && d1.toDateString() === d2.toDateString();

  const startOfDay = () => {
    const d = new Date();

    d.setHours(0, 0, 0, 0);

    return d;
  };

  const endOfDay = () => {
    const d = new Date();

    d.setHours(23, 59, 59, 999);

    return d;
  };


  useEffect(() => {
    if (startDate && endDate && startDate > endDate) {
      setEndDate(startDate);
    }
  }, [startDate]);

  useEffect(() => {
    if (startDate && endDate && endDate < startDate) {
      setStartDate(endDate);
    }
  }, [endDate]);


  const dateInputStyle = {
    width: "200px",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "14px",
    fontFamily: "Roboto, sans-serif",
    outline: "none",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    cursor: "pointer",
  };

  return (
    <form onSubmit={onSubmit}>
      <Grid container spacing={4}>
        <Grid item size={{ xs: 12, md: 9 }}>
          {/* Push Enrollment */}
          <Typography variant="h6" gutterBottom>
            Push Enrollment Settings
          </Typography>
          <RadioGroup
            value={pushEnrollmentSetting}
            onChange={(e) => setPushEnrollmentSetting(e.target.value)}
            sx={{ mb: 3 }}
          >
            <FormControlLabel
              value="1"
              control={<Radio />}
              label="To all existing & new Learners on this Content Folder"
            />
            <FormControlLabel
              value="2"
              control={<Radio />}
              label="To all existing & new Learners under this Content Folder who meet Target audience criteria"
            />
            {/* <FormControlLabel
              value="3"
              control={<Radio />}
              label="Let me select Learners while publishing"
            /> */}
          </RadioGroup>

          {/* Self Enrollment */}
          <Typography variant="h6" gutterBottom>
            Self-Enrollment Settings
          </Typography>
          <RadioGroup
            value={selfEnrollmentSetting}
            onChange={(e) => setSelfEnrollmentSetting(e.target.value)}
            sx={{ mb: 3 }}
          >
            <FormControlLabel
              value="1"
              control={<Radio />}
              label="Do not allow self enrollment"
            />
            <FormControlLabel
              value="2"
              control={<Radio />}
              label="Allow any Learner to self-enrol"
            />
            <FormControlLabel
              value="3"
              control={<Radio />}
              label='Allow Learners who meet the "target audience" criteria below to self-enrol'
            />
          </RadioGroup>

          {/* Target Audience */}
          <Typography variant="h6" gutterBottom>
            This Module Is Targeted At
          </Typography>
          {targetOptionPairs.map((pair, idx) => (
            <Grid container spacing={2} alignItems="center" mb={3} key={idx}>
              <Grid item size={{ xs: 12, md: 3 }}>
                <TextField
                  select
                  label="Select module targets"
                  fullWidth
                  size="small"
                  value={pair.target}
                  onChange={(e) => handleFirstChange(idx, e.target.value)}
                >
                  <MenuItem value="">Select Module Target</MenuItem>
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
                  <MenuItem
                    value="3"
                    disabled={targetOptionPairs.some(
                      (p, i) => p.target === "3" && i !== idx
                    )}
                  >
                    Group
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
                    value="5"
                    disabled={targetOptionPairs.some(
                      (p, i) => p.target === "5" && i !== idx
                    )}
                  >
                    User
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
                >
                  {pair.target !== "5" &&
                    (pair.secondOptions || []).map((item, i) => (
                      <MenuItem
                        key={String(item._id ?? i)}
                        value={String(item._id ?? item.id ?? item)}
                      >
                        {item.name || item.title || item.label || item._id}
                      </MenuItem>
                    ))}
                  {pair.target === "5" &&
                    (pair.secondOptions || []).map((item, i) => (
                      <MenuItem
                        key={String(item._id ?? i)}
                        value={String(item._id ?? item.id ?? item)}
                      >
                        {item.first_name} {item.last_name}
                      </MenuItem>
                    ))}
                </TextField>
              </Grid>

              {pair.target === "5" && (
                <Grid item size={{ xs: 12, md: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => handleImportUser(idx)}
                  >
                    Import User
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

          {/* Due Date Settings */}
          <Typography variant="h6" gutterBottom>
            Due Date Settings
          </Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={lockModule}
                onChange={(e) => setLockModule(e.target.checked)}
              />
            }
            label="Lock Module Post Due Date"
          />

          <RadioGroup
            value={dueType}
            onChange={(e) => setDueType(e.target.value)}
            sx={{ mt: 1, mb: 2 }}
          >
            {/* Fixed Due Date */}
            <FormControlLabel
              value="fixed"
              control={<Radio />}
              label={
                <Box
                  display="flex"
                  flexDirection="column"
                  alignItems="flex-start"
                  gap={2}
                >
                  <Typography variant="subtitle1">Fixed due date</Typography>

                  <Box display="flex" flexDirection="row" gap={4}>
                    {dueType === "fixed" && (
                      <Box>
                        <Typography variant="body2" gutterBottom>
                          Start time
                        </Typography>

                        <DatePicker
                          selected={startDate}
                          onChange={(date) => setStartDate(date)}
                          showTimeSelect
                          dateFormat="Pp"

                          minDate={now}
                          maxDate={endDate || null}

                          minTime={isSameDay(startDate, now) ? now : startOfDay()}
                          maxTime={
                            endDate && isSameDay(startDate, endDate)
                              ? endDate
                              : endOfDay()
                          }
                          customInput={<input style={dateInputStyle} />}
                        />
                      </Box>
                    )}

                    {dueType === "fixed" && (
                      <Box>
                        <Typography variant="body2" gutterBottom>
                          End date
                        </Typography>

                        <DatePicker
                          selected={endDate}
                          onChange={(date) => setEndDate(date)}
                          showTimeSelect
                          dateFormat="Pp"

                          minDate={startDate || now}
                          minTime={
                            isSameDay(endDate, startDate)
                              ? startDate
                              : isSameDay(endDate, now)
                                ? now
                                : startOfDay()
                          }
                          maxTime={endOfDay()}
                          customInput={<input style={dateInputStyle} />}
                        />
                      </Box>
                    )}
                  </Box>

                </Box>
              }
            />

            {/* Relative Due Date */}
            <FormControlLabel
              value="relative"
              control={<Radio />}
              label={
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography variant="subtitle1">
                    Relative due date (days)
                  </Typography>
                  {dueType === "relative" && (
                    <TextField
                      type="number"
                      size="small"
                      value={dueDays}
                      onChange={(e) => setDueDays(Number(e.target.value))}
                      inputProps={{ min: 1 }}
                    />
                  )}
                </Box>
              }
            />
          </RadioGroup>

          {/* Save Button */}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            sx={{ mt: 3 }}
            disabled={isPublish || !activities || activities?.length === 0}
          >
            {isPublish ? <CircularProgress size={24} color="inherit" /> : "Publish"}
          </Button>
        </Grid>
      </Grid>

      {/* Import User Modal */}
      <ImportUserModal
        open={isOpen}
        handleClose={handleClose}
        allData={allData}
        setAllData={setAllData}
      />
    </form>
  );
};

const ContentFlowModal = ({ open, data, setOpen, setSelected, selected, setNext, API_URL, token, mId, fetchActivities }) => {

  const handleChange = (selectedItem) => {
    setSelected(selectedItem?._id);
  }

  const submitActivity = async () => {
    try {
      const response = await fetch(`${API_URL}/company/activity/form/${mId}/${selected}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const result = await response.json();

      if (response.ok) {
        const value = result?.data;

        toast.success("Activity added successfully", {
          autoClose: 1000
        })
        fetchActivities()
        setSelected()
        setOpen(false)
      }

    } catch (error) {
      throw new Error(error)
    }
  }

  const handleNext = () => {
    submitActivity();
    setNext(true)
  }

  return (
    <>
      <Dialog
        fullWidth
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="lg"
        scroll="body"
        closeAfterTransition={false}
        sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
      >
        <DialogCloseButton onClick={() => {
          setOpen(false)
          setSelected()
        }} disableRipple>
          <i className="tabler-x" />
        </DialogCloseButton>

        <DialogTitle
          variant="h4"
          className="flex flex-col gap-2 text-center sm:pbs-5 sm:pbe-5 sm:pli-5"
        >
          <Typography component="span" className="flex flex-col items-center">
            Select any Activity to create
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ px: 2 }}>
            <RadioGroup
              name="custom-radios-icons"
              value={selected || ''}
              onChange={(e) => {

                const selectedItem = data?.appConfig?.activity_data?.find(
                  (item) => item.title === e.target.value
                )

                handleChange(selectedItem)
              }}
            >
              <Grid container spacing={4}>
                {data?.appConfig?.activity_data?.map((item, index) => {
                  const isSelected = selected === item._id

                  return (
                    <Grid item size={{ xs: 12, sm: 3 }} key={index}>
                      <Card
                        variant="outlined"
                        onClick={() => item.status && handleChange(item)}
                        sx={{
                          height: '100%',
                          cursor: 'pointer',
                          opacity: item.status ? 0.5 : 1,
                          borderColor: isSelected ? 'primary.main' : 'grey.300',
                          '&:hover': {
                            borderColor: item.status ? 'primary.main' : 'grey.300', // ✅ Prevent color change if disabled
                          },
                        }}
                      >
                        <CardContent
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            gap: 1.5,
                            px: 2,
                            py: 3,
                          }}
                        >
                          <Box
                            component="div"
                            sx={{ inlineSize: 40, blockSize: 40 }}
                            color={"black"}
                            dangerouslySetInnerHTML={{ __html: item.svg_content }}
                          />

                          <Radio
                            color="primary"
                            checked={isSelected}
                            value={item.title}
                          />

                          <Box>
                            <Typography variant="subtitle1" fontWeight={1000} color="black">
                              {item.title}
                            </Typography>
                            <Typography variant="body2" color="black">
                              {item.description}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>

                    </Grid>
                  )
                })}
              </Grid>
            </RadioGroup>
          </Box>
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button variant="outlined" disabled={!selected} onClick={handleNext}>
            Next
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

const AcitivityCard = () => {
  const [value, setValue] = useState('content_flow')
  const handleTabChange = (e, value) => setValue(value)
  const [data, setData] = useState();

  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const { data: session } = useSession();
  const token = session?.user?.token;
  const { lang: locale, mId: mId } = useParams()
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState();
  const [next, setNext] = useState(false);
  const [activity, setActivity] = useState()

  const fetchActivities = async () => {
    try {
      const response = await fetch(`${API_URL}/company/activity/${mId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const result = await response?.json();

      if (response.ok) {

        const value = result?.data;

        setActivity(value)
      }
    } catch (error) {
      throw new Error(error)
    }
  }

  const fetchFormData = async () => {
    try {
      const response = await fetch(`${API_URL}/company/activity/create/data`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const result = await response?.json();

      if (response.ok) {

        const value = result?.data;

        setData(value)
      }

    } catch (error) {
      throw new Error(error)
    }
  }

  useEffect(() => {
    if (API_URL && token) {
      fetchFormData();
      fetchActivities()
    }
  }, [API_URL, token])

  return (
    <PermissionGuard locale={locale} element={'isCompany'}>
      <Card>
        <CardContent>

          <TabContext value={value}>
            <TabList
              variant='scrollable'
              onChange={handleTabChange}
              className='border-b px-0 pt-0'
            >
              <Tab key={1} label='Content Flow' value='content_flow' />
              <Tab key={2} label='Setting' value='setting' />
            </TabList>

            <Box mt={3}>
              <TabPanel value='content_flow' className='p-0'>
                <ContentFlowComponent setOpen={setOpen} activities={activity} API_URL={API_URL} token={token} fetchActivities={fetchActivities} mId={mId} />
              </TabPanel>
              <TabPanel value='setting' className='p-0'>
                <SettingComponent activities={activity} />
              </TabPanel>
            </Box>
          </TabContext>
        </CardContent>
      </Card>
      <ContentFlowModal open={open} setOpen={setOpen} data={data} setSelected={setSelected} selected={selected} setNext={setNext} API_URL={API_URL} token={token} mId={mId} fetchActivities={fetchActivities} />
    </PermissionGuard>
  )
}

export default AcitivityCard;
