import React from 'react';

import Grid from '@mui/material/Grid2';

const DefaultExamInstructions = () => {
    const instructions = [
        "Read All Instructions Carefully: Please take a moment to read through the instructions thoroughly before beginning the exam.",
        "Time Limit: The timer will start once you begin the exam and will continue counting down, so manage your time wisely.",
        "Technical Requirements: Ensure that your device (computer, tablet, or smartphone) is fully charged or plugged into a power source. Use a stable internet connection throughout the exam to avoid disruptions. Ensure you have access to any necessary software or apps that are required for the exam.",
        "Answering the Questions: For multiple-choice questions, select the best answer from the options provided.",
        "No Communication During the Exam: You are not allowed to communicate with others during the exam. If you have questions, contact the exam proctor using the designated support option.",
        "Security and Academic Integrity: Your online exam is being monitored to ensure academic integrity. Any form of cheating, including using unauthorized resources, copying from other candidates, or communicating with others, will result in immediate disqualification.",
        "Technical Issues During the Exam: If you experience any technical difficulties (e.g., internet connectivity issues, browser problems), immediately contact the exam support team. You may be granted extra time if technical issues arise, but this is subject to review.",
        "Submitting the Exam: Once you have answered all questions, click the “Finish” button to submit your exam. After submission, you will not be able to make any changes to your responses.",
        "Final Review: Before submitting, review your answers to ensure everything is correct.",
        "Emergency Protocol: If you are unable to complete the exam due to an emergency or technical issues, contact the exam proctor immediately for assistance."
    ];

    return (
        <Grid item size={{ xs: 12,  }}>
            <ol className='pl-6'>
                {instructions.map((instruction, index) => (
                    <li key={index}>{instruction}</li>
                ))}
            </ol>
        </Grid>
    );
};

export default DefaultExamInstructions;
