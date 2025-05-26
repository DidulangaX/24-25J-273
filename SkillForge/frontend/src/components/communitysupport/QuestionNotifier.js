import React, { useEffect, useRef } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const QuestionNotifier = () => {
  // Keep track of notified question IDs to avoid repeated notifications
  const notifiedQuestions = useRef(new Set());

  useEffect(() => {
    const fetchQuestionsAndNotify = async () => {
      try {
        const response = await axios.get('http://localhost:5002/api/community/questions');
        console.log("Response data:", response.data);

        // Handle if response.data is an array or an object containing questions array
        const questions = Array.isArray(response.data)
          ? response.data
          : response.data.questions || [];

        questions.forEach(async (question) => {
          if (question.urgency === 'High' && !notifiedQuestions.current.has(question._id)) {
          toast.info(`⚠️ Urgent: ${question.title}`, {
  position: "top-right",
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,  // allows clicking the toast to close it
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: "colored",
  onClick: () => {
    window.location.href = `http://localhost:3000/community/questions/${question._id}`;
  }
});


            // Mark as notified locally
            notifiedQuestions.current.add(question._id);

            // Mark notification as sent on server
            try {
                console.log(`Marking notification as sent for question ID: ${question._id}`);
              await axios.patch(`http://localhost:5002/api/community/questions/${question._id}/notification`);
            } catch (patchError) {
              console.error("Error marking notification as sent:", patchError);
            }
          }
        });
      } catch (error) {
        console.error("Error fetching questions:", error);
      }
    };

    // Initial fetch immediately
    fetchQuestionsAndNotify();

    // Then repeat every 5 seconds
    const interval = setInterval(fetchQuestionsAndNotify, 5000);

    return () => clearInterval(interval);
  }, []);

  return <ToastContainer />;
};

export default QuestionNotifier;
