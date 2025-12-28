import React, { useState, useEffect, useMemo } from 'react';
import { Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Contexts & Hooks
import { SoundProvider } from './contexts/SoundContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useAppContent } from './hooks/useAppContent';
import { useAdminData } from './hooks/useAdminData';
import { fetchUserProgress, toggleLessonComplete, createInviteDB, deleteInviteDB } from './lib/supabase';

// Components
import Sidebar from './components/layout/Sidebar';

// Pages - Student
import Home from './pages/student/Home';
import StyleLibrary from './pages/student/StyleLibrary';
import Assistant from './pages/student/Assistant';
import Lessons from './pages/student/Lessons';
import PromptBase from './pages/student/PromptBase';
import Roadmaps from './pages/student/Roadmaps';
import UserProfile from './pages/student/UserProfile';
import Onboarding from './pages/student/Onboarding';

// Pages - Admin
import AdminStudents from './pages/admin/AdminStudents';
import AdminContent from './pages/admin/AdminContent';
import AdminCalls from './pages/admin/AdminCalls';
import AdminAssistant from './pages/admin/AdminAssistant';
import AdminSettings from './pages/admin/AdminSettings';
import AdminDashboardTasks from './pages/admin/AdminDashboardTasks';
import AdminDashboardSettings from './pages/admin/AdminDashboardSettings';

// Pages - Auth & Common
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Glossary from './pages/common/Glossary';

// Types
import { TabId, Student } from './types';

const AppContent: React.FC = () => {
  // --- Global State ---
  const { session, profile, loading: authLoading, isAdmin, login, register, logout, completeOnboarding, validateInvite } = useAuth();
  
  // --- Content State ---
  const { 
      modules, setModules, 
      prompts, setPrompts, 
      promptCategories, setPromptCategories, 
      roadmaps, setRoadmaps, 
      styles, setStyles, 
      glossary, setGlossary, 
      stages, setStages 
  } = useAppContent();

  // --- Admin Data State ---
  const { students, invites, refreshAdminData, setInvites } = useAdminData(isAdmin);

  // --- Local UI State ---
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [mode, setMode] = useState<'student' | 'admin'>('student');
  const [view, setView] = useState<'login' | 'register' | 'app' | 'reset-password' | 'onboarding'>('login');
  const [inviteCodeFromUrl, setInviteCodeFromUrl] = useState<string | null>(null);
  const [assistantInitialMessage, setAssistantInitialMessage] = useState<string | null>(null);
  
  // --- User Progress ---
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);

  // --- Effects ---

  // 1. Theme & Mode
  useEffect(() => {
    try {
        const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
        if (savedTheme) setTheme(savedTheme);
    } catch (e) {}

    // Check Invite URL
    const params = new URLSearchParams(window.location.search);
    const inviteParam = params.get('invite');
    if (inviteParam) {
        setInviteCodeFromUrl(inviteParam);
        setView('register');
    }
  }, []);

  useEffect(() => {
      if (isAdmin) setMode('admin');
      else setMode('student');
  }, [isAdmin]);

  // 2. Auth State Sync
  useEffect(() => {
      if (!authLoading) {
          if (session) {
              if (profile && !profile.has_onboarded) {
                  setView('onboarding');
              } else {
                  setView('app');
              }
              loadUserProgress(session.user.id);
          } else {
              if (view !== 'register' && view !== 'reset-password') {
                  setView('login');
              }
          }
      }
  }, [session, authLoading, profile]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const loadUserProgress = async (userId: string) => {
      const progress = await fetchUserProgress(userId);
      setCompletedLessons(progress);
  };

  // --- Handlers ---

  const handleToggleLesson = async (lessonId: string) => {
      if (!session?.user?.id) return;
      const isComplete = !completedLessons.includes(lessonId);
      setCompletedLessons(prev => isComplete ? [...prev, lessonId] : prev.filter(id => id !== lessonId));
      try {
          await toggleLessonComplete(session.user.id, lessonId, isComplete);
      } catch (e) {
          console.error("Failed to save progress", e);
      }
  };

  const handleGenerateInvites = async (count: number) => {
      try {
          for (let i = 0; i < count; i++) {
              const token = `vibes-${Math.random().toString(36).substring(2, 7)}`;
              await createInviteDB(token);
          }
          await refreshAdminData();
      } catch (e) {
          alert("Ошибка при создании инвайта");
      }
  };

  const handleDeleteInvite = async (id: string) => {
      try {
          await deleteInviteDB(id);
          setInvites(prev => prev.filter(inv => inv.id !== id));
      } catch (e) {
          alert("Ошибка при удалении");
      }
  };

  const handleAskAI = (prompt: string) => {
      setAssistantInitialMessage(prompt);
      setActiveTab('assistant');
  };

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  // --- Derived State ---
  const currentUser = useMemo(() => {
      if (!profile) return null;
      return {
          id: profile.id,
          name: profile.full_name || 'Студент',
          email: profile.email,
          avatar: profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.full_name}&background=8b5cf6&color=fff`,
          status: 'active',
          progress: Math.round((completedLessons.length / 20) * 100),
          currentModule: 'Модуль 1',
          lastActive: 'Только что',
          joinedDate: profile.created_at,
          projects: {},
      } as Student;
  }, [profile, completedLessons]);

  // --- Render ---

  if (authLoading) {
      return <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
      </div>;
  }

  if (view === 'login') return <Login onLogin={login} onNavigateToRegister={() => setView('register')} onSimulateResetLink={() => setView('reset-password')} />;
  if (view === 'reset-password') return <Login onLogin={login} onNavigateToRegister={() => setView('register')} initialView="reset" onSimulateResetLink={() => {}} onResetComplete={() => setView('login')} />;
  if (view === 'register') return <Register inviteCode={inviteCodeFromUrl || undefined} validateInvite={validateInvite} onRegister={async (d) => { await register(d, inviteCodeFromUrl || undefined); }} onNavigateLogin={() => { window.history.replaceState({}, '', window.location.pathname); setView('login'); }} />;
  if (view === 'onboarding') return <Onboarding userName={profile?.full_name || ''} onComplete={completeOnboarding} />;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Home stages={stages} onNavigate={setActiveTab} userId={profile?.id} userName={profile?.full_name || 'Студент'} />;
      case 'lessons': return <Lessons modules={modules} completedLessons={completedLessons} onToggleLesson={handleToggleLesson} />;
      case 'roadmaps': return <Roadmaps roadmaps={roadmaps} />;
      case 'styles': return <StyleLibrary styles={styles} />;
      case 'prompts': return <PromptBase prompts={prompts} categories={promptCategories} />;
      case 'glossary': return <Glossary glossary={glossary} onNavigate={setActiveTab} onAskAI={handleAskAI} />;
      case 'assistant': return <Assistant initialMessage={assistantInitialMessage} onMessageHandled={() => setAssistantInitialMessage(null)} />;
      case 'profile': return currentUser ? <UserProfile user={currentUser} /> : <Home stages={stages} onNavigate={setActiveTab} userId={profile?.id} userName={profile?.full_name || 'Студент'} />;

      // Admin Views
      case 'admin-students': return <AdminStudents students={students} onUpdateStudent={() => {}} onAddStudent={() => {}} onDeleteStudent={() => {}} />;
      case 'admin-content': return <AdminContent modules={modules} onUpdateModules={setModules} prompts={prompts} onUpdatePrompts={setPrompts} promptCategories={promptCategories} onUpdatePromptCategories={setPromptCategories} styles={styles} onUpdateStyles={setStyles} roadmaps={roadmaps} onUpdateRoadmaps={setRoadmaps} glossary={glossary} onUpdateGlossary={setGlossary} stages={stages} onUpdateStages={setStages} />;
      case 'admin-dashboard-tasks': return <AdminDashboardTasks />;
      case 'admin-calls': return <AdminCalls />;
      case 'admin-assistant': return <AdminAssistant />;
      case 'admin-dashboard-settings': return <AdminDashboardSettings />;
      case 'admin-settings': return <AdminSettings invites={invites} onGenerateInvites={handleGenerateInvites} onDeleteInvite={handleDeleteInvite} onDeactivateInvite={() => {}} />;

      default: return mode === 'admin' ? <AdminStudents students={students} onUpdateStudent={() => {}} onAddStudent={() => {}} onDeleteStudent={() => {}} /> : <Home stages={stages} onNavigate={setActiveTab} userId={profile?.id} userName={profile?.full_name || 'Студент'} />;
    }
  };

  return (
    <div className={`min-h-[100dvh] bg-slate-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans overflow-hidden selection:bg-violet-500/30 selection:text-violet-900 dark:selection:text-white transition-colors duration-300 ${mode === 'admin' ? 'admin-mode' : ''}`}>
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden gpu-accelerated">
          {mode === 'student' ? (
              <>
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-600/10 dark:bg-violet-900/10 rounded-full blur-[120px] animate-blob" />
                <div className="absolute bottom-[10%] right-[0%] w-[30%] h-[30%] bg-fuchsia-600/10 dark:bg-fuchsia-900/10 rounded-full blur-[100px] animate-blob animation-delay-2000" />
              </>
          ) : (
              <>
                 <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-emerald-900/5 rounded-full blur-[150px] animate-blob" />
                 <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-zinc-500/5 rounded-full blur-[120px] animate-blob animation-delay-2000" />
              </>
          )}
      </div>

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} theme={theme} toggleTheme={toggleTheme} mode={mode} setMode={setMode} />

      <main className="md:pl-72 min-h-[100dvh] flex flex-col relative z-10">
        <header className="md:hidden h-auto py-4 flex items-center justify-between px-6 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-30 border-b border-zinc-200 dark:border-white/5 transition-colors duration-300">
          <div className="flex items-center gap-3">
             {mode === 'student' ? (
                 <img src="https://i.imgur.com/f3UfhpM.png" alt="VIBES Logo" className="h-10 w-auto object-contain dark:brightness-0 dark:invert" />
             ) : (
                 <span className="font-bold text-lg">ADMIN</span>
             )}
          </div>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
            <Menu size={24} />
          </button>
        </header>

        <div className="hidden md:flex justify-end items-center px-8 py-6 w-full max-w-[1600px] mx-auto">
            <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                    <span className="text-sm font-bold text-zinc-900 dark:text-white">{currentUser?.name}</span>
                    <button onClick={logout} className="text-xs text-zinc-400 hover:text-red-500 transition-colors">Выйти</button>
                </div>
                <button onClick={() => setActiveTab('profile')} className={`w-10 h-10 rounded-full p-0.5 transition-transform hover:scale-105 ${mode === 'admin' ? 'bg-gradient-to-tr from-emerald-500 to-cyan-500' : 'bg-gradient-to-tr from-violet-500 to-fuchsia-500'}`}>
                    {currentUser?.avatar && !currentUser.avatar.includes('ui-avatars') ? (
                        <img src={currentUser.avatar} alt="Profile" className="w-full h-full rounded-full object-cover border-2 border-white dark:border-zinc-900" />
                    ) : (
                        <div className="w-full h-full rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center font-bold text-violet-600">{currentUser?.name?.[0]}</div>
                    )}
                </button>
            </div>
        </div>

        <div className="flex-1 w-full max-w-[1600px] mx-auto pt-0">
           <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.99 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="h-full"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <SoundProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SoundProvider>
  );
}

export default App;
