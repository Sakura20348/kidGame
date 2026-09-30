import { createBrowserRouter, Navigate } from "react-router-dom"

import { HomeRedirect } from "@/components/routing/home-redirect"
import { NotFoundPage, RouteErrorPage } from "@/pages/error"
import { RequireAuth } from "@/components/routing/require-auth"
import { RequireRole, SettingsRoute, StudentSide } from "@/components/routing/require-role"
import AppLayout from "@/layouts/app-layout"
import DashboardLayout from "@/layouts/dashboard-layout"
import KidsLayout from "@/layouts/kids-layout"
import StudentLayout from "@/layouts/student-layout"
import LiveStudentPage from "@/pages/live"
import LectureQuestionsPage from "@/pages/dashboard/live"
import AuthPage from "@/pages/auth"
import SignupPage from "@/pages/auth/signup"
import DashboardPage from "@/pages/dashboard"
import HelpPage from "@/pages/dashboard/help"
import StudentsLibraryPage from "@/pages/dashboard/library"
import StudentViewPage from "@/pages/dashboard/students"
import TestPapersPage from "@/pages/dashboard/papers"
import TeamPage from "@/pages/dashboard/team"
import HomePage from "@/pages/home"
import ChooseClassPage from "@/pages/choose-class"
import JoinClassPage from "@/pages/join"
import VerifyEmailPage from "@/pages/verify"
import LessonPage from "@/pages/lesson/index"
import KidsHubPage from "@/pages/kids"
import ClockQuestPage from "@/pages/kids/clock"
import MathSprintPage from "@/pages/kids/math"
import ChessPage from "@/pages/kids/chess"
import MountainClimbPage from "@/pages/kids/climb"
import SudokuPage from "@/pages/kids/sudoku"
import CrossMathPage from "@/pages/kids/crossmath"
import TownHelpersPage from "@/pages/kids/helpers"
import MemoryMatchPage from "@/pages/kids/memory"
import PythonQuestPage from "@/pages/kids/python"
import LearnToReadPage from "@/pages/kids/reading"
import TypingRacePage from "@/pages/kids/typing"
import WordBuilderPage from "@/pages/kids/words"
import LibraryPage from "@/pages/library"
import ProfilePage from "@/pages/profile"
import SettingsPage from "@/pages/settings"
import StudentOverviewPage from "@/pages/student"
import StudentMaterialsPage from "@/pages/student/materials"
import StudentAssignmentsPage from "@/pages/student/assignments"
import MyProgressPage from "@/pages/student/progress"
import SubmitWorkPage from "@/pages/student/submit"
import WorkspacePage from "@/pages/workspace"

export const router = createBrowserRouter([
  { path: "/login", element: <AuthPage />, errorElement: <RouteErrorPage /> },
  { path: "/signup", element: <SignupPage />, errorElement: <RouteErrorPage /> },
  {
    element: <RequireAuth />,
    errorElement: <RouteErrorPage />,
    children: [
      { path: "verify", element: <VerifyEmailPage /> },
      { path: "join", element: <JoinClassPage /> },
      { path: "choose-class", element: <ChooseClassPage /> },
      {
        // student side – teachers are sent to their dashboard
        element: <StudentSide />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { index: true, element: <HomeRedirect /> },
              { path: "discover", element: <HomePage /> },
              { path: "library", element: <LibraryPage /> },
              { path: "live", element: <LiveStudentPage /> },
              { path: "ask", element: <Navigate to="/live" replace /> }, // Ask AI was replaced by Lecture questions
              { path: "assignments", element: <Navigate to="/live" replace /> },
              { path: "workspace", element: <WorkspacePage /> },
              { path: "profile", element: <ProfilePage /> },
              {
                // lessons and kids games are for students only – teachers go back to Discover
                element: <RequireRole role="student" />,
                children: [
                  { path: "lesson/:id", element: <LessonPage /> },
                  {
                    path: "kids",
                    element: <KidsLayout />,
                    children: [
                      { index: true, element: <KidsHubPage /> },
                      { path: "math", element: <MathSprintPage /> },
                      { path: "words", element: <WordBuilderPage /> },
                      { path: "memory", element: <MemoryMatchPage /> },
                      { path: "clock", element: <ClockQuestPage /> },
                      { path: "typing", element: <TypingRacePage /> },
                      { path: "chess", element: <ChessPage /> },
                      { path: "reading", element: <LearnToReadPage /> },
                      { path: "python", element: <PythonQuestPage /> },
                      { path: "climb", element: <MountainClimbPage /> },
                      { path: "helpers", element: <TownHelpersPage /> },
                      { path: "sudoku", element: <SudokuPage /> },
                      { path: "crossmath", element: <CrossMathPage /> },
                    ],
                  },
                ],
              },
              { path: "settings", element: <SettingsRoute /> },
            ],
          },
        ],
      },
      {
        // teachers only – students are sent back to Discover
        element: <RequireRole role="teacher" />,
        children: [
          {
            path: "dashboard",
            element: <DashboardLayout />,
            children: [
              { index: true, element: <DashboardPage /> },
              { path: "students", element: <StudentViewPage /> },
              { path: "lessons", element: <HomePage /> },
              { path: "projects", element: <LibraryPage /> },
              { path: "profile", element: <ProfilePage /> },
              { path: "team", element: <TeamPage /> },
              { path: "papers", element: <TestPapersPage /> },
              { path: "live", element: <LectureQuestionsPage /> },
              { path: "library", element: <StudentsLibraryPage /> },
              { path: "help", element: <HelpPage /> },
              { path: "settings", element: <SettingsPage /> },
            ],
          },
        ],
      },
      {
        path: "student",
        element: <StudentLayout />,
        children: [
          { index: true, element: <StudentOverviewPage /> },
          { path: "materials", element: <StudentMaterialsPage /> },
          { path: "assignments", element: <StudentAssignmentsPage /> },
          { path: "progress", element: <MyProgressPage /> },
          { path: "submit", element: <SubmitWorkPage /> },
        ],
      },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
])
