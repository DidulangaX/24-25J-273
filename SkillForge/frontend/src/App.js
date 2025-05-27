import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import CryptoJS from 'crypto-js';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import {
  ChakraProvider,
  ColorModeScript,
  Box,
  IconButton,
  useColorMode,
} from '@chakra-ui/react';
import { FaMoon, FaSun } from 'react-icons/fa';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';

import Navbar from './components/navbar/navbar';
import Footer from './components/footer/footer';
import Home from './components/home/home';
import Login from './components/authentication/login';
import Register from './components/authentication/register';
import CoursePage from './components/course/coursePage';
import AddCourse from './components/admin/addCourse';
import Dashboard from './components/admin/dashboard';
import AddCourseContents from './components/admin/addCourseContents';
import UpdateCourse from './components/admin/updateCourse';
import UpdateContent from './components/admin/updateContent';
import Course from './components/course/course';
import Profile from './components/profile/profile';
import Payment from './components/payment/payment';
import PaymentSuccess from './components/payment/paymentSuccess';
import CommunitySupportPage from './components/communitysupport/CommunitySupportPage';
import QuestionDetailPage from './components/communitysupport/QuestionDetailPage';
import InterviewPractice from './components/interviewPreperation/InterviewPractice';
import InterviewSession from './components/interviewPreperation/InterviewSession';

//ovinda
import { Leaderboard } from "./components/adaptive";
import ChallengeSessionPage from "./components/adaptive/ChallengeSessionPage";
import ChallengeFriendsPage from "./components/adaptive/ChallengeFriendsPage";
import ChallengeWaitingPage from "./components/adaptive/ChallengeWaitingPage";
import ChallengeResultsPage from "./components/adaptive/ChallengeResultsPage.js";
import MyAttemptsPage from "./components/adaptive/MyAttemptsPage";
import AttemptSummaryPage from "./components/adaptive/AttemptSummaryPage";
import AdaptiveQuestionPage from "./components/adaptive/AdaptiveQuestionPage";
import AdaptiveHomePage from "./components/adaptive/AdaptiveHomePage";
import AdaptiveTestIntroPage from "./components/adaptive/AdaptiveTestIntroPage";
import ChallengeIntroPage from "./components/adaptive/ChallengeIntroPage";


import {
  NAVIGATE_TO_HOME,
  NAVIGATE_TO_LOGIN,
  NAVIGATE_TO_REGISTER,
  NAVIGATE_TO_COURSE_PAGE,
  NAVIGATE_TO_INVALID_ROUTES,
  NAVIGATE_TO_COMMUNITY_SUPPORT,
  NAVIGATE_TO_COURSE,
  NAVIGATE_TO_PROFILE,
  NAVIGATE_TO_PAYMENTS,
  NAVIGATE_TO_SUCCESS_PAYMENT,
  NAVIGATE_TO_ADMIN_PROFILE,
  NAVIGATE_TO_ADD_COURSE,
  NAVIGATE_TO_ADD_COURSE_CONTENTS,
  NAVIGATE_TO_UPDATE_COURSE,
  NAVIGATE_TO_UPDATE_CONTENT,
} from './constant/routeConstant';
import { Admin, Instructor, Student } from './enums/enums';
import { handleLogout } from './utils/utility';
import Error from './components/404/error';
import theme from './theme';
import QuestionNotifier from './components/communitysupport/QuestionNotifier';

function ColorModeSwitcher() {
  const { colorMode, toggleColorMode } = useColorMode();
  return (
    <IconButton
      aria-label="Toggle theme"
      icon={colorMode === 'light' ? <FaMoon /> : <FaSun />}
      onClick={toggleColorMode}
      size="md"
      pos="fixed"
      top={4}
      right={4}
    />
  );
}

export default function App() {
  const authToken = Cookies.get('authToken');
  const [uData, setUData] = useState(null);

  useEffect(() => {
    const encrypted = localStorage.getItem('uData');
    if (encrypted) {
      const decrypted = CryptoJS.AES.decrypt(
        encrypted,
        process.env.REACT_APP_ENCRYPTION_SECRET
      ).toString(CryptoJS.enc.Utf8);
      setUData(JSON.parse(decrypted));
    }
  }, []);

  useEffect(() => {
    if (!authToken && localStorage.getItem('uData')) {
      handleLogout();
    }
  }, [authToken]);

  const isLoggedIn = Boolean(authToken);
  const isAdmin = uData?.role === Admin;
  const isInstructor = uData?.role === Instructor;
  const isStudent = uData?.role === Student;

  return (
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <BrowserRouter>
        <Navbar />
        <QuestionNotifier />
        <Box minH="100vh" p={4}>
          <ColorModeSwitcher />

          <Routes>
            {/* Public */}
            <Route path={NAVIGATE_TO_HOME} element={<Home />} />
            <Route
              path={NAVIGATE_TO_LOGIN}
              element={!isLoggedIn ? <Login /> : <Home />}
            />
            <Route
              path={NAVIGATE_TO_REGISTER}
              element={!isLoggedIn ? <Register /> : <Home />}
            />
            <Route path={NAVIGATE_TO_COURSE_PAGE} element={<CoursePage />} />
            <Route path={NAVIGATE_TO_INVALID_ROUTES} element={<Error />} />
            <Route path={NAVIGATE_TO_COMMUNITY_SUPPORT} element={<CommunitySupportPage />} />
            <Route path="/interview" element={<InterviewPractice />} />
            <Route path="/start-interview" element={<InterviewSession />} />
            <Route path="/community/questions/:questionId" element={<QuestionDetailPage />} />

            {/* Adaptive Learning */}
            {/* Leaderboard */}
          <Route path="/leaderboard" element={<Leaderboard />} />

          {/* Challenge system */}
          <Route
            path="/challenge/:sessionId"
            element={<ChallengeSessionPage />}
          />
          <Route path="/challenge-friends" element={<ChallengeFriendsPage />} />
          <Route
            path="/challenge-waiting/:sessionId"
            element={<ChallengeWaitingPage />}
          />
          <Route
            path="/challenge-results/:sessionId"
            element={<ChallengeResultsPage />}
          />

          {/* ----------- NEW MULTI-ATTEMPT ROUTES ----------- */}
          <Route
            path="/myAttempts"
            element={<MyAttemptsPage userId={uData?._id || uData?.username} />}
          />
          <Route
            path="/questions"
            element={
              <AdaptiveQuestionPage userId={uData?._id || uData?.username} />
            }
          />
          
          {/* Fixed route - using AttemptSummaryPage instead of undefined FinalSummaryPage */}
          <Route
            path="/attemptSummary/:attemptNumber"
            element={
              <AttemptSummaryPage userId={uData?._id || uData?.username} />
            }
          />

        <Route path="/adaptiveHome" element={<AdaptiveHomePage />} />
        <Route path="/adaptiveTestIntro" element={<AdaptiveTestIntroPage />} />
        <Route path="/challengeIntro" element={<ChallengeIntroPage />} />

            {/* Protected */}
            <Route path={NAVIGATE_TO_COURSE} element={isLoggedIn && isStudent ? <Course /> : <Error />} />
            <Route path={NAVIGATE_TO_PROFILE} element={isLoggedIn && isStudent ? <Profile /> : <Error />} />
            <Route path={NAVIGATE_TO_PAYMENTS} element={isLoggedIn && isStudent ? <Payment /> : <Error />} />
            <Route path={NAVIGATE_TO_SUCCESS_PAYMENT} element={isLoggedIn && isStudent ? <PaymentSuccess /> : <Error />} />

            {/* Admin/Instructor */}
            <Route
              path={NAVIGATE_TO_ADMIN_PROFILE}
              element={isLoggedIn && (isAdmin || isInstructor) ? <Dashboard /> : <Error />}
            />
            <Route path={NAVIGATE_TO_ADD_COURSE} element={isLoggedIn && isAdmin ? <AddCourse /> : <Error />} />
            <Route path={NAVIGATE_TO_UPDATE_COURSE} element={isLoggedIn && isAdmin ? <UpdateCourse /> : <Error />} />
            <Route path={NAVIGATE_TO_UPDATE_CONTENT} element={isLoggedIn && isInstructor ? <UpdateContent /> : <Error />} />
            <Route
              path={NAVIGATE_TO_ADD_COURSE_CONTENTS}
              element={isLoggedIn && (isAdmin || isInstructor) ? <AddCourseContents /> : <Error />}
            />
          </Routes>
        </Box>
        <Footer />
      </BrowserRouter>
    </ChakraProvider>
  );
}
