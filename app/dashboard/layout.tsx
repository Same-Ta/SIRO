'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { User, Search, Bell, FileText, Sparkles, Home, BookOpen, TrendingUp, Menu } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const navItems = [
    { href: '/dashboard', label: '내 정보', Icon: User },
    { href: '/dashboard', label: '대시 검색', Icon: Search },
    { href: '/dashboard', label: '알림', Icon: Bell },
  ]

  const menuItems = [
    { href: '/dashboard', label: '내 공고', active: pathname === '/dashboard' },
    { href: '/dashboard/recommendations', label: '추천 활동', active: pathname === '/dashboard/recommendations' },
    { href: '/dashboard/reflection-home', label: '회고 홈', active: pathname === '/dashboard/reflection-home' },
    { href: '/dashboard/reflections', label: '나의 회고', active: pathname === '/dashboard/reflections' },
    { href: '/dashboard/reflections/templates', label: '템플릿', active: pathname === '/dashboard/reflections/templates' },
    { href: '/dashboard/reflections/analysis', label: '성장 분석', active: pathname === '/dashboard/reflections/analysis' },
  ]

  return (
    <div className="flex min-h-screen bg-[#F1F2F3]">
      {/* Left Sidebar */}
      <aside className="w-[240px] bg-[#1B1C1E] text-white fixed h-full flex flex-col">
        {/* Logo */}
        <div className="p-6">
          <div className="w-10 h-10 bg-[#25A778] rounded-[12px] flex items-center justify-center">
            <span className="text-white font-extrabold text-xl">P</span>
          </div>
        </div>

        {/* Top Navigation */}
        <div className="px-4 space-y-2 mb-8">
          {navItems.map((item) => {
            const Icon = item.Icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 text-white/70 hover:text-white hover:bg-white/5 rounded-[8px] transition-all"
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Main Menu */}
        <nav className="flex-1 px-4 space-y-1">
          {/* 직무 선택 카테고리 */}
          <Link
            href="/dashboard/career"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-[8px] transition-all ${
              pathname === '/dashboard/career'
                ? 'bg-[#25A778] text-white font-bold'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">직무 선택</span>
          </Link>
          
          {/* 스펙체크 카테고리 */}
          <Link
            href="/dashboard/spec-check"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-[8px] transition-all ${
              pathname?.startsWith('/dashboard/spec-check')
                ? 'bg-[#25A778] text-white font-bold'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm">스펙체크</span>
          </Link>
          
          {/* 구분선 */}
          <div className="h-px bg-white/10 my-3"></div>
          
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-[8px] transition-all ${
              pathname === '/dashboard'
                ? 'bg-[#25A778] text-white font-bold'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="text-sm">내 공고</span>
          </Link>
          <Link
            href="/dashboard/recommendations"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-[8px] transition-all ${
              pathname === '/dashboard/recommendations'
                ? 'bg-[#25A778] text-white font-bold'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm">추천 활동</span>
          </Link>
          <Link
            href="/dashboard/reflection-home"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-[8px] transition-all ${
              pathname === '/dashboard/reflection-home'
                ? 'bg-[#25A778] text-white font-bold'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Home className="w-4 h-4" />
            <span className="text-sm">회고 홈</span>
          </Link>
          <Link
            href="/dashboard/reflections"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-[8px] transition-all ${
              pathname?.startsWith('/dashboard/reflections')
                ? 'bg-[#25A778] text-white font-bold'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="text-sm">경험정리</span>
          </Link>
          <Link
            href="/dashboard/reflections/analysis"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-[8px] transition-all ${
              pathname === '/dashboard/reflections/analysis'
                ? 'bg-[#25A778] text-white font-bold'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">성장 분석</span>
          </Link>
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-white/10">
          <button className="w-full px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-[8px] transition-all text-left">
            로그아웃
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-[240px] flex-1">
        {children}
      </main>
    </div>
  )
}
