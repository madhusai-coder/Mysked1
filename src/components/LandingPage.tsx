import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Bar, Line } from 'react-chartjs-2';
import {
  ArrowRight,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  GraduationCap,
  Layers,
  Mic,
  Moon,
  ShieldCheck,
  Sliders,
  Sun,
  TrendingUp,
} from 'lucide-react';
import { MySkedLogo } from './MySkedLogo';
import { HeroAcademicScene } from './three/HeroAcademicScene';
import { TechStackCubes } from './three/TechStackCubes';
import { TiltGlassCard } from './three/TiltGlassCard';
import { chartGridColor, chartTextColor } from '../lib/charts';
import type { ThemeMode } from '../types';

gsap.registerPlugin(ScrollTrigger);

interface LandingPageProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onDemoLogin: () => void;
  isAuthenticated: boolean;
  onEnterApp: () => void;
}

const FEATURES = [
  {
    num: '01',
    title: 'Smart Study Planner',
    desc: 'Daily and weekly schedules with drag-and-drop rescheduling, recurring study blocks, and conflict-free automatic timetable generation.',
    icon: Calendar,
  },
  {
    num: '02',
    title: 'Task & Voice Capture',
    desc: 'Track assignments, homework, and projects with priority sorting, progress sliders, overdue alerts, and browser voice-to-task parsing.',
    icon: Mic,
  },
  {
    num: '03',
    title: 'Exam & Syllabus Tracker',
    desc: 'Manage CLA, Mid-Sem, and End-Sem exams with live countdowns, unit-by-unit syllabus checklists, and 1-click revision planning.',
    icon: GraduationCap,
  },
  {
    num: '04',
    title: 'Pomodoro Focus Engine',
    desc: 'Configurable 25/5 focus sprints, long breaks, synthesized Web Audio completion chimes, and persistent focus session logging.',
    icon: Clock,
  },
  {
    num: '05',
    title: 'Rule-Based Study Advisor',
    desc: 'Deterministic logic inspects overdue work, 48-hour deadlines, and syllabus gaps — explaining the exact rule behind every recommendation.',
    icon: Sliders,
  },
  {
    num: '06',
    title: 'Marks & Analytics',
    desc: 'Compare CLA and semester scores across subjects, export CSV/JSON study reports, and track habit consistency rings.',
    icon: TrendingUp,
  },
];

const CAROUSEL_SLIDES = [
  {
    title: 'Weekly Study Planner',
    caption: 'Drag-and-drop sessions across Monday–Sunday with recurring rules and instant timetable generation.',
    highlights: ['Mon 09:00 · CS301 Balanced Trees (90m)', 'Tue 10:00 · CS302 Virtual Memory (90m)', 'Auto-fill empty slots by subject deficit'],
    metricLabel: 'Scheduled This Week',
    metricVal: '18.5 hrs',
  },
  {
    title: 'Exam & Syllabus Readiness',
    caption: 'Live exam countdowns paired with weighted topic checklists for CLA, Mid-Sem, and End-Sem papers.',
    highlights: ['CS301 Mid-Sem · 6 days left · 33% covered', 'CS304 CLA-2 · 11 days left · 50% covered', '1-click revision block scheduling'],
    metricLabel: 'Topics Checked',
    metricVal: '14 / 21',
  },
  {
    title: 'Focus Mode & Pomodoro History',
    caption: 'Distraction-free full-screen timer with custom work/break intervals and procedural audio alerts.',
    highlights: ['25m Focus / 5m Short / 15m Long Break', 'Automatic subject hour credit on finish', 'Zero external audio dependencies'],
    metricLabel: 'Focus Streak',
    metricVal: '6 Days',
  },
  {
    title: 'Academic Performance Ledger',
    caption: 'Record assessment marks, inspect subject percentages, and export clean academic transcripts.',
    highlights: ['CLA-1 CS301 · 27/30 (90.0%)', 'Mid-Sem MA205 · 46/50 (92.0%)', 'Subject-level trend comparisons'],
    metricLabel: 'Current Average',
    metricVal: '88.4%',
  },
];

const SAMPLE_TESTIMONIALS = [
  {
    name: 'Riya Deshmukh',
    role: 'Sample Student · B.Tech Computer Science',
    quote: 'Before mid-sems I always over-studied easy chapters. Seeing exact syllabus completion percentages next to my weekly hour targets cut my last-minute cramming in half.',
    outcome: 'Improved Mid-Sem consistency across 4 core subjects',
  },
  {
    name: 'Daniel Okafor',
    role: 'Sample Student · Mechanical Engineering',
    quote: 'Voice task entry lets me log lab deadlines right after lectures, and the drag-and-drop weekly grid keeps my CAD project hours separate from exam prep.',
    outcome: 'Maintained a 14-day deep focus habit streak',
  },
  {
    name: 'Hannah Lindqvist',
    role: 'Sample Student · Applied Mathematics',
    quote: 'I appreciate that the study advisor tells me the exact rule it used instead of vague hype. When a subject falls behind target, it surfaces the gap right away.',
    outcome: 'Zero missed homework deadlines over a 12-week term',
  },
];

const FAQS = [
  {
    q: 'Is the demo data real or sample data?',
    a: 'Only the clearly labeled Demo Student account (demo@mysked.app) contains pre-populated sample records so you can explore charts, timetables, and recommendations immediately. Newly registered student accounts start completely clean with zero fabricated statistics.',
  },
  {
    q: 'How does the rule-based recommendation engine work?',
    a: 'Every suggestion is produced by transparent deterministic rules that check overdue tasks, 48-hour deadline windows, upcoming exams with under 75% syllabus completion, and subjects behind their weekly hour targets. Every card displays the exact rule and numbers behind it.',
  },
  {
    q: 'Does MySked work without WebGL or with reduced motion?',
    a: 'Yes. If WebGL is unavailable, the 3D hero and tech-stack cubes display clean SVG/CSS fallback panels. When "prefers-reduced-motion" is enabled in your OS, continuous 3D rotation, tilt transforms, and scroll animations pause automatically.',
  },
  {
    q: 'Can I export my study logs, marks, and tasks?',
    a: 'Yes. Inside Analytics and Settings you can export your complete academic dataset as JSON or CSV reports at any time.',
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({
  theme,
  onToggleTheme,
  onOpenAuth,
  onDemoLogin,
  isAuthenticated,
  onEnterApp,
}) => {
  const scrollProgressRef = useRef(0);
  const pageRef = useRef<HTMLDivElement | null>(null);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [flippedCard, setFlippedCard] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    const onScroll = () => {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      scrollProgressRef.current = Math.min(1, Math.max(0, window.scrollY / maxScroll));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let ctx: gsap.Context | undefined;
    if (!prefersReduced && pageRef.current) {
      ctx = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>('.reveal-section').forEach((el) => {
          gsap.fromTo(
            el,
            { opacity: 0, y: 24 },
            {
              opacity: 1,
              y: 0,
              duration: 0.65,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: el,
                start: 'top 86%',
                once: true,
              },
            },
          );
        });
      }, pageRef);
    }

    return () => {
      window.removeEventListener('scroll', onScroll);
      ctx?.revert();
    };
  }, []);

  const previewChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Planned Hours',
        data: [3.5, 4.0, 3.0, 4.5, 3.5, 4.0, 2.5],
        backgroundColor: 'rgba(59, 130, 246, 0.35)',
        borderColor: '#3b82f6',
        borderWidth: 1.5,
        borderRadius: 6,
      },
      {
        label: 'Completed Hours',
        data: [3.5, 3.75, 2.5, 4.5, 3.0, 3.25, 2.0],
        backgroundColor: 'rgba(34, 211, 238, 0.78)',
        borderColor: '#22d3ee',
        borderWidth: 1.5,
        borderRadius: 6,
      },
    ],
  };

  const trendLineData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
    datasets: [
      {
        label: 'Weekly Study Output (hrs)',
        data: [14, 17.5, 16, 20.5, 22, 24.5],
        borderColor: '#a855f7',
        backgroundColor: 'rgba(168, 85, 247, 0.16)',
        fill: true,
        tension: 0.35,
        pointRadius: 4,
        pointBackgroundColor: '#22d3ee',
      },
    ],
  };

  const commonChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: chartTextColor(theme), font: { size: 11 } } },
    },
    scales: {
      x: { grid: { color: chartGridColor(theme) }, ticks: { color: chartTextColor(theme), font: { size: 11 } } },
      y: { grid: { color: chartGridColor(theme) }, ticks: { color: chartTextColor(theme), font: { size: 11 } } },
    },
  };

  const activeSlide = CAROUSEL_SLIDES[carouselIdx];

  return (
    <div ref={pageRef} className="min-h-screen relative overflow-x-clip bg-slate-50 text-slate-900 dark:bg-[#050816] dark:text-slate-100">
      {/* Subtle animated cosmic backdrop */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <div className="animate-gradient-drift absolute -top-40 -left-40 w-[36rem] h-[36rem] rounded-full bg-purple-600/12 dark:bg-purple-600/18 blur-3xl" />
        <div className="animate-gradient-drift absolute top-1/3 -right-32 w-[34rem] h-[34rem] rounded-full bg-cyan-500/12 dark:bg-cyan-500/16 blur-3xl" />
      </div>

      {/* 3-Zone Top Navbar Contract */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-white/10 bg-white/85 dark:bg-[#050816]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <a href="#top" className="shrink-0">
            <MySkedLogo />
          </a>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a href="#features" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0">Features</a>
            <a href="#how-it-works" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0">How It Works</a>
            <a href="#preview" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0">Live Preview</a>
            <a href="#pricing" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0">Pricing</a>
            <a href="#faq" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0">FAQ</a>
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={isAuthenticated ? onEnterApp : () => onOpenAuth('login')}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white hover:brightness-110 transition-all whitespace-nowrap shrink-0 cursor-pointer shadow-sm"
            >
              {isAuthenticated ? 'Open Workspace' : 'Open App'}
            </button>
          </div>
        </div>
      </header>

      {/* Full-Screen 3D Hero */}
      <section id="top" className="relative min-h-[88vh] flex items-center z-10 overflow-hidden">
        <HeroAcademicScene scrollProgressRef={scrollProgressRef} theme={theme} />

        {/* Measured readability scrim over 3D scene */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-slate-50/92 via-slate-50/75 to-transparent dark:from-[#050816]/90 dark:via-[#050816]/65 dark:to-transparent pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 w-full grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 max-w-2xl">
            <p className="text-xs font-mono tracking-wider text-cyan-700 dark:text-cyan-400 mb-3">
              Smart Student Productivity & Study Planner
            </p>
            <h1 className="font-display font-extrabold tracking-tight text-4xl sm:text-5xl lg:text-6xl leading-[1.08] text-slate-900 dark:text-white [text-wrap:balance]">
              Plan Smarter. Study Better.{' '}
              <span className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                Achieve More.
              </span>
            </h1>
            <p className="mt-5 text-base sm:text-lg text-slate-700 dark:text-slate-300 leading-relaxed max-w-xl">
              Unify your weekly study timetable, assignment deadlines, exam syllabus checklists, Pomodoro focus blocks,
              and academic marks in one responsive 3D workspace engineered for measurable student outcomes.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onDemoLogin}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white hover:brightness-110 transition-all whitespace-nowrap shrink-0 cursor-pointer shadow-lg shadow-cyan-500/20"
              >
                Explore Demo Workspace
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth('register')}
                className="px-6 py-3 rounded-xl font-semibold text-sm glass-panel text-slate-900 dark:text-white hover:border-cyan-400/50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Create Student Account
              </button>
              <button
                type="button"
                onClick={onToggleTheme}
                aria-label="Toggle light or dark theme"
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium glass-panel text-slate-700 dark:text-slate-200 hover:border-cyan-400/50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
                <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-600 dark:text-slate-400">
              <span>12 Integrated App Modules</span>
              <span aria-hidden="true">·</span>
              <span>Rule-Based Study Recommendations</span>
              <span aria-hidden="true">·</span>
              <span>Browser Voice Task Entry</span>
              <span aria-hidden="true">·</span>
              <span>Per-Student Data Isolation</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Features with 3D Tilt Holographic Glass Cards */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 py-20 reveal-section">
        <div className="max-w-2xl mb-12">
          <p className="text-xs font-mono text-cyan-600 dark:text-cyan-400 mb-2">Core Capabilities</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white [text-wrap:balance]">
            Everything a semester demands, connected in one schema
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <TiltGlassCard key={feat.num} className="p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs text-cyan-600 dark:text-cyan-400">{feat.num}.</span>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/15 to-purple-500/15 border border-cyan-500/20 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                    </div>
                  </div>
                  <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white mb-2">{feat.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{feat.desc}</p>
                </div>
              </TiltGlassCard>
            );
          })}
        </div>
      </section>

      {/* Section: How It Works */}
      <section id="how-it-works" className="relative z-10 max-w-7xl mx-auto px-6 py-20 reveal-section border-t border-slate-200/70 dark:border-white/10">
        <div className="max-w-2xl mb-12">
          <p className="text-xs font-mono text-purple-600 dark:text-purple-400 mb-2">Workflow</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            From syllabus upload to exam-day readiness in three steps
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              title: 'Define Subjects & Targets',
              body: 'Register your semester courses, color codes, weekly hour goals, and upcoming CLA, Mid-Sem, or End-Sem exam dates.',
            },
            {
              step: '02',
              title: 'Auto-Generate & Capture Tasks',
              body: 'Let MySked fill conflict-free weekly study blocks around your deficits, and add assignments via manual form or voice entry.',
            },
            {
              step: '03',
              title: 'Execute Focus Blocks & Track Marks',
              body: 'Run Pomodoro sprints that automatically credit subject hours, check off syllabus units, and inspect weekly performance charts.',
            },
          ].map((item) => (
            <div key={item.step} className="glass-panel rounded-2xl p-7">
              <div className="font-mono text-2xl font-bold bg-gradient-to-r from-cyan-500 to-purple-500 bg-clip-text text-transparent mb-3">
                {item.step}
              </div>
              <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white mb-2">{item.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section: 3D Floating Dashboard Preview & 3D Flip Product Carousel */}
      <section id="preview" className="relative z-10 max-w-7xl mx-auto px-6 py-20 reveal-section border-t border-slate-200/70 dark:border-white/10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left: 3D Flip Carousel */}
          <div className="lg:col-span-5">
            <p className="text-xs font-mono text-cyan-600 dark:text-cyan-400 mb-2">Interactive Product Tour</p>
            <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
              Explore every module before signing in
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
              Cycle through core workspace screens or flip the 3D card to inspect how database records power each view.
            </p>

            <div className="perspective-1200">
              <div
                className="relative transition-transform duration-500 preserve-3d cursor-pointer"
                style={{ transform: flippedCard ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                onClick={() => setFlippedCard((v) => !v)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setFlippedCard((v) => !v);
                  }
                }}
              >
                {/* Front Face */}
                <div className="glass-panel rounded-2xl p-6 backface-hidden">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400 mb-3">
                    <span>Screen {carouselIdx + 1} / {CAROUSEL_SLIDES.length}</span>
                    <span>Click card to flip 3D</span>
                  </div>
                  <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white mb-2">
                    {activeSlide.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{activeSlide.caption}</p>
                  <div className="space-y-2 mb-5">
                    {activeSlide.highlights.map((h) => (
                      <div key={h} className="text-xs font-mono px-3 py-2 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-slate-200">
                        {h}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-white/10">
                    <span className="text-xs text-slate-500 dark:text-slate-400">{activeSlide.metricLabel}</span>
                    <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">{activeSlide.metricVal}</span>
                  </div>
                </div>

                {/* Back Face */}
                <div
                  className="glass-panel rounded-2xl p-6 backface-hidden absolute inset-0 flex flex-col justify-between"
                  style={{ transform: 'rotateY(180deg)' }}
                >
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono text-purple-600 dark:text-purple-400 mb-3">
                      <span>Backend Architecture</span>
                      <span>Click to flip back</span>
                    </div>
                    <h4 className="font-display font-bold text-lg text-slate-900 dark:text-white mb-2">
                      Backed by Normalized Relational Entities
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      Every view enforces student-level ownership checks, DTO validation, and centralized exception handling.
                      Zero mock numbers are shown to newly registered accounts.
                    </p>
                  </div>
                  <div className="text-xs font-mono text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-200 dark:border-white/10">
                    Tables: Students · Subjects · Tasks · Study_Sessions · Exams · Syllabus · Marks
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <button
                type="button"
                onClick={() => {
                  setFlippedCard(false);
                  setCarouselIdx((i) => (i - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length);
                }}
                aria-label="Previous product view"
                className="p-2.5 rounded-xl glass-panel hover:border-cyan-400/50 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setFlippedCard(false);
                  setCarouselIdx((i) => (i + 1) % CAROUSEL_SLIDES.length);
                }}
                aria-label="Next product view"
                className="p-2.5 rounded-xl glass-panel hover:border-cyan-400/50 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onDemoLogin}
                className="ml-auto px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/25 transition-colors cursor-pointer"
              >
                Open Live Demo
              </button>
            </div>
          </div>

          {/* Right: 3D Tilted Floating Dashboard Preview */}
          <div className="lg:col-span-7 perspective-1200">
            <TiltGlassCard className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs font-mono text-slate-500 dark:text-slate-400">Sample Preview · Demo Workspace</p>
                  <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                    Weekly Planned vs. Completed Study Hours
                  </h3>
                </div>
                <span className="font-mono text-xs text-cyan-600 dark:text-cyan-400">22.5h / 25.0h</span>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-3.5 rounded-xl bg-slate-100/80 dark:bg-white/5">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Focus Streak</div>
                  <div className="font-mono font-bold text-xl text-slate-900 dark:text-white mt-1">6 Days</div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-100/80 dark:bg-white/5">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Next Exam</div>
                  <div className="font-mono font-bold text-xl text-purple-600 dark:text-purple-400 mt-1">6 Days</div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-100/80 dark:bg-white/5">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Avg Marks</div>
                  <div className="font-mono font-bold text-xl text-cyan-600 dark:text-cyan-400 mt-1">88.4%</div>
                </div>
              </div>

              <div className="h-60">
                <Bar data={previewChartData} options={commonChartOptions} />
              </div>
            </TiltGlassCard>
          </div>
        </div>
      </section>

      {/* Section: Analytics Preview & 3D Tech Stack Cubes */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 reveal-section border-t border-slate-200/70 dark:border-white/10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center mb-16">
          <div className="lg:col-span-7 glass-panel rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-mono text-purple-600 dark:text-purple-400">Analytics Preview</p>
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">6-Week Study Output Trajectory</h3>
              </div>
              <Layers className="w-5 h-5 text-purple-500" />
            </div>
            <div className="h-56">
              <Line data={trendLineData} options={commonChartOptions} />
            </div>
          </div>
          <div className="lg:col-span-5">
            <p className="text-xs font-mono text-cyan-600 dark:text-cyan-400 mb-2">Measurable Consistency</p>
            <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
              Daily, weekly, and monthly academic telemetry
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
              Every Pomodoro session, completed task, and recorded CLA/Mid-Sem score feeds directly into interactive
              Chart.js analytics — ready to export as structured reports for mentors or personal review.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Zero fake telemetry. Every chart reflects your own database rows.</span>
            </div>
          </div>
        </div>

        {/* 3D Rotating Tech-Stack Cubes */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-mono text-cyan-600 dark:text-cyan-400 mb-1">Architecture</p>
              <h3 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                3D Interactive Tech Stack
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Hover any stack card below to accelerate its 3D cube in WebGL
            </p>
          </div>
          <TechStackCubes />
        </div>
      </section>

      {/* Section: Sample Student Testimonials */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 reveal-section border-t border-slate-200/70 dark:border-white/10">
        <div className="max-w-2xl mb-10">
          <p className="text-xs font-mono text-purple-600 dark:text-purple-400 mb-2">
            Sample Testimonials · Illustrative Student Workflows
          </p>
          <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            How students structure a high-stakes semester
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SAMPLE_TESTIMONIALS.map((t) => (
            <TiltGlassCard key={t.name} className="p-6 flex flex-col justify-between">
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-6">“{t.quote}”</p>
              <div className="pt-4 border-t border-slate-200 dark:border-white/10">
                <div className="font-display font-bold text-sm text-slate-900 dark:text-white">{t.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t.role}</div>
                <div className="text-xs font-mono text-cyan-600 dark:text-cyan-400 mt-2">{t.outcome}</div>
              </div>
            </TiltGlassCard>
          ))}
        </div>
      </section>

      {/* Section: Pricing Placeholder */}
      <section id="pricing" className="relative z-10 max-w-7xl mx-auto px-6 py-20 reveal-section border-t border-slate-200/70 dark:border-white/10">
        <div className="max-w-2xl mb-10">
          <p className="text-xs font-mono text-cyan-600 dark:text-cyan-400 mb-2">Pricing (Placeholder)</p>
          <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Accessible plans for individual students
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          <div className="glass-panel rounded-2xl p-7 flex flex-col justify-between">
            <div>
              <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mb-1">For Individual Students</div>
              <h3 className="font-display font-bold text-2xl text-slate-900 dark:text-white">Student Core</h3>
              <div className="font-mono text-3xl font-bold text-slate-900 dark:text-white mt-3">
                $0 <span className="text-sm font-normal text-slate-500">/ semester</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                {[
                  'Unlimited subjects, tasks, and weekly study blocks',
                  'CLA, Mid-Sem & End-Sem exam syllabus checklists',
                  'Pomodoro Focus Mode & streak habit tracking',
                  'CSV & JSON academic report exports',
                ].map((line) => (
                  <li key={line} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-cyan-500 mt-0.5 shrink-0" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              onClick={() => onOpenAuth('register')}
              className="mt-8 w-full py-2.5 rounded-xl font-semibold text-sm bg-slate-900 text-white dark:bg-white dark:text-slate-950 hover:opacity-90 transition-opacity cursor-pointer"
            >
              Get Started Free
            </button>
          </div>

          <div className="glass-panel rounded-2xl p-7 border-cyan-500/40 flex flex-col justify-between">
            <div>
              <div className="text-xs font-mono text-cyan-600 dark:text-cyan-400 mb-1">For Cohort & Study Groups</div>
              <h3 className="font-display font-bold text-2xl text-slate-900 dark:text-white">Campus Pro (Preview)</h3>
              <div className="font-mono text-3xl font-bold text-slate-900 dark:text-white mt-3">
                $4 <span className="text-sm font-normal text-slate-500">/ month</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                {[
                  'Everything in Student Core',
                  'Extended PDF resource library attachments',
                  'Automated semester timetable optimization',
                  'Priority notification scheduling & custom digest',
                ].map((line) => (
                  <li key={line} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              onClick={onDemoLogin}
              className="mt-8 w-full py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white hover:brightness-110 transition-all cursor-pointer"
            >
              Preview All Features in Demo
            </button>
          </div>
        </div>
      </section>

      {/* Section: FAQ */}
      <section id="faq" className="relative z-10 max-w-4xl mx-auto px-6 py-20 reveal-section border-t border-slate-200/70 dark:border-white/10">
        <div className="mb-10">
          <p className="text-xs font-mono text-purple-600 dark:text-purple-400 mb-2">FAQ</p>
          <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Frequently asked questions
          </h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((item, i) => {
            const isOpen = openFaq === i;
            return (
              <div key={item.q} className="glass-panel rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  className="w-full px-6 py-4 flex items-center justify-between gap-4 text-left font-display font-semibold text-slate-900 dark:text-white cursor-pointer"
                >
                  <span>{item.q}</span>
                  <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer with Login and Register Buttons */}
      <footer className="relative z-10 border-t border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-[#030612]/80">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <MySkedLogo />
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 max-w-sm">
              Plan Smarter. Study Better. Achieve More. Smart Student Productivity & Study Planner.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onToggleTheme}
              className="px-4 py-2 rounded-xl text-sm font-medium glass-panel text-slate-700 dark:text-slate-200 hover:border-cyan-400/50 cursor-pointer"
            >
              {theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            </button>
            <button
              type="button"
              onClick={() => onOpenAuth('login')}
              className="px-5 py-2 rounded-xl text-sm font-semibold glass-panel text-slate-900 dark:text-white hover:border-cyan-400/50 cursor-pointer"
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => onOpenAuth('register')}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white hover:brightness-110 cursor-pointer"
            >
              Register
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
