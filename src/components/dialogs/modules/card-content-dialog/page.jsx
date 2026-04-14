'use client'

// MUI Imports
import Avatar from '@mui/material/Avatar'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'


import { useColorScheme } from '@mui/material/styles'
import { useDropzone } from 'react-dropzone'

// Third-party Imports
import classnames from 'classnames'

// Component Imports
import DialogCloseButton from '../../DialogCloseButton'

import { useApi } from '../../../../utils/api';

import DocumentCardLayout from './types/documentCardLayout';
import VideosCardLayout from './types/videosCardLayout';
import YoutubeCardLayout from './types/youtubeCardLayout';
import ScromCardLayout from './types/scromCardLayout.jsx';
import ObjectiveQuiz from './types/objectiveQuiz';
import ScormPlayer from './types/scormPlayer';
import ScormPlayerPipeworks from './types/scormPlayerPipeworks';

const CardContentDialog = ({ open, setOpen, cardContent, moduleData, onSetCardItems }) => {
    // Hooks

    const { mode } = useColorScheme()
    const { doGet } = useApi();

    const getModule = async () => {
        const result = await doGet(`admin/module/${moduleData._id}`);

        onSetCardItems(result.cards);
    };

    const onClose = (items) => {
        setOpen(false);
        getModule();
    }

    return (
        <Dialog
            fullWidth
            open={open}
            onClose={() => setOpen(false)}
            maxWidth={cardContent.value === 'quiz' ? 'lg' : 'md'}
            scroll='body'
            closeAfterTransition={false}
            sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
        >
            <DialogCloseButton onClick={() => setOpen(false)} disableRipple>
                <i className='tabler-x' />
            </DialogCloseButton>

            {cardContent.value === 'documents' && <DocumentCardLayout data={cardContent} moduleData={moduleData} onClose={onClose} />}
            {cardContent.value === 'videos' && <VideosCardLayout data={cardContent} moduleData={moduleData} onClose={onClose} />}
            {cardContent.value === 'youtube_videos' && <YoutubeCardLayout data={cardContent} moduleData={moduleData} onClose={onClose} />}
            {cardContent.value === 'scorm' && <ScromCardLayout data={cardContent} moduleData={moduleData} onClose={onClose} />}
            {cardContent.value === 'quiz' && <ObjectiveQuiz data={cardContent} moduleData={moduleData} onClose={onClose} />}

        </Dialog>
    )
}

export default CardContentDialog
