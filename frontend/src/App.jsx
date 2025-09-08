import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import Home from './pages/Home';
import QuizList from './pages/QuizList';
import QuizPlayer from './pages/QuizPlayer';
import CreateQuiz from './pages/CreateQuiz';
import MyQuizzes from './pages/MyQuizzes';
import Results from './pages/Results';
import ProfileEdit from './pages/ProfileEdit';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './pages/Navbar';
import QuizDashboard from './pages/QuizDashboard';
import EditQuiz from './pages/EditQuiz';
import JoinGame from './pages/JoinGame';
import Lobby from './pages/Lobby';
import HostGame from './pages/HostGame';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/quizzes" element={<ProtectedRoute><QuizList /></ProtectedRoute>} />
          <Route path="/quiz/:id" element={<ProtectedRoute><QuizPlayer /></ProtectedRoute>} />
          <Route path="/create" element={<ProtectedRoute><CreateQuiz /></ProtectedRoute>} />
          <Route path="/my-quizzes" element={<ProtectedRoute><MyQuizzes /></ProtectedRoute>} />
          <Route path="/results" element={<ProtectedRoute><Results /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfileEdit /></ProtectedRoute>} />
          <Route path="/quiz-dashboard/:id" element={<ProtectedRoute><QuizDashboard /></ProtectedRoute>} />
          <Route path="/edit-quiz/:id" element={<ProtectedRoute><EditQuiz /></ProtectedRoute>} />
          <Route path="/join" element={<JoinGame />} />
          <Route path="/lobby/:pin" element={<Lobby />} />
          <Route path="/host/:pin" element={<HostGame />} />
        </Routes>

{/*         <Routes> */}
{/*                   <Route path="/" element={<Home />} /> */}
{/*                   <Route path="/quizzes" element={<QuizList />} /> */}
{/*                   <Route path="/quiz/:id" element={<QuizPlayer />} /> */}
{/*                   <Route path="/create" element={<CreateQuiz />} /> */}
{/*                   <Route path="/my-quizzes" element={<MyQuizzes />} /> */}
{/*                   <Route path="/results" element={<Results />} /> */}
{/*                   <Route path="/profile" element={<ProfileEdit />} /> */}
{/*                   <Route path="/quiz-dashboard/:id" element={<QuizDashboard />} /> */}
{/*                   <Route path="/edit-quiz/:id" element={<EditQuiz />} /> */}
{/*                 </Routes> */}
      </BrowserRouter>
    </AuthProvider>
  );
}
