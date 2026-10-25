import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Toast } from './components/common/Toast';
import { SkillModal } from './components/modals/SkillModal';
import { TaskModal } from './components/modals/TaskModal';

import { DashboardPage } from './pages/DashboardPage';
import { SkillsPage } from './pages/SkillsPage';
import { StudyTimerPage } from './pages/StudyTimerPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { TodoListPage } from './pages/TodoListPage';
import { UpcomingTasksPage } from './pages/UpcomingTasksPage';
import { SettingsPage } from './pages/SettingsPage';
import { Skill, Assignment } from './types';

const MainLayout: React.FC = () => {
  const { 
    currentView, 
    notification, 
    dismissNotification, 
    skills,
    addSkill, 
    updateSkill,
    addTask,
    updateTask
  } = useApp();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Modal states
  const [skillModalOpen, setSkillModalOpen] = useState(false);
  const [skillToEdit, setSkillToEdit] = useState<Skill | null>(null);

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Assignment | null>(null);

  // Handlers
  const handleOpenAddSkill = () => {
    setSkillToEdit(null);
    setSkillModalOpen(true);
  };

  const handleEditSkill = (skill: Skill) => {
    setSkillToEdit(skill);
    setSkillModalOpen(true);
  };

  const handleSaveSkill = (skillData: Omit<Skill, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (skillToEdit) {
      updateSkill(skillToEdit.id, skillData);
    } else {
      addSkill(skillData);
    }
  };

  const handleOpenAddTask = () => {
    setTaskToEdit(null);
    setTaskModalOpen(true);
  };

  const handleEditTask = (task: Assignment) => {
    setTaskToEdit(task);
    setTaskModalOpen(true);
  };

  const handleSaveTask = (taskData: Omit<Assignment, 'id' | 'createdAt'>) => {
    if (taskToEdit) {
      updateTask(taskToEdit.id, taskData);
    } else {
      addTask(taskData);
    }
  };

  const renderActiveView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardPage
            onOpenAddSkill={handleOpenAddSkill}
            onOpenAddTask={handleOpenAddTask}
            onEditSkill={handleEditSkill}
          />
        );
      case 'skills':
        return (
          <SkillsPage
            onOpenAddSkill={handleOpenAddSkill}
            onEditSkill={handleEditSkill}
          />
        );
      case 'timer':
        return <StudyTimerPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'assignments':
      case 'todos':
        return (
          <TodoListPage
            onOpenAddTask={handleOpenAddTask}
            onEditTask={handleEditTask}
          />
        );
      case 'upcoming':
      case 'upcoming-tasks':
        return (
          <UpcomingTasksPage
            onOpenAddTask={handleOpenAddTask}
            onEditTask={handleEditTask}
          />
        );
      case 'settings':
        return <SettingsPage />;
      default:
        return (
          <DashboardPage
            onOpenAddSkill={handleOpenAddSkill}
            onOpenAddTask={handleOpenAddTask}
            onEditSkill={handleEditSkill}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased selection:bg-purple-100 selection:text-purple-900">
      {/* Sidebar Navigation */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area (offset by 256px on lg screens) */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
        <Header
          onOpenMobile={() => setMobileSidebarOpen(true)}
          onOpenAddSkillModal={handleOpenAddSkill}
          onOpenAddTaskModal={handleOpenAddTask}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderActiveView()}
        </main>
      </div>

      {/* Reusable Modals */}
      <SkillModal
        isOpen={skillModalOpen}
        onClose={() => setSkillModalOpen(false)}
        onSubmit={handleSaveSkill}
        skillToEdit={skillToEdit}
      />

      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onSubmit={handleSaveTask}
        assignmentToEdit={taskToEdit}
        skills={skills}
      />

      {/* Global Toast Notification */}
      {notification && (
        <Toast
          message={notification.message}
          type={notification.type}
          onClose={dismissNotification}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
