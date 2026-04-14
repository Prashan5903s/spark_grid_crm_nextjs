// MUI Imports

import { useEffect, useState } from 'react'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box';
import Snackbar from '@mui/material/Snackbar'
import FormControl from '@mui/material/FormControl'
import FormLabel from '@mui/material/FormLabel'
import CircularProgress from '@mui/material/CircularProgress'
import RadioGroup from '@mui/material/RadioGroup'
import Radio from '@mui/material/Radio'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import TextField from '@mui/material/TextField'

import Tab from '@mui/material/Tab'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'

import FormControlLabel from '@mui/material/FormControlLabel'

// React Hook Form
import { useForm, Controller } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { useDropzone } from 'react-dropzone'

// Valibot schema
import { array, string, object, pipe, minLength, maxLength, boolean, nonEmpty, value } from 'valibot'

// Component Imports

import { useSession } from 'next-auth/react'

import { toast } from 'react-toastify'

import AppReactDropzone from '@/libs/styles/AppReactDropzone';

import CustomTextField from '@core/components/mui/TextField'

import SkeletonFormComponent from '@/components/skeleton/form/page'

import { useApi } from '../../../../../utils/api';

// Third-party Imports


const schema = object({
    title: pipe(
        string(),
        minLength(1, 'Title is required'),
        maxLength(255, 'Title can be maximum of 300 characters')
    ),
})

const DocumentCardLayout = ({ data, onClose, moduleData }) => {

    const URL = process.env.NEXT_PUBLIC_API_URL
    const { data: session } = useSession()
    const token = session?.user?.token
    const [loading, setLoading] = useState(false)
    const [files, setFiles] = useState([]);
    const [item, setItem] = useState(data);
    const [media, setMedia] = useState(data?.content?.media);
    const { doPut } = useApi();
    const [cardItems, setCardItems] = useState([]);

    const [lastDeleted, setLastDeleted] = useState(null);
    const [undoTimeoutId, setUndoTimeoutId] = useState(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);

    const [switches, setSwitches] = useState({
        downloadable: false,
        shareable: false,
    });

    const initialQuestions = [
        { title: '', options: ['', '', '', ''], correct: '' }
    ];

    const [questions, setQuestions] = useState(initialQuestions);
    const [activeTab, setActiveTab] = useState('0');

    const handleChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const handleInputChange = (index, field, value) => {
        const updated = [...questions];

        updated[parseInt(activeTab)][field] = value;
        setQuestions(updated);
    };

    const handleOptionChange = (questionIndex, optionIndex, value) => {
        setQuestions(prev =>
            prev.map((q, i) =>
                i === questionIndex
                    ? {
                        ...q,
                        options: q.options.map((opt, j) =>
                            j === optionIndex ? value : opt
                        ),
                    }
                    : q
            )
        );
    };

    const handleDeleteQuestion = (index) => {
        const deletedQuestion = questions[index];

        const updated = [...questions];

        updated.splice(index, 1);

        setQuestions(updated);

        // Reset tab if the current is deleted
        if (activeTab === index.toString()) {
            setActiveTab('0');
        }

        // Save deleted for undo
        setLastDeleted({ question: deletedQuestion, index });
        setSnackbarOpen(true);

        // Start timeout to clear undo
        const timeout = setTimeout(() => {
            setLastDeleted(null);
            setSnackbarOpen(false);
        }, 5000);

        setUndoTimeoutId(timeout);
    };

    const handleUndo = () => {

        if (lastDeleted) {
            const updated = [...questions];

            updated.splice(lastDeleted.index, 0, lastDeleted.question);

            setQuestions(updated);
            setActiveTab(lastDeleted.index.toString());

            clearTimeout(undoTimeoutId);
            setLastDeleted(null);
            setSnackbarOpen(false);
        }
    };

    const handleAddQuestion = () => {
        setQuestions([...questions, { title: '', options: ['', '', '', ''], correct: '' }]);
        setActiveTab((questions.length).toString());
    };

    const current = questions[parseInt(activeTab)];

    const handleClose = () => {
        onClose(cardItems, item);
    }

    const handleSwitchChange = (event) => {
        const { name, checked } = event.target;

        setSwitches((prev) => ({
            ...prev,
            [name]: checked
        }));
    };

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: valibotResolver(schema),
        mode: 'onChange',
        defaultValues: {
            title: ''
        }
    })

    useEffect(() => {
        if (moduleData?.cards?.length > 0) {

            setCardItems(moduleData.cards);

            if (data?.content?.questions != undefined) {
                setQuestions(data?.content?.questions)
            }
        }
    }, [moduleData])

    useEffect(() => {
        if (item) {
            reset({
                title: data?.title || ''
            })
        }
    }, [item, reset])

    const onSubmit = async (values) => {

        // if (files.length == 0) {
        //     toast.error('Please upload the file first!'), { autoClose: 1200 };
        //     return;
        // }

        setLoading(true);

        const newData = {
            ...values,
            questions: questions,
        };

        const endpoint = `admin/module/${moduleData._id}/card/quiz/${data._id}`;


        await doPut({
            endpoint,
            values: newData,
            onSuccess: (response) => {
                onClose(response.data.cards);
                setItem(response.data.card);
                setCardItems(response.data.cards);
                toast.success(response.message, {
                    autoClose: 700
                });

            },
        });
        setLoading(false);
    };

    const { getRootProps, getInputProps } = useDropzone({
        multiple: false,
        maxSize: 5000000,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'], // PowerPoint
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],   // Word
            'application/msword': ['.doc'] // Legacy Word
        },
        onDrop: acceptedFiles => {
            setFiles(acceptedFiles.map(file => Object.assign(file)))
            setMedia([]);
        },
        onDropRejected: (rejectedFiles) => {

            const errorMessage = rejectedFiles.map(file => {

                if (file.errors.length > 0) {

                    return file.errors.map(error => {
                        switch (error.code) {
                            case 'file-invalid-type':
                                return `Invalid file type for ${file.file.name}.`;
                            case 'file-too-large':
                                return `File ${file.file.name} is too large.`;
                            case 'too-many-files':
                                return `Too many files selected.`;
                            default:
                                return `Error with file ${file.file.name}.`;
                        }
                    }).join(' ');
                }

                return `Error with file ${file.file.name}.`;
            });

            errorMessage.map(error => {
                toast.error(error, {
                    hideProgressBar: false
                });
            })

        }
    })

    const handleRemove = (fileToRemove) => {
        setFiles(files.filter(file => file !== fileToRemove));
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <DialogTitle
                variant="h4"
                className="flex flex-col gap-2 text-center sm:pbs-16 sm:pbe-6 sm:pli-16"
            >
                Objective Quiz
            </DialogTitle>

            <DialogContent className="overflow-visible pbs-0 sm:pli-16">
                <div className="flex items-end gap-4 mbe-10">
                    <Controller
                        name="title"
                        control={control}
                        render={({ field }) => (
                            <CustomTextField
                                {...field}
                                fullWidth
                                size="small"
                                variant="outlined"
                                label="Title*"
                                placeholder=""
                                error={!!errors.title}
                                helperText={errors.title?.message}
                            />
                        )}
                    />
                </div>
                <TabContext value={activeTab}>
                    <Box sx={{ display: 'flex', gap: 4 }}>
                        {/* Left Side: Question Tabs */}
                        <Snackbar
                            open={snackbarOpen}
                            message="Question deleted"
                            autoHideDuration={12000}
                            onClose={() => setSnackbarOpen(false)}
                            action={
                                <Button color="warning" size="small" onClick={handleUndo}>
                                    UNDO
                                </Button>
                            }
                        />
                        <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 250 }}>
                            <TabList
                                orientation="vertical"
                                onChange={handleChange}
                                sx={{ borderRight: 1, borderColor: 'divider', width: 400 }}
                            >
                                {questions.map((q, index) => (
                                    <Tab
                                        key={index}
                                        value={index.toString()}
                                        sx={{
                                            alignItems: 'flex-start',
                                            justifyContent: 'flex-start',
                                            textAlign: 'left'
                                        }}
                                        label={
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    width: '100%'
                                                }}
                                            >
                                                <Box sx={{ wordBreak: 'break-word' }}>
                                                    <Typography
                                                        variant="body"

                                                    // sx={{ fontWeight: 600 }}
                                                    >{`Q${index + 1}`}</Typography>
                                                    <Typography variant="body" sx={{ display: 'block' }}>
                                                        {q.title || 'Untitled'}
                                                    </Typography>
                                                </Box>
                                                <Box
                                                    component="span"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteQuestion(index);
                                                    }}
                                                    sx={{ cursor: 'pointer', color: 'error.main', display: 'flex', alignItems: 'center' }}
                                                >
                                                    <i className="tabler-trash text-textSecondary" />
                                                </Box>
                                            </Box>
                                        }
                                    />
                                ))}
                            </TabList>

                            <Box sx={{ mt: 2, pl: 2 }}>
                                <Button variant="outlined" onClick={handleAddQuestion}>
                                    + Add Question
                                </Button>
                            </Box>
                        </Box>

                        {/* Right Side: Question Form */}
                        <Box sx={{ flex: 1 }}>
                            {questions.map((q, index) => (
                                <TabPanel key={index} value={index.toString()}>
                                    <Typography variant="h6" gutterBottom color="warning">
                                        Edit Question {index + 1}
                                    </Typography>

                                    <TextField
                                        fullWidth
                                        label="Question Title"
                                        margin="normal"
                                        value={q.title}
                                        onChange={(e) =>
                                            handleInputChange(index, 'title', e.target.value)
                                        }
                                    />

                                    <RadioGroup
                                        name={`correct-${index}`}
                                        value={q.correct}
                                        onChange={(e) => handleInputChange(index, 'correct', e.target.value)}
                                    >
                                        {q.options.map((opt, i) => (
                                            <Box
                                                key={i}
                                                sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
                                            >
                                                <Radio
                                                    value={i.toString()}
                                                    disabled={!opt?.trim()} // 🔒 Disable if option is empty or just spaces
                                                />
                                                <TextField
                                                    fullWidth
                                                    margin="dense"
                                                    label={`Option ${i + 1}`}
                                                    value={opt}
                                                    onChange={(e) => handleOptionChange(index, i, e.target.value)}
                                                />
                                            </Box>
                                        ))}
                                    </RadioGroup>


                                    <TextField
                                        fullWidth
                                        label="Add Explanation"
                                        margin="normal"
                                        value={q.explanation || ''}
                                        onChange={(e) =>
                                            handleInputChange(index, 'explanation', e.target.value)
                                        }
                                    />

                                    <TextField
                                        fullWidth
                                        label="Marks"
                                        margin="normal"
                                        type="number"
                                        value={q.marks || ''}
                                        onChange={(e) =>
                                            handleInputChange(index, 'marks', e.target.value)
                                        }
                                    />

                                    <FormControl component="fieldset" sx={{ mt: 2 }}>
                                        <FormLabel component="legend">Question Level</FormLabel>
                                        <RadioGroup
                                            row
                                            name={`question-level-${index}`}
                                            value={q.question_level || ''}
                                            onChange={(e) => handleInputChange(index, 'question_level', e.target.value)}
                                        >
                                            <FormControlLabel value="Easy" control={<Radio />} label="Easy" />
                                            <FormControlLabel value="Medium" control={<Radio />} label="Medium" />
                                            <FormControlLabel value="Hard" control={<Radio />} label="Hard" />
                                        </RadioGroup>
                                    </FormControl>
                                </TabPanel>
                            ))}
                        </Box>
                    </Box>
                </TabContext>
            </DialogContent>

            <DialogActions className="flex max-sm:flex-col max-sm:items-center max-sm:gap-2 justify-center pbs-0 sm:pbe-16 sm:pli-16">
                <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    sx={{ height: 40, position: 'relative' }}
                >
                    {loading ? (
                        <CircularProgress
                            size={24}
                            sx={{
                                color: 'white',
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                marginTop: '-12px',
                                marginLeft: '-12px'
                            }}
                        />
                    ) : (
                        'Submit'
                    )}
                </Button>
                <Button onClick={handleClose} variant="tonal" color="secondary">
                    Discard
                </Button>
            </DialogActions>
        </form>

    );
}

export default DocumentCardLayout
