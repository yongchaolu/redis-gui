/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LayoutDashboard, Activity, Database, Settings, RefreshCcw, LogOut, Terminal, Layers } from 'lucide-react';
import { OverviewView } from './components/OverviewView';
import { RealTimeMonitorView } from './components/RealTimeMonitorView';
import { MemoryAnalysisView } from './components/MemoryAnalysisView';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';

type ViewType = 'overview' | 'monitor' | 'memory' | 'config';

export default function App() {
  const [activeView, setActiveView] = useState<ViewType>('overview');

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'monitor', label: 'Real-time Monitor', icon: Activity },
    { id: 'memory', label: 'Memory Analysis', icon: Layers },
    { id: 'config', label: 'Configuration', icon: Settings },
  ];

  return (
    <div className="flex h-screen w-full bg-obsidian overflow-hidden selection:bg-redis-red/30">
      {/* Sidebar */}
      <aside className="w-[240px] border-r border-border bg-surface flex flex-col shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-1">
             <div className="w-8 h-8 rounded bg-redis-red flex items-center justify-center text-white">
                <Database className="w-5 h-5 fill-current" />
             </div>
             <div>
                <h1 className="text-xl font-black text-redis-red uppercase tracking-wider leading-none">Redis Insight</h1>
                <p className="text-[10px] text-text-secondary font-mono mt-1">v7.2.0-stable</p>
             </div>
          </div>
        </div>

        <nav className="flex-1 mt-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as ViewType)}
                className={cn(
                  "w-full flex items-center gap-3 px-6 py-3 transition-all duration-200 group relative",
                  isActive 
                    ? "text-white bg-white/5 border-l-2 border-redis-red" 
                    : "text-text-secondary hover:text-white hover:bg-white/5"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "text-redis-red" : "group-hover:text-white")} />
                <span className="text-sm font-medium tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border bg-obsidian/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-redis-red text-white flex items-center justify-center font-bold text-xs">
              RD
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">Local Instance</p>
              <p className="text-[10px] text-text-secondary truncate font-mono">127.0.0.1:6379</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 border-b border-border bg-surface/95 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-6 font-mono text-[10px] uppercase tracking-widest text-text-secondary">
            <span className="text-redis-red font-bold animate-pulse">Redis Performance Monitor</span>
            <div className="flex gap-4 border-l border-border pl-4">
              <span>127.0.0.1:6379</span>
              <span>v7.2.4</span>
              <span className="text-white font-bold">Up: 14d 2h</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-text-secondary hover:text-white transition-colors active:scale-90">
              <RefreshCcw className="w-4 h-4" />
            </button>
            <button className="p-2 text-text-secondary hover:text-white transition-colors">
              <Settings className="w-4 h-4" />
            </button>
            <button className="bg-redis-red text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all">
              Disconnect
            </button>
          </div>
        </header>

        {/* Content Canvas */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 custom-scrollbar scroll-smooth">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeView === 'overview' && <OverviewView />}
              {activeView === 'monitor' && <RealTimeMonitorView />}
              {activeView === 'memory' && <MemoryAnalysisView />}
              {activeView === 'config' && (
                <div className="flex flex-col items-center justify-center min-h-[400px] text-text-secondary">
                  <Terminal className="w-12 h-12 mb-4 opacity-20" />
                  <p className="font-mono text-sm tracking-widest uppercase">Configuration Panel Loaded</p>
                  <p className="text-[10px] mt-2 italic">Detailed system parameters available in terminal</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

