import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronDown,
  Headset,
  MessageCircle,
  Phone,
  BarChart3,
  ShieldCheck,
  Zap,
  Users,
  Globe2,
  Settings2,
  Workflow,
  Sparkles,
  BrainCircuit,
  Building2,
  ShoppingCart,
  CreditCard,
  Truck,
  PlayCircle,
  Mail,
  MapPin,
  Menu,
} from "lucide-react";

const CAPABILITIES = [
  {
    icon: Bot,
    title: "AI Agents",
    desc: "Understand customer intent and solve problems automatically.",
  },
  {
    icon: Workflow,
    title: "Automation",
    desc: "Execute real actions instead of only sending text responses.",
  },
  {
    icon: Users,
    title: "Human Support",
    desc: "Seamlessly hand conversations to human agents when needed.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    desc: "Measure conversations, agents, tools, performance, and outcomes.",
  },
];

const INDUSTRIES = [
  {
    icon: Headset,
    title: "Customer Support",
    desc: "Resolve customer questions and support requests faster.",
  },
  {
    icon: Zap,
    title: "Technical Support",
    desc: "Help customers troubleshoot products and technical issues.",
  },
  {
    icon: CreditCard,
    title: "Billing",
    desc: "Handle billing questions, payments, and account requests.",
  },
  {
    icon: ShoppingCart,
    title: "Sales",
    desc: "Capture leads and guide customers toward the right products.",
  },
  {
    icon: Users,
    title: "HR",
    desc: "Support employees with automated internal assistance.",
  },
  {
    icon: Building2,
    title: "Account Services",
    desc: "Manage customer accounts and service requests.",
  },
  {
    icon: Truck,
    title: "Order Management",
    desc: "Track orders, updates, and customer delivery requests.",
  },
  {
    icon: Globe2,
    title: "Internal Support",
    desc: "Give teams an intelligent assistant for everyday operations.",
  },
];

const CHANNELS = [
  "Web Chat",
  "WhatsApp",
  "Phone",
  "Messenger",
  "Telegram",
  "Email",
];

const NEWS = [
  {
    title: "Introducing Multi-Channel Support",
    date: "Product Update",
    desc: "Connect customers across web, messaging, phone, and more.",
  },
  {
    title: "AI + Human Collaboration",
    date: "Company News",
    desc: "Let AI resolve routine requests while agents handle complex cases.",
  },
  {
    title: "The Future of AI Customer Service",
    date: "Industry Insights",
    desc: "How intelligent automation is changing customer operations.",
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden">
      {/* =========================================================
          HEADER
      ========================================================= */}
      <header className="fixed inset-x-0 top-0 z-[100] h-[72px] border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3"
            aria-label="AI Call Center home"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#06243d]">
              <Headset size={19} className="text-white" />
            </div>

            <div className="leading-none">
              <div className="text-[15px] font-bold tracking-tight text-[#06243d]">
                AI Call Center
              </div>

              <div className="mt-1 text-[8px] font-medium tracking-[0.12em] text-slate-400">
                INTELLIGENT CUSTOMER OPERATIONS
              </div>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden items-center gap-8 lg:flex">
            <a
              href="#platform"
              className="text-[13px] font-medium text-slate-600 transition-colors hover:text-[#06243d]"
            >
              Platform
            </a>

            <div className="group relative">
              <button className="flex items-center gap-1.5 text-[13px] font-medium text-slate-600 transition-colors hover:text-[#06243d]">
                Solutions
                <ChevronDown
                  size={13}
                  className="transition-transform group-hover:rotate-180"
                />
              </button>

              <div className="invisible absolute left-1/2 top-full mt-4 w-60 -translate-x-1/2 rounded-xl border border-slate-200 bg-white p-2 opacity-0 shadow-xl transition-all group-hover:visible group-hover:opacity-100">
                <a
                  href="#solutions"
                  className="block rounded-lg px-4 py-3 hover:bg-slate-50"
                >
                  <div className="text-sm font-semibold text-slate-800">
                    Customer Support
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    Automate customer conversations
                  </div>
                </a>

                <a
                  href="#solutions"
                  className="block rounded-lg px-4 py-3 hover:bg-slate-50"
                >
                  <div className="text-sm font-semibold text-slate-800">
                    Sales
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    Convert conversations into opportunities
                  </div>
                </a>

                <a
                  href="#solutions"
                  className="block rounded-lg px-4 py-3 hover:bg-slate-50"
                >
                  <div className="text-sm font-semibold text-slate-800">
                    Enterprise
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    Intelligent operations at scale
                  </div>
                </a>
              </div>
            </div>

            <a
              href="#how-it-works"
              className="text-[13px] font-medium text-slate-600 transition-colors hover:text-[#06243d]"
            >
              How it works
            </a>

            <a
              href="#resources"
              className="text-[13px] font-medium text-slate-600 transition-colors hover:text-[#06243d]"
            >
              Resources
            </a>

            <a
              href="#company"
              className="text-[13px] font-medium text-slate-600 transition-colors hover:text-[#06243d]"
            >
              Company
            </a>
          </nav>

          {/* Actions */}
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/login"
              className="px-3 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:text-[#06243d]"
            >
              Sign in
            </Link>

            <Link
              href="/contact"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-[#087d78] px-5 text-[13px] font-semibold text-white transition-colors hover:bg-[#066b67]"
            >
              Talk to us
              <ArrowRight size={14} className="ml-2" />
            </Link>
          </div>

          {/* Mobile */}
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 lg:hidden"
            aria-label="Open navigation"
          >
            <Menu size={19} />
          </button>
        </div>
      </header>

      {/* =========================================================
          HERO
      ========================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#effcff] via-white to-[#ecfff7]">
        {/* Background decoration */}
        <div className="absolute -right-40 top-10 w-[600px] h-[600px] rounded-full bg-emerald-200/20 blur-3xl" />
        <div className="absolute -left-40 bottom-0 w-[500px] h-[500px] rounded-full bg-cyan-200/20 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6 py-20 lg:py-24 grid lg:grid-cols-[0.9fr_1.1fr] gap-12 items-center">
          {/* Hero Content */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1.5 mb-6 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />

              <span className="text-[11px] font-semibold text-emerald-700">
                Next-Gen AI Call Center Platform
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-[64px] font-bold tracking-tight leading-[1.02] text-[#06233d]">
              The Future of
              <br />
              Customer Service
              <br />
              <span className="text-emerald-500">Is Here</span>
            </h1>

            <p className="mt-7 text-lg leading-8 text-slate-600 max-w-xl">
              An intelligent AI call center that understands customers, executes
              real actions, and seamlessly connects them with human agents when
              needed.
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-8">
              <a
                href="#contact"
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-3.5 rounded-full transition shadow-xl shadow-emerald-500/20"
              >
                Get Started
                <ArrowRight size={17} />
              </a>

              <a
                href="#platform"
                className="inline-flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-6 py-3.5 rounded-full transition"
              >
                <PlayCircle size={17} />
                Watch Demo
              </a>
            </div>

            {/* Hero trust points */}
            <div className="flex flex-wrap gap-x-7 gap-y-3 mt-8 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <Headset size={15} className="text-emerald-500" />
                24/7 Support
              </div>

              <div className="flex items-center gap-2">
                <MessageCircle size={15} className="text-emerald-500" />
                Multi-Channel
              </div>

              <div className="flex items-center gap-2">
                <Users size={15} className="text-emerald-500" />
                AI + Human
              </div>

              <div className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-emerald-500" />
                Secure
              </div>
            </div>
          </div>

          {/* Hero Product Visual */}
          <div className="relative min-h-[470px]">
            {/* Main AI circle */}
            <div className="absolute right-0 top-4 w-[390px] h-[390px] lg:w-[470px] lg:h-[470px] rounded-full bg-gradient-to-br from-cyan-100 via-white to-emerald-100 border border-white shadow-2xl flex items-center justify-center">
              <div className="w-[270px] h-[270px] lg:w-[330px] lg:h-[330px] rounded-full bg-gradient-to-br from-[#073554] to-[#087d78] flex items-center justify-center shadow-2xl">
                <div className="text-center text-white">
                  <div className="w-20 h-20 mx-auto rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center mb-5">
                    <Bot size={44} />
                  </div>

                  <div className="font-bold text-xl">AI Assistant</div>
                  <div className="text-sm text-white/70 mt-1">
                    Always ready to help
                  </div>

                  <div className="flex items-center justify-center gap-1.5 mt-5">
                    <span className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse" />
                    <span className="text-xs text-emerald-200">Online</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer message */}
            <div className="absolute left-0 top-20 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 w-56">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                  <Users size={15} />
                </div>

                <div>
                  <div className="text-[11px] font-bold">Customer</div>
                  <div className="text-[9px] text-slate-400">Just now</div>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-5">
                Hi! I need help checking my order status.
              </p>
            </div>

            {/* AI response */}
            <div className="absolute right-0 bottom-20 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 w-60">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Bot size={15} className="text-emerald-600" />
                </div>

                <div>
                  <div className="text-[11px] font-bold">AI Assistant</div>
                  <div className="text-[9px] text-emerald-500">
                    Generating response...
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-5">
                Let me check that for you. Your order is currently in transit...
              </p>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-[9px] text-slate-400">Order #1245</span>

                <span className="text-[9px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full">
                  Tracking
                </span>
              </div>
            </div>

            {/* Human handoff */}
            <div className="absolute left-8 bottom-4 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                <Headset size={16} className="text-blue-600" />
              </div>

              <div>
                <div className="text-[10px] font-bold">Human Handoff</div>
                <div className="text-[9px] text-slate-400">
                  Connecting to an agent...
                </div>
              </div>
            </div>

            {/* Channels */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-white rounded-full border border-slate-100 shadow-lg px-5 py-3 flex items-center gap-5 text-[10px] text-slate-500">
              <span>WhatsApp</span>
              <span>Web Chat</span>
              <span>Phone</span>
              <span>Messenger</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          CAPABILITY INTRO
      ========================================================= */}
      <section id="platform" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-12 items-center">
            <div>
              <div className="text-[10px] font-bold tracking-widest text-emerald-600 uppercase mb-3">
                What We Do
              </div>

              <h2 className="text-4xl font-bold text-[#06233d]">
                One Platform.
                <br />
                Complete Support.
              </h2>

              <p className="mt-5 text-slate-500 leading-7 max-w-md">
                AI Call Center brings together autonomous AI agents, powerful
                tools, knowledge, memory, analytics, and human support — all
                inside one unified platform.
              </p>

              <a
                href="#solutions"
                className="inline-flex items-center gap-2 mt-7 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
              >
                Explore Features
                <ArrowRight size={16} />
              </a>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {CAPABILITIES.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-slate-100 bg-white p-5 hover:shadow-xl hover:-translate-y-1 transition-all"
                >
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center mb-5">
                    <item.icon size={21} className="text-emerald-600" />
                  </div>

                  <h3 className="font-bold text-[#06233d] text-sm">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-500 leading-5 mt-2">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          AI WORKFLOW
      ========================================================= */}
      <section className="bg-[#06243d] py-20 text-white overflow-hidden relative">
        <div className="absolute -left-40 top-0 w-96 h-96 rounded-full border border-white/5" />
        <div className="absolute right-0 bottom-0 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-[0.7fr_1.3fr] gap-16 items-center">
            <div>
              <div className="text-[10px] tracking-widest uppercase font-bold text-emerald-400">
                The Power Behind Every Conversation
              </div>

              <h2 className="text-4xl font-bold mt-3">
                More Than Just
                <br />a Chatbot
              </h2>

              <p className="text-white/60 leading-7 mt-5 max-w-md">
                Our AI agents combine intelligence, tools, knowledge, memory,
                and automation to deliver real solutions — not just answers.
              </p>

              <a
                href="#solutions"
                className="inline-flex items-center gap-2 mt-7 border border-emerald-400/40 text-emerald-300 px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-emerald-400/10 transition"
              >
                Learn More
                <ArrowRight size={15} />
              </a>
            </div>

            {/* Workflow */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {[
                {
                  icon: BrainCircuit,
                  title: "Understand",
                  desc: "Customer intent and context",
                },
                {
                  icon: Settings2,
                  title: "Decide",
                  desc: "Choose the best agent and workflow",
                },
                {
                  icon: Zap,
                  title: "Act",
                  desc: "Use tools and knowledge",
                },
                {
                  icon: CheckCircle2,
                  title: "Resolve",
                  desc: "Automate or hand off to a human",
                },
              ].map((item, index) => (
                <div key={item.title} className="relative text-center">
                  <div className="w-16 h-16 mx-auto rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <item.icon size={25} className="text-emerald-400" />
                  </div>

                  <h3 className="font-bold mt-4">{item.title}</h3>

                  <p className="text-xs text-white/50 leading-5 mt-2">
                    {item.desc}
                  </p>

                  {index < 3 && (
                    <ArrowRight
                      size={16}
                      className="hidden md:block absolute -right-4 top-6 text-white/30"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          INDUSTRIES
      ========================================================= */}
      <section id="solutions" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-[0.7fr_1.3fr] gap-12">
            <div>
              <div className="text-[10px] font-bold tracking-widest text-emerald-600 uppercase">
                Industries
              </div>

              <h2 className="text-4xl font-bold text-[#06233d] mt-3">
                Built for Real
                <br />
                Customer Operations
              </h2>

              <p className="text-slate-500 leading-7 mt-5 max-w-sm">
                From small businesses to large enterprises, AI Call Center
                adapts to your unique support needs.
              </p>

              <a
                href="#contact"
                className="inline-flex items-center gap-2 mt-7 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 rounded-full text-sm font-semibold transition"
              >
                Explore Solutions
                <ArrowRight size={15} />
              </a>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
              {INDUSTRIES.map((item) => (
                <div
                  key={item.title}
                  className="border border-slate-100 rounded-2xl p-5 hover:shadow-lg hover:border-emerald-100 transition"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <item.icon size={18} className="text-emerald-600" />
                  </div>

                  <h3 className="font-bold text-sm text-[#06233d] mt-4">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-500 leading-5 mt-2">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          AI + HUMAN
      ========================================================= */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-cyan-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div>
              <div className="text-[10px] font-bold tracking-widest text-emerald-600 uppercase">
                The Perfect Balance
              </div>

              <h2 className="text-4xl font-bold text-[#06233d] mt-3">
                AI + Human
                <br />
                Collaboration
              </h2>

              <p className="text-slate-500 leading-7 mt-5 max-w-lg">
                Automation when AI can handle it. Humans when they need to step
                in. Customers never have to start their conversation again.
              </p>

              <div className="space-y-3 mt-7">
                {[
                  "AI resolves routine customer requests",
                  "Complex cases are automatically handed to staff",
                  "Human agents receive the full conversation context",
                  "Agents can use AI drafts or answer templates",
                  "Staff always control what gets sent",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 text-sm text-slate-600"
                  >
                    <CheckCircle2
                      size={17}
                      className="text-emerald-500 shrink-0"
                    />
                    {item}
                  </div>
                ))}
              </div>

              <a
                href="#contact"
                className="inline-flex items-center gap-2 mt-8 text-sm font-semibold text-emerald-600"
              >
                See How It Works
                <ArrowRight size={16} />
              </a>
            </div>

            {/* Staff dashboard mockup */}
            <div className="relative">
              <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
                {/* Mockup header */}
                <div className="h-12 border-b border-slate-100 flex items-center justify-between px-5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-emerald-500" />
                    <span className="text-xs font-bold">AI Call Center</span>
                  </div>

                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-slate-200" />
                    <span className="w-2 h-2 rounded-full bg-slate-200" />
                    <span className="w-2 h-2 rounded-full bg-slate-200" />
                  </div>
                </div>

                <div className="grid grid-cols-[150px_1fr] min-h-[330px]">
                  {/* Sidebar */}
                  <div className="bg-[#06243d] p-4 text-white">
                    <div className="text-[9px] text-white/40 uppercase mb-4">
                      Staff Dashboard
                    </div>

                    {[
                      "Dashboard",
                      "My Cases",
                      "Chatbot",
                      "Profile",
                      "Settings",
                    ].map((item, index) => (
                      <div
                        key={item}
                        className={`text-[10px] px-3 py-2 rounded-lg mb-1 ${
                          index === 1
                            ? "bg-emerald-500 text-white"
                            : "text-white/50"
                        }`}
                      >
                        {item}
                      </div>
                    ))}
                  </div>

                  {/* Chat area */}
                  <div className="p-5 bg-slate-50">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <div className="text-sm font-bold">
                          Customer Support Case
                        </div>
                        <div className="text-[9px] text-slate-400">
                          Case #1245 · In Progress
                        </div>
                      </div>

                      <div className="text-[9px] bg-emerald-100 text-emerald-600 px-2 py-1 rounded-full">
                        AI Handoff
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="bg-white rounded-xl p-3 max-w-[75%] shadow-sm">
                        <div className="text-[9px] text-slate-400 mb-1">
                          Customer
                        </div>

                        <div className="text-[10px] text-slate-600">
                          I need help with my account.
                        </div>
                      </div>

                      <div className="bg-emerald-500 text-white rounded-xl p-3 max-w-[75%] ml-auto">
                        <div className="text-[9px] text-white/60 mb-1">
                          AI Draft
                        </div>

                        <div className="text-[10px]">
                          I can help you with that. Let me check your account
                          details.
                        </div>
                      </div>

                      <div className="bg-white border border-emerald-100 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles size={12} className="text-emerald-500" />

                          <span className="text-[9px] font-semibold">
                            AI Suggested Response
                          </span>
                        </div>

                        <div className="h-2 bg-slate-100 rounded-full w-4/5" />
                        <div className="h-2 bg-slate-100 rounded-full w-3/5 mt-2" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          ADMIN CONTROL
      ========================================================= */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            {/* Dashboard visual */}
            <div className="order-2 lg:order-1">
              <div className="rounded-3xl bg-[#061d31] border border-[#123957] p-4 shadow-2xl">
                <div className="rounded-2xl overflow-hidden bg-[#08263d]">
                  <div className="h-12 border-b border-white/10 flex items-center justify-between px-5">
                    <div className="text-white text-xs font-semibold">
                      Admin Control Panel
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-[9px] text-white/50">
                        System Online
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-[130px_1fr] min-h-[350px]">
                    <div className="border-r border-white/10 p-3">
                      {[
                        "Analytics",
                        "Agents",
                        "Languages",
                        "Tools",
                        "Channels",
                        "Staffs",
                        "Users",
                        "Memory",
                        "Chatbot",
                        "Settings",
                      ].map((item, index) => (
                        <div
                          key={item}
                          className={`text-[8px] px-2 py-2 rounded-md mb-0.5 ${
                            index === 0
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "text-white/40"
                          }`}
                        >
                          {item}
                        </div>
                      ))}
                    </div>

                    <div className="p-5">
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          ["Users", "8,420"],
                          ["Messages", "122K"],
                          ["Agents", "12"],
                          ["Response", "1.5s"],
                        ].map(([title, value]) => (
                          <div
                            key={title}
                            className="bg-white/5 rounded-xl p-3"
                          >
                            <div className="text-[7px] text-white/40">
                              {title}
                            </div>
                            <div className="text-sm text-white font-bold mt-1">
                              {value}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 bg-white/5 rounded-xl p-4 h-44">
                        <div className="text-[9px] text-white/50 mb-3">
                          Activity Over Time
                        </div>

                        <div className="h-24 flex items-end gap-2">
                          {[35, 55, 42, 70, 52, 80, 65, 90, 74, 95].map(
                            (height, index) => (
                              <div
                                key={index}
                                className="flex-1 rounded-t bg-emerald-400/70"
                                style={{ height: `${height}%` }}
                              />
                            ),
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="order-1 lg:order-2">
              <div className="text-[10px] font-bold tracking-widest text-emerald-600 uppercase">
                Admin Control
              </div>

              <h2 className="text-4xl font-bold text-[#06233d] mt-3">
                Powerful Features.
                <br />
                Total Control.
              </h2>

              <p className="text-slate-500 leading-7 mt-5 max-w-lg">
                Give administrators complete control over AI agents, tools,
                knowledge, languages, channels, memory, authentication,
                escalation rules, staff permissions, and chatbot behavior.
              </p>

              <div className="grid sm:grid-cols-2 gap-3 mt-7">
                {[
                  "Configure AI Agents",
                  "Manage Tools",
                  "Control Channels",
                  "Manage Human Agents",
                  "Configure Memory",
                  "Control AI Behavior",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 text-sm text-slate-600"
                  >
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    {item}
                  </div>
                ))}
              </div>

              <Link
                href="/login"
                className="inline-flex items-center gap-2 mt-8 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 rounded-full text-sm font-semibold transition"
              >
                Manage Your Platform
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          CHANNELS / TRUST
      ========================================================= */}
      <section className="bg-[#06243d] py-16 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-[1fr_auto] gap-10 items-center">
            <div>
              <div className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase">
                Built for Modern Businesses
              </div>

              <h2 className="text-3xl font-bold mt-3">
                One AI. Every Conversation.
              </h2>

              <p className="text-white/50 text-sm leading-6 mt-3 max-w-xl">
                Connect customers through the channels they already use while
                maintaining a unified conversation history.
              </p>

              <div className="flex flex-wrap gap-6 mt-7 text-sm text-white/70">
                {CHANNELS.map((channel) => (
                  <div key={channel} className="flex items-center gap-2">
                    <MessageCircle size={14} className="text-emerald-400" />
                    {channel}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-center">
                <div className="text-2xl font-bold text-emerald-400">500+</div>
                <div className="text-[9px] text-white/40 mt-1">
                  Happy Clients
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-center">
                <div className="text-2xl font-bold text-emerald-400">1M+</div>
                <div className="text-[9px] text-white/40 mt-1">
                  Conversations
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-center">
                <div className="text-2xl font-bold text-emerald-400">99.9%</div>
                <div className="text-[9px] text-white/40 mt-1">
                  Availability
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          NEWS
      ========================================================= */}
      <section id="resources" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="text-[10px] font-bold tracking-widest text-emerald-600 uppercase">
                News & Updates
              </div>

              <h2 className="text-3xl font-bold text-[#06233d] mt-3">
                Latest News & Updates
              </h2>

              <p className="text-slate-500 text-sm mt-2">
                Stay informed about our latest features, company news, and
                industry insights.
              </p>
            </div>

            <button className="hidden md:flex items-center gap-2 text-sm font-semibold text-emerald-600">
              View All News
              <ArrowRight size={15} />
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {NEWS.map((item) => (
              <article
                key={item.title}
                className="group border border-slate-100 rounded-2xl overflow-hidden hover:shadow-xl transition"
              >
                <div className="h-36 bg-gradient-to-br from-[#06243d] via-teal-700 to-emerald-400 flex items-center justify-center">
                  <Sparkles
                    size={38}
                    className="text-white/80 group-hover:scale-110 transition"
                  />
                </div>

                <div className="p-5">
                  <div className="text-[10px] text-emerald-600 font-semibold">
                    {item.date}
                  </div>

                  <h3 className="font-bold text-[#06233d] mt-2">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-500 leading-5 mt-2">
                    {item.desc}
                  </p>

                  <div className="flex items-center gap-1 text-xs text-emerald-600 font-semibold mt-5">
                    Read More
                    <ArrowRight size={13} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          FINAL CTA
      ========================================================= */}
      <section id="contact" className="py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="rounded-3xl bg-gradient-to-br from-[#06243d] to-[#087d78] p-10 md:p-14 text-center text-white relative overflow-hidden">
            <div className="absolute -right-20 -top-20 w-60 h-60 rounded-full border border-white/10" />
            <div className="absolute -left-20 -bottom-20 w-60 h-60 rounded-full border border-white/10" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-emerald-200 text-[10px] font-semibold mb-5">
                <Sparkles size={12} />
                READY TO GET STARTED?
              </div>

              <h2 className="text-4xl md:text-5xl font-bold">
                Transform Your
                <br />
                Customer Support
              </h2>

              <p className="text-white/60 max-w-xl mx-auto mt-5 leading-7">
                Join businesses using AI Call Center to automate customer
                support, empower human agents, and deliver better conversations.
              </p>

              <div className="flex flex-wrap justify-center gap-4 mt-8">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 bg-emerald-400 hover:bg-emerald-300 text-[#06243d] font-bold px-6 py-3.5 rounded-full transition"
                >
                  Get Started
                  <ArrowRight size={16} />
                </Link>

                <a
                  href="mailto:support@aicallcenter.com"
                  className="inline-flex items-center gap-2 border border-white/20 hover:bg-white/10 px-6 py-3.5 rounded-full font-semibold transition"
                >
                  Contact Sales
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          FOOTER
      ========================================================= */}
      <footer id="company" className="bg-[#061d31] text-white">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-10">
            {/* Brand */}
            <div className="lg:col-span-2">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                  <Headset size={21} />
                </div>

                <div>
                  <div className="font-bold">AI Call Center</div>
                  <div className="text-[8px] text-white/40 tracking-wider">
                    SMARTER CONVERSATIONS. BETTER SUPPORT.
                  </div>
                </div>
              </Link>

              <p className="text-sm text-white/40 leading-6 max-w-sm mt-5">
                Intelligent customer service powered by AI, automation, and
                human collaboration.
              </p>

              <div className="flex items-center gap-4 mt-6">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/50">
                  <Globe2 size={15} />
                </div>

                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/50">
                  <MessageCircle size={15} />
                </div>

                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/50">
                  <Phone size={15} />
                </div>
              </div>
            </div>

            {/* Products */}
            <div>
              <h3 className="font-semibold text-sm mb-4">Products</h3>

              <div className="space-y-3 text-xs text-white/40">
                <a href="#platform" className="block hover:text-white">
                  AI Agents
                </a>
                <a href="#platform" className="block hover:text-white">
                  Tools
                </a>
                <a href="#platform" className="block hover:text-white">
                  Channels
                </a>
                <a href="#platform" className="block hover:text-white">
                  Integrations
                </a>
              </div>
            </div>

            {/* Solutions */}
            <div>
              <h3 className="font-semibold text-sm mb-4">Solutions</h3>

              <div className="space-y-3 text-xs text-white/40">
                <a href="#solutions" className="block hover:text-white">
                  Customer Support
                </a>
                <a href="#solutions" className="block hover:text-white">
                  Sales
                </a>
                <a href="#solutions" className="block hover:text-white">
                  HR
                </a>
                <a href="#solutions" className="block hover:text-white">
                  Enterprise
                </a>
              </div>
            </div>

            {/* Company */}
            <div>
              <h3 className="font-semibold text-sm mb-4">Company</h3>

              <div className="space-y-3 text-xs text-white/40">
                <a href="#company" className="block hover:text-white">
                  About Us
                </a>
                <a href="#resources" className="block hover:text-white">
                  Careers
                </a>
                <a href="#contact" className="block hover:text-white">
                  Contact
                </a>
                <a href="#resources" className="block hover:text-white">
                  Press
                </a>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="border-t border-white/10 mt-12 pt-7 flex flex-col md:flex-row gap-4 md:items-center md:justify-between text-xs text-white/30">
            <div className="flex flex-wrap gap-5">
              <span className="flex items-center gap-2">
                <MapPin size={13} />
                Addis Ababa, Ethiopia
              </span>

              <span className="flex items-center gap-2">
                <Mail size={13} />
                support@aicallcenter.com
              </span>
            </div>

            <div>
              © {new Date().getFullYear()} AI Call Center. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
