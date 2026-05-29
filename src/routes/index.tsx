import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import {
  ChevronRight,
  Menu,
  X,
  Search,
  Zap,
  MessageSquare,
  DollarSign,
  MapPin,
  CheckCircle2,
  ArrowRight,
  Sun,
  Moon,
  Sparkles,
  TrendingUp,
  Shield,
  Zap as ZapIcon,
} from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [
      { title: "LeadGen — Land Your First Client Today" },
      {
        name: "description",
        content:
          "Find local businesses without websites, build them a site with AI, and close them as paying clients — step by step.",
      },
    ],
  }),
});

// Auto-scrolling carousel component
function ImageCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const images = [
    "/images/homepage1.png",
    "/images/homepage2.png",
    "/images/homepage3.png",
    "/images/homepage4.png",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 5000); // Auto-scroll every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full overflow-hidden">
      {/* Carousel container */}
      <div className="relative w-full">
        <div className="flex transition-transform duration-700 ease-out"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
          }}
        >
          {images.map((image, idx) => (
            <div key={idx} className="w-full flex-shrink-0">
              <img
                src={image}
                alt={`Slide ${idx + 1}`}
                className="w-full h-full object-cover rounded-2xl"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.backgroundColor = "var(--card)";
                  target.style.display = "flex";
                  target.style.alignItems = "center";
                  target.style.justifyContent = "center";
                  target.alt = `Image ${idx + 1} not found`;
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Dots indicator */}
      <div className="flex justify-center gap-2 mt-6">
        {images.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              idx === currentIndex
                ? "bg-primary w-8"
                : "bg-border hover:bg-muted-foreground"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

function LandingPage() {
  const { theme, toggle } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedFeature, setExpandedFeature] = useState<number | null>(null);
  const [contactFormOpen, setContactFormOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ email: "", description: "" });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleContactSubmit = () => {
    const { email, description } = contactForm;
    if (email && description) {
      const subject = "LeadGen Sales Inquiry";
      const body = `Email: ${email}\n\nDescription:\n${description}`;
      window.location.href = `mailto:brayanjordan194@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      setContactFormOpen(false);
      setContactForm({ email: "", description: "" });
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      {/* Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-5 sm:px-8 py-4 border-b border-transparent ${
          isScrolled
            ? "bg-background/80 backdrop-blur-xl border-border/40 shadow-soft"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 font-display text-xl font-semibold">
            <img 
              src="/images/assets/logo.png" 
              alt="LeadGen" 
              className="w-24 h-24 object-contain"
            />
            <span className="hidden sm:inline">LeadGen</span>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm hover:text-primary transition hover:translate-y-[-2px] animate-slide-in-left stagger-1">
              Features
            </a>
            <a href="#howitworks" className="text-sm hover:text-primary transition hover:translate-y-[-2px] animate-slide-in-left stagger-2">
              How It Works
            </a>
            <a href="#pricing" className="text-sm hover:text-primary transition hover:translate-y-[-2px] animate-slide-in-left stagger-3">
              Pricing
            </a>
            <a href="#resources" className="text-sm hover:text-primary transition hover:translate-y-[-2px] animate-slide-in-left stagger-4">
              Resources
            </a>
          </div>

          {/* Right side buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggle}
              className="p-2 rounded-lg hover:bg-card transition hover:rotate-180"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link
              to="/auth"
              className="hidden sm:block px-4 py-2 rounded-lg border border-border hover:border-primary transition text-sm animate-slide-in-right hover:scale-105 stagger-5"
            >
              Login
            </Link>
            <Link
              to="/auth"
              className="px-4 py-2 rounded-lg bg-gradient-primary text-primary-foreground hover:shadow-glow transition text-sm font-medium animate-bounce-in stagger-6 hover:scale-105"
            >
              Get Started
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-card transition hover:rotate-90 transition-transform"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 flex flex-col gap-3 border-t border-border/40 pt-4">
            <a href="#features" className="text-sm hover:text-primary transition">
              Features
            </a>
            <a href="#howitworks" className="text-sm hover:text-primary transition">
              How It Works
            </a>
            <a href="#pricing" className="text-sm hover:text-primary transition">
              Pricing
            </a>
            <a href="#resources" className="text-sm hover:text-primary transition">
              Resources
            </a>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 sm:pt-40 pb-20 px-5 sm:px-8 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col gap-12 items-center">
            {/* Text content */}
            <div className="w-full max-w-3xl">
              {/* Premium badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 mb-8 backdrop-blur-sm animate-shimmer-dance">
                <Sparkles size={16} className="text-primary animate-bounce-dance" />
                <span className="text-sm font-medium text-primary">Trusted by 500+ Freelancers</span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold leading-tight mb-6">
                <span className="text-gradient animate-rotate-bounce stagger-1">Land Your First</span>
                <br />
                <span className="animate-rotate-bounce stagger-2" style={{animationDelay: '0.2s'}}>Client Today</span>
              </h1>

              <p className="text-lg sm:text-xl text-muted-foreground mb-12 leading-relaxed animate-bounce-dance stagger-3">
                Find local businesses without websites, build them a site with AI, and close them as paying clients — all guided step by step.
              </p>

              <div className="flex flex-col sm:flex-row gap-6 mb-12 animate-bounce-dance stagger-4" style={{animationDelay: '0.4s'}}>
                <Link
                  to="/auth"
                  className="group relative px-8 py-5 rounded-xl bg-gradient-primary text-primary-foreground hover:shadow-2xl transition-all duration-300 font-semibold inline-flex items-center justify-center gap-3 text-lg overflow-hidden hover:scale-110 hover:-translate-y-1 active:scale-95"
                >
                  <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative flex items-center gap-3">
                    Start For Free Today 
                    <ArrowRight size={22} className="group-hover:translate-x-2 group-hover:-translate-y-0.5 transition-transform duration-300" />
                  </span>
                </Link>
                <a
                  href="#howitworks"
                  className="group relative px-8 py-5 rounded-xl border-2 border-primary bg-transparent hover:bg-primary/5 dark:hover:bg-primary/10 transition-all duration-300 font-semibold inline-flex items-center justify-center gap-2 text-lg text-primary hover:scale-110 hover:-translate-y-1 active:scale-95 cursor-pointer"
                >
                  <span className="relative">
                    Watch How It Works
                  </span>
                </a>
              </div>
            </div>

            {/* Auto-scrolling carousel - Below text */}
            <div className="w-full max-w-4xl relative">
              <div className="rounded-2xl overflow-hidden border border-primary/20 bg-card/50 p-1 shadow-2xl hover:shadow-3xl transition-shadow duration-500 hover:scale-105">
                <div className="rounded-xl overflow-hidden backdrop-blur-sm">
                  <ImageCarousel />
                </div>
              </div>
              
              {/* Floating elements for premium feel */}
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-primary/10 rounded-full blur-2xl -z-10" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-accent/10 rounded-full blur-2xl -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24 px-5 sm:px-8 border-t border-border/40">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-20">
            <span className="inline-block px-4 py-2 rounded-full border border-destructive/30 bg-destructive/5 text-sm font-medium text-destructive mb-6 backdrop-blur-sm animate-slide-up">
              The Problem
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mb-6 leading-tight animate-slide-up stagger-1">
              <span className="animate-slide-in-left stagger-1">Everyone tells you to make money coding.</span>
              <br />
              <span className="text-muted-foreground animate-slide-in-right stagger-2">Nobody shows you how.</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-slide-up stagger-3">
              You're stuck watching tutorials and losing opportunities. It's time to change that.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                icon: "🔍",
                title: "Lost in the Search",
                desc: "You watch the TikToks and YouTube guides but have no idea where to actually find paying clients",
              },
              {
                icon: "🏗️",
                title: "Building Into a Void",
                desc: "You build amazing sites but don't know what to say to businesses or how they'll react",
              },
              {
                icon: "💬",
                title: "Message Graveyard",
                desc: "You send messages but don't close deals. Your follow-ups go nowhere.",
              },
            ].map((problem, i) => (
              <div
                key={i}
                className={`p-8 rounded-2xl border border-border/40 bg-gradient-to-br from-destructive/5 to-destructive/2 backdrop-blur-sm hover:border-destructive/40 transition-all duration-300 group animate-slide-up hover:scale-105 cursor-pointer stagger-${i + 1}`}
              >
                <div className="text-4xl mb-4 group-hover:scale-125 transition-transform duration-300">{problem.icon}</div>
                <h3 className="text-xl font-semibold mb-3">{problem.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{problem.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="features" className="py-24 px-5 sm:px-8 border-t border-border/40">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-20">
            <span className="inline-block px-4 py-2 rounded-full border border-primary/30 bg-primary/5 text-sm font-medium text-primary mb-6 backdrop-blur-sm animate-slide-up">
              The Solution
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mb-6 animate-slide-up stagger-1">
              LeadGen is the complete system
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-slide-up stagger-2">
              From finding a lead to landing your first paying client — all step by step
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-8">
            {[
              {
                icon: Search,
                title: "Find Leads",
                shortDesc: "Search any location on Google Maps and instantly see businesses with no website. Scored and filtered for you.",
                gradient: "from-blue-500/20 to-blue-600/10",
                expandedText: "With advanced filters we find the businesses you're targeting and the ones with a high success rate. Our algorithm scores each lead based on conversion potential.",
              },
              {
                icon: Zap,
                title: "Get The Prompts",
                shortDesc: "Copy proven prompts for Lovable and LandingSite AI to build professional sites in minutes.",
                gradient: "from-yellow-500/20 to-orange-600/10",
                expandedText: "Our AI generates high-level prompts that make sites from Lovable and LandingSite AI truly beautiful. Every prompt is tested and optimized for maximum impact.",
              },
              {
                icon: MessageSquare,
                title: "Send The Message",
                shortDesc: "Pre-written outreach templates for WhatsApp in English and French. Customized by business type.",
                gradient: "from-green-500/20 to-emerald-600/10",
                expandedText: "We have 100+ highly curated outreach messages tailored to different industries. Each message is proven to get responses and move prospects forward in the sales process.",
              },
              {
                icon: DollarSign,
                title: "Close The Deal",
                shortDesc: "Scripts for objections, follow ups, pricing and upsells. Everything you need to get paid.",
                gradient: "from-purple-500/20 to-pink-600/10",
                expandedText: "Complete scripts and strategies to handle objections, negotiate pricing, and close deals confidently. Master the psychology of selling and turn prospects into paying clients.",
              },
            ].map((feature, i) => {
              const Icon = feature.icon;
              const isExpanded = expandedFeature === i;
              return (
                <div
                  key={i}
                  className={`group rounded-2xl border border-border/40 bg-gradient-to-br ${feature.gradient} backdrop-blur-sm hover:border-primary/50 transition-all duration-300 cursor-pointer overflow-hidden animate-slide-up hover:scale-105 stagger-${i + 1}`}
                >
                  <div className="p-8">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center text-white shadow-lg">
                        <Icon size={28} />
                      </div>
                      <button
                        onClick={() => setExpandedFeature(isExpanded ? null : i)}
                        className="w-10 h-10 rounded-lg bg-primary/20 hover:bg-primary/30 flex items-center justify-center transition-all duration-300 transform group-hover:scale-110"
                      >
                        <ChevronRight
                          size={20}
                          className={`text-primary transition-transform duration-300 ${
                            isExpanded ? "rotate-90" : ""
                          }`}
                        />
                      </button>
                    </div>

                    <h3 className="text-2xl font-semibold mb-3 group-hover:text-primary transition">
                      {feature.title}
                    </h3>

                    <p className="text-muted-foreground leading-relaxed">
                      {feature.shortDesc}
                    </p>

                    {isExpanded && (
                      <div className="mt-6 pt-6 border-t border-border/40">
                        <p className="text-foreground leading-relaxed font-medium">
                          {feature.expandedText}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="howitworks" className="py-24 px-5 sm:px-8 border-t border-border/40">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-20">
            <span className="inline-block px-4 py-2 rounded-full border border-accent/30 bg-accent/5 text-sm font-medium text-accent mb-6 backdrop-blur-sm animate-slide-up">
              Step by Step
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mb-6 animate-slide-up stagger-1">
              From zero to paid client in 4 steps
            </h2>
            <p className="text-lg text-muted-foreground animate-slide-up stagger-2">
              We guide you through every step of the process
            </p>
          </div>

          <div className="relative">
            <div className="grid sm:grid-cols-4 gap-8">
              {[
                {
                  num: 1,
                  icon: "🔍",
                  title: "Search any city",
                  desc: "Find businesses without websites on Google Maps",
                },
                {
                  num: 2,
                  icon: "⚡",
                  title: "Build their site",
                  desc: "Using our proven AI prompts and templates",
                },
                {
                  num: 3,
                  icon: "💬",
                  title: "Send our message",
                  desc: "Proven WhatsApp outreach in multiple languages",
                },
                {
                  num: 4,
                  icon: "🎉",
                  title: "Get paid",
                  desc: "Close the deal with our scripts and guides",
                },
              ].map((step, i) => (
                <div key={i} className={`relative animate-slide-up stagger-${i + 1}`}>
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center text-white text-3xl font-bold mb-6 shadow-glow hover:shadow-elevated transition hover:scale-125 group-hover:animate-pulse-scale">
                      {step.num}
                    </div>
                    <div className="text-4xl mb-4 hover:scale-125 transition-transform hover:animate-bounce-in">{step.icon}</div>
                    <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                  {i < 3 && (
                    <div className="hidden sm:block absolute top-9 -right-4 w-8">
                      <svg
                        className="w-full text-primary/30 animate-pulse"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Connecting line */}
            <div className="hidden sm:block absolute top-9 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-transparent -z-10 animate-pulse" />
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section className="py-20 px-5 sm:px-8 border-t border-border/40">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mb-6">
              Integrated with the best tools
            </h2>
            <p className="text-lg text-muted-foreground">
              We recommend and guide you through every tool you need
            </p>
          </div>

          {/* Horizontal scrolling tools */}
          <div className="relative overflow-hidden">
            <div className="flex gap-6 animate-marquee">
              {[
                "Lovable",
                "LandingSite AI",
                "Cloudflare",
                "Firebase",
                "Google Maps",
                "Lovable",
                "LandingSite AI",
                "Cloudflare",
                "Firebase",
                "Google Maps",
              ].map((tool, i) => (
                <div
                  key={i}
                  className="px-8 py-4 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-accent/5 backdrop-blur-sm flex-shrink-0 whitespace-nowrap text-lg font-semibold text-primary hover:border-primary/60 hover:shadow-glow transition"
                >
                  {tool}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-5 sm:px-8 border-t border-border/40 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-24">
            <span className="inline-block px-4 py-2 rounded-full border border-primary/30 bg-primary/5 text-sm font-medium text-primary mb-6 backdrop-blur-sm animate-slide-up">
              Flexible Pricing
            </span>
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold mb-6 animate-slide-up stagger-1">
              Simple pricing.
              <br />
              <span className="text-muted-foreground">No surprises.</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-slide-up stagger-2">
              Start free and upgrade when you're ready. All plans include 30-day free trial.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 lg:gap-6">
            {[
              {
                name: "Free",
                price: "0",
                period: "Forever",
                desc: "Perfect for getting started",
                icon: "🚀",
                features: [
                  "5 searches per month",
                  "3 prompt templates",
                  "Basic CRM",
                  "Community support",
                ],
                highlighted: false,
                cta: "Get Started Free",
              },
              {
                name: "Starter",
                price: "10",
                period: "/month",
                desc: "For growing freelancers",
                icon: "⚡",
                features: [
                  "50 searches per month",
                  "Full prompt library",
                  "Advanced CRM",
                  "25 outreach templates",
                  "Email support",
                ],
                highlighted: true,
                cta: "Start Free Trial",
                badge: "Most Popular",
              },
              {
                name: "Pro",
                price: "29",
                period: "/month",
                desc: "For agencies & power users",
                icon: "👑",
                features: [
                  "Unlimited searches",
                  "All prompt templates",
                  "Complete CRM pipeline",
                  "100+ outreach templates",
                  "Priority support",
                  "Advanced analytics",
                ],
                highlighted: false,
                cta: "Start Free Trial",
              },
            ].map((plan, i) => (
              <div
                key={i}
                className={`group relative rounded-2xl backdrop-blur-sm transition-all duration-300 animate-slide-up hover:scale-105 stagger-${i + 1} ${
                  plan.highlighted
                    ? "lg:scale-105 border-2 border-primary bg-gradient-to-br from-primary/20 to-accent/10 shadow-2xl"
                    : "border border-border/40 bg-card/30 hover:border-primary/50 hover:shadow-lg"
                }`}
              >
                {/* Badge for popular plan */}
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <span className="px-4 py-1 rounded-full bg-gradient-primary text-white text-xs font-bold shadow-lg">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="p-8">
                  {/* Icon and name */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-4xl group-hover:scale-125 transition-transform duration-300 group-hover:animate-bounce-in">{plan.icon}</span>
                    <h3 className="text-3xl font-bold">{plan.name}</h3>
                  </div>

                  <p className="text-muted-foreground mb-6 text-sm">{plan.desc}</p>

                  {/* Price */}
                  <div className="mb-8">
                    <div className="flex items-baseline gap-1">
                      <span className="text-6xl font-bold text-gradient group-hover:animate-pulse-scale">${plan.price}</span>
                      {plan.period && (
                        <span className="text-muted-foreground text-lg">{plan.period}</span>
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-4 mb-10">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          <CheckCircle2 size={18} className="text-primary" />
                        </div>
                        <span className="text-sm leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Link
                    to="/auth"
                    className={`w-full py-4 px-6 rounded-xl font-semibold text-center transition-all duration-300 block ${
                      plan.highlighted
                        ? "bg-gradient-primary text-white hover:shadow-2xl hover:shadow-primary/50 group-hover:scale-105"
                        : "border-2 border-border text-foreground hover:border-primary hover:bg-primary/5"
                    }`}
                  >
                    {plan.cta}
                  </Link>

                  {/* Fine print */}
                  <p className="text-xs text-muted-foreground text-center mt-6">
                    {plan.period === "Forever" ? "No credit card required" : "Cancel anytime"}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* FAQ/CTA below pricing */}
          <div className="mt-20 text-center">
            <p className="text-muted-foreground mb-6">
              Have questions? <button onClick={() => setContactFormOpen(true)} className="text-primary hover:text-primary/80 font-semibold transition cursor-pointer">Contact our sales team</button>
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-5 sm:px-8 border-t border-border/40">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-display font-semibold mb-4">
              Real freelancers. Real clients. Real money.
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                name: "Alex Johnson",
                role: "Web Developer",
                quote: "LeadGen changed everything. I landed 5 clients in my first month.",
              },
              {
                name: "Maria García",
                role: "Freelancer",
                quote: "The prompts and scripts are game-changers. No more guessing what to say.",
              },
              {
                name: "Chidi Okafor",
                role: "Designer",
                quote: "This is exactly what I needed. Clear system, real results.",
              },
            ].map((testimonial, i) => (
              <div key={i} className="p-8 rounded-2xl border border-border bg-card/30 backdrop-blur-sm">
                <p className="text-lg mb-6 leading-relaxed italic">"{testimonial.quote}"</p>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-5 sm:px-8 border-t border-border/40">
        <div className="max-w-[1400px] mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-display font-semibold mb-8 animate-slide-up">
            <span className="animate-slide-in-left stagger-1">Your first client is waiting.</span>
            <br />
            <span className="animate-slide-in-right stagger-2">Go find them.</span>
          </h2>

          <Link
            to="/auth"
            className="px-8 py-4 rounded-xl bg-gradient-primary text-primary-foreground hover:shadow-glow transition font-medium inline-flex items-center gap-2 text-lg hover:scale-110 animate-bounce-in stagger-3 cursor-pointer inline-block !text-white dark:!text-primary-foreground"
          >
            Start For Free Today <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
          </Link>

          <p className="text-sm text-muted-foreground mt-6 animate-slide-up stagger-4">No credit card required</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-5 sm:px-8 border-t border-border/40 bg-card/20">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid sm:grid-cols-4 gap-8 mb-8">
            <div className="animate-slide-up stagger-1">
              <div className="flex items-center gap-3 font-display text-lg font-semibold mb-2 group-hover:scale-105 transition-transform">
                <img 
                  src="/images/assets/logo.png" 
                  alt="LeadGen" 
                  className="w-28 h-28 object-contain hover:scale-110 transition-transform"
                />
                <span>LeadGen</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Land Your First Client Today
              </p>
            </div>

            <div className="animate-slide-up stagger-2">
              <h4 className="font-semibold mb-4 text-sm">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#features" className="hover:text-foreground transition hover:translate-x-1 inline-block">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-foreground transition hover:translate-x-1 inline-block">
                    Pricing
                  </a>
                </li>
              </ul>
            </div>

            <div className="animate-slide-up stagger-3">
              <h4 className="font-semibold mb-4 text-sm">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#resources" className="hover:text-foreground transition hover:translate-x-1 inline-block">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#resources" className="hover:text-foreground transition hover:translate-x-1 inline-block">
                    Guides
                  </a>
                </li>
              </ul>
            </div>

            <div className="animate-slide-up stagger-4">
              <h4 className="font-semibold mb-4 text-sm">Account</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="/auth" className="hover:text-foreground transition hover:translate-x-1 inline-block">
                    Login
                  </Link>
                </li>
                <li>
                  <Link to="/auth" className="hover:text-foreground transition">
                    Sign Up
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border/40 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2026 LeadGen. All rights reserved.
            </p>
            <div className="flex gap-6 text-muted-foreground text-sm">
              <a href="#" className="hover:text-foreground transition">
                Twitter
              </a>
              <a href="#" className="hover:text-foreground transition">
                LinkedIn
              </a>
              <a href="#" className="hover:text-foreground transition">
                Discord
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Contact Form Modal */}
      {contactFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold">Contact Sales</h3>
                <button
                  onClick={() => setContactFormOpen(false)}
                  className="text-muted-foreground hover:text-foreground transition"
                >
                  <X size={24} />
                </button>
              </div>

              <p className="text-muted-foreground mb-6">
                Tell us a bit about your needs and we'll get back to you soon.
              </p>

              <div className="space-y-4">
                {/* Email field */}
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                  />
                </div>

                {/* Description field */}
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    placeholder="Tell us about your project..."
                    value={contactForm.description}
                    onChange={(e) => setContactForm({ ...contactForm, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition resize-none"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setContactFormOpen(false)}
                    className="flex-1 px-4 py-3 rounded-lg border border-border hover:border-primary hover:bg-card transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleContactSubmit}
                    disabled={!contactForm.email || !contactForm.description}
                    className="flex-1 px-4 py-3 rounded-lg bg-gradient-primary text-white font-medium hover:shadow-glow transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
