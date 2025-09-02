import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import Magnet from '@/components/ReactBits/Magnet';
import GlareHover from '@/components/ReactBits/GlareHover';
import ClickSpark from '@/components/ReactBits/ClickSpark';
import {
  HomeIcon,
  Cog6ToothIcon,
  PlusIcon,
  ClipboardDocumentListIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserGroupIcon,
  MoonIcon,
  SunIcon,
  ArrowRightOnRectangleIcon,
  ArrowLeftOnRectangleIcon,
} from '@heroicons/react/24/outline';

interface SideNavProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

export const SideNav: React.FC<SideNavProps> = ({ 
  isOpen = false, 
  onToggle 
}) => {
  const { user, isAuthenticated, signOut } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains('dark')
  );

  // Auto-hide sidebar on mobile when route changes
  useEffect(() => {
    if (window.innerWidth <= 768 && onToggle && isOpen) {
      onToggle();
    }
  }, [location.pathname, onToggle, isOpen]);

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  const handleSignOut = async () => {
    await signOut();
    if (onToggle && isOpen) {
      onToggle();
    }
  };

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  const toggleTheme = () => {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      setIsDark(false);
      localStorage.setItem('theme', 'light');
    } else {
      html.classList.add('dark');
      setIsDark(true);
      localStorage.setItem('theme', 'dark');
    }
  };

  const getUserDisplayName = () => {
    if (!user) return 'Guest';
    return user.user_metadata?.full_name || 
           user.user_metadata?.name || 
           user.email?.split('@')[0] || 
           'User';
  };

  const getUserAvatar = () => {
    return user?.user_metadata?.avatar_url || 
           user?.user_metadata?.picture ||
           `https://api.dicebear.com/7.x/initials/svg?seed=${getUserDisplayName()}`;
  };

  return (
    <>
      {/* Mobile overlay with blur */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Main Sidebar Container */}
      <motion.div 
        className={`
          fixed top-0 left-0 h-full z-50 transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
        animate={{ 
          width: collapsed ? '80px' : '320px'
        }}
        transition={{ 
          duration: 0.4, 
          ease: [0.04, 0.62, 0.23, 0.98]
        }}
      >
        {/* Glassmorphism Background Layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-theme-surface/95 via-theme-surface/90 to-theme-surface/95 backdrop-blur-xl" />
        <div className="absolute inset-0 bg-gradient-to-br from-theme-primary/8 via-transparent to-theme-secondary/8" />
        <div className="absolute inset-0 border-r border-theme-border/30" />
        
        {/* Content */}
        <div className="relative h-full flex flex-col z-10">
          {/* Header with modern toggle */}
          <motion.div 
            className="p-6 border-b border-theme-border/30 backdrop-blur-sm"
            animate={{ 
              opacity: 1,
              x: 0
            }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between">
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center space-x-3"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-theme-primary via-theme-primary to-theme-secondary rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-lg">T3</span>
                    </div>
                    <div>
                      <h1 className="text-xl font-bold bg-gradient-to-r from-theme-primary to-theme-secondary bg-clip-text text-transparent">
                        Tahadialthalatheen
                      </h1>
                      <p className="text-xs text-theme-text/60">Game Platform</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <ClickSpark 
                sparkColor="var(--theme-primary)"
                sparkCount={8}
                sparkRadius={15}
              >
                <GlareHover
                  width="48px"
                  height="48px"
                  background="var(--theme-surface)/50"
                  borderRadius="12px"
                  borderColor="var(--theme-border)"
                  glareColor="var(--theme-primary)"
                  glareOpacity={0.4}
                  className="!border-theme-border/30 hover:!border-theme-primary/50 transition-all duration-300"
                >
                  <button
                    onClick={toggleCollapsed}
                    className="w-full h-full flex items-center justify-center text-theme-text hover:text-theme-primary transition-colors group"
                  >
                    <motion.div
                      animate={{ rotate: collapsed ? 0 : 180 }}
                      transition={{ duration: 0.4, ease: 'easeInOut' }}
                    >
                      {collapsed ? (
                        <ChevronRightIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      ) : (
                        <ChevronLeftIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      )}
                    </motion.div>
                  </button>
                </GlareHover>
              </ClickSpark>
            </div>
          </motion.div>

          {/* User Profile Section with modern styling */}
          {isAuthenticated && (
            <motion.div 
              className="p-6 border-b border-theme-border/30"
              animate={{ 
                opacity: 1,
                scale: 1
              }}
              transition={{ duration: 0.3 }}
            >
              <Magnet magnetStrength={0.4} padding={40} className="w-full">
                <div className="flex items-center space-x-4 p-4 rounded-2xl bg-gradient-to-r from-theme-primary/10 via-theme-primary/5 to-theme-secondary/10 border border-theme-border/20 backdrop-blur-sm hover:border-theme-primary/30 transition-all duration-300">
                  <div className="relative">
                    <img
                      src={getUserAvatar()}
                      alt="Profile"
                      className="w-12 h-12 rounded-full ring-2 ring-theme-primary/40 shadow-lg"
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-theme-success rounded-full border-2 border-theme-surface animate-pulse" />
                  </div>
                  <AnimatePresence mode="wait">
                    {!collapsed && (
                      <motion.div
                        initial={{ opacity: 0, x: -15 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -15 }}
                        transition={{ duration: 0.3 }}
                        className="flex-1 min-w-0"
                      >
                        <p className="text-sm font-semibold text-theme-text truncate">
                          {getUserDisplayName()}
                        </p>
                        <p className="text-xs text-theme-text/60 truncate">
                          {user?.email}
                        </p>
                        <div className="flex items-center mt-1 space-x-2">
                          <div className="w-2 h-2 bg-theme-success rounded-full animate-pulse" />
                          <span className="text-xs text-theme-success">Online</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Magnet>
            </motion.div>
          )}

          {/* Navigation Menu with enhanced styling */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-2">
              {/* Home */}
              <motion.div
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Link to="/">
                  <GlareHover
                    width="100%"
                    height="48px"
                    background={isActiveRoute('/') ? 'var(--theme-primary)/20' : 'transparent'}
                    borderRadius="12px"
                    borderColor={isActiveRoute('/') ? 'var(--theme-primary)' : 'transparent'}
                    glareColor="var(--theme-primary)"
                    glareOpacity={0.3}
                    className={`transition-all duration-300 ${
                      isActiveRoute('/') 
                        ? '!border-theme-primary/50 !bg-theme-primary/20' 
                        : 'hover:!border-theme-border/30 hover:!bg-theme-surface/30'
                    }`}
                  >
                    <div className="w-full h-full flex items-center px-4 space-x-3">
                      <HomeIcon className={`w-5 h-5 ${
                        isActiveRoute('/') ? 'text-theme-primary' : 'text-theme-text'
                      } transition-colors`} />
                      <AnimatePresence mode="wait">
                        {!collapsed && (
                          <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                            className={`font-medium ${
                              isActiveRoute('/') ? 'text-theme-primary' : 'text-theme-text'
                            } transition-colors`}
                          >
                            Home
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  </GlareHover>
                </Link>
              </motion.div>

              {/* Game Actions Section */}
              <motion.div 
                className="pt-4"
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-4 pb-2"
                    >
                      <span className="text-xs font-semibold text-theme-text/60 uppercase tracking-wider">
                        Game Actions
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <div className="space-y-1">
                  {[
                    { path: '/create-session', icon: PlusIcon, label: 'Create Session' },
                    { path: '/join', icon: UserGroupIcon, label: 'Join Game' },
                    { path: '/control-room', icon: Cog6ToothIcon, label: 'Control Room' },
                  ].map((item) => (
                    <Link key={item.path} to={item.path}>
                      <GlareHover
                        width="100%"
                        height="44px"
                        background={isActiveRoute(item.path) ? 'var(--theme-primary)/15' : 'transparent'}
                        borderRadius="10px"
                        borderColor={isActiveRoute(item.path) ? 'var(--theme-primary)' : 'transparent'}
                        glareColor="var(--theme-primary)"
                        glareOpacity={0.25}
                        className={`transition-all duration-300 ${
                          isActiveRoute(item.path) 
                            ? '!border-theme-primary/40 !bg-theme-primary/15' 
                            : 'hover:!border-theme-border/20 hover:!bg-theme-surface/20'
                        }`}
                      >
                        <div className="w-full h-full flex items-center px-4 space-x-3">
                          <item.icon className={`w-4 h-4 ${
                            isActiveRoute(item.path) ? 'text-theme-primary' : 'text-theme-text/70'
                          } transition-colors`} />
                          <AnimatePresence mode="wait">
                            {!collapsed && (
                              <motion.span
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                                className={`text-sm ${
                                  isActiveRoute(item.path) ? 'text-theme-primary font-medium' : 'text-theme-text/70'
                                } transition-colors`}
                              >
                                {item.label}
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </div>
                      </GlareHover>
                    </Link>
                  ))}
                </div>
              </motion.div>

              {/* Tools Section */}
              <motion.div 
                className="pt-4"
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-4 pb-2"
                    >
                      <span className="text-xs font-semibold text-theme-text/60 uppercase tracking-wider">
                        Tools & Testing
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <div className="space-y-1">
                  <Link to="/api-status">
                    <GlareHover
                      width="100%"
                      height="44px"
                      background={isActiveRoute('/api-status') ? 'var(--theme-primary)/15' : 'transparent'}
                      borderRadius="10px"
                      borderColor={isActiveRoute('/api-status') ? 'var(--theme-primary)' : 'transparent'}
                      glareColor="var(--theme-primary)"
                      glareOpacity={0.25}
                      className={`transition-all duration-300 ${
                        isActiveRoute('/api-status') 
                          ? '!border-theme-primary/40 !bg-theme-primary/15' 
                          : 'hover:!border-theme-border/20 hover:!bg-theme-surface/20'
                      }`}
                    >
                      <div className="w-full h-full flex items-center px-4 space-x-3">
                        <ClipboardDocumentListIcon className={`w-4 h-4 ${
                          isActiveRoute('/api-status') ? 'text-theme-primary' : 'text-theme-text/70'
                        } transition-colors`} />
                        <AnimatePresence mode="wait">
                          {!collapsed && (
                            <motion.span
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -10 }}
                              transition={{ duration: 0.2 }}
                              className={`text-sm ${
                                isActiveRoute('/api-status') ? 'text-theme-primary font-medium' : 'text-theme-text/70'
                              } transition-colors`}
                            >
                              API Status
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>
                    </GlareHover>
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Footer Actions with premium styling */}
          <motion.div 
            className="p-4 border-t border-theme-border/30 space-y-3"
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Theme Toggle */}
            <ClickSpark 
              sparkColor="var(--theme-secondary)"
              sparkCount={8}
              sparkRadius={15}
            >
              <GlareHover
                width="100%"
                height="48px"
                background="var(--theme-surface)/40"
                borderRadius="12px"
                borderColor="var(--theme-border)"
                glareColor="var(--theme-secondary)"
                glareOpacity={0.3}
                className="!border-theme-border/30 hover:!border-theme-secondary/50 transition-all duration-300"
              >
                <button
                  onClick={toggleTheme}
                  className="w-full h-full flex items-center justify-center space-x-3 text-theme-text hover:text-theme-secondary transition-colors group"
                >
                  <motion.div
                    animate={{ rotate: isDark ? 180 : 0 }}
                    transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
                  >
                    {isDark ? (
                      <SunIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    ) : (
                      <MoonIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    )}
                  </motion.div>
                  <AnimatePresence mode="wait">
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="font-medium"
                      >
                        {isDark ? 'Light Mode' : 'Dark Mode'}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </GlareHover>
            </ClickSpark>

            {/* Auth Actions */}
            {isAuthenticated ? (
              <ClickSpark 
                sparkColor="var(--theme-error)"
                sparkCount={6}
                sparkRadius={12}
              >
                <GlareHover
                  width="100%"
                  height="48px"
                  background="var(--theme-error)/10"
                  borderRadius="12px"
                  borderColor="var(--theme-error)"
                  glareColor="var(--theme-error)"
                  glareOpacity={0.4}
                  className="!border-theme-error/30 hover:!border-theme-error/70 transition-all duration-300"
                >
                  <button
                    onClick={handleSignOut}
                    className="w-full h-full flex items-center justify-center space-x-3 text-theme-error hover:text-white transition-colors group"
                  >
                    <ArrowRightOnRectangleIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <AnimatePresence mode="wait">
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.2 }}
                          className="font-medium"
                        >
                          Sign Out
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                </GlareHover>
              </ClickSpark>
            ) : (
              <ClickSpark 
                sparkColor="var(--theme-success)"
                sparkCount={6}
                sparkRadius={12}
              >
                <GlareHover
                  width="100%"
                  height="48px"
                  background="var(--theme-success)/10"
                  borderRadius="12px"
                  borderColor="var(--theme-success)"
                  glareColor="var(--theme-success)"
                  glareOpacity={0.4}
                  className="!border-theme-success/30 hover:!border-theme-success/70 transition-all duration-300"
                >
                  <Link 
                    to="/auth"
                    className="w-full h-full flex items-center justify-center space-x-3 text-theme-success hover:text-white transition-colors group"
                  >
                    <ArrowLeftOnRectangleIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <AnimatePresence mode="wait">
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.2 }}
                          className="font-medium"
                        >
                          Sign In
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>
                </GlareHover>
              </ClickSpark>
            )}
          </motion.div>
        </div>
      </motion.div>
    </>
  );
};
