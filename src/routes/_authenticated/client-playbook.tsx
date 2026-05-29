import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  CheckCircle2,
  MapPin,
  Code,
  MessageCircle,
  DollarSign,
  CreditCard,
  ExternalLink,
  Calculator,
  FileText,
  Check,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/_authenticated/client-playbook")({
  component: ClientPlaybookPage,
  head: () => ({
    meta: [
      { title: "Client Playbook — LeadGen" },
      { name: "description", content: "Complete guide to landing your first client." },
    ],
  }),
});

type CompletedSteps = {
  findLead: boolean;
  buildSite: boolean;
  sendOutreach: boolean;
  closeDeal: boolean;
  getPaid: boolean;
};

const BUSINESS_PROMPTS = [
  {
    type: "Restaurant",
    prompt:
      "Create a professional restaurant website with menu display, reservation system, and location. Include high-quality food imagery placeholder and contact information.",
  },
  {
    type: "Hotel",
    prompt:
      "Design a luxury hotel website with room gallery, booking system, amenities showcase, and customer reviews section.",
  },
  {
    type: "Cleaning Business",
    prompt:
      "Build a cleaning service website with service packages, pricing table, before/after gallery, and booking form.",
  },
  {
    type: "Electronics Store",
    prompt:
      "Create an electronics store website with product catalog, search functionality, shopping cart, and customer testimonials.",
  },
  {
    type: "Logistics Company",
    prompt:
      "Design a logistics company website with real-time tracking, service areas map, fleet showcase, and quote request form.",
  },
  {
    type: "Salon",
    prompt:
      "Build a salon website with service menu, stylist profiles, booking calendar, and portfolio gallery.",
  },
  {
    type: "Construction",
    prompt:
      "Create a construction company website with project portfolio, team profiles, services offered, and project inquiry form.",
  },
  {
    type: "General Business",
    prompt:
      "Design a professional business website with services overview, team section, testimonials, and contact form.",
  },
];

const OUTREACH_TEMPLATES = [
  {
    title: "I built you a demo site",
    en: "Hi [Name], I noticed you don't have a web presence. I build professional websites for businesses like yours. I've created a quick demo at [DEMO_URL]. Would you be open to a quick call to see if it's a fit? Best, [Your name]",
    fr: "Salut [Name], j'ai remarqué que vous n'aviez pas de présence web. Je crée des sites web professionnels pour des entreprises comme la vôtre. J'ai créé une démo rapide à [DEMO_URL]. Seriez-vous disponible pour un appel? Cordialement, [Votre nom]",
  },
  {
    title: "I noticed you don't have a website",
    en: "Hi [Name], I work with local businesses to build beautiful websites that actually convert. Most businesses in [LOCATION] are losing clients because they don't have a strong online presence. I'd love to show you what's possible. Free consultation? [Your name]",
    fr: "Salut [Name], je travaille avec des entreprises locales pour créer des sites web magnifiques. La plupart des entreprises à [LOCATION] perdent des clients sans présence en ligne. Puis-je vous montrer ce qui est possible? [Votre nom]",
  },
  {
    title: "No info found — are you interested",
    en: "Hi [Name], I'm reaching out because I couldn't find much information about [BUSINESS_NAME] online. I specialize in helping businesses like yours get online with a professional website. Would a quick conversation be helpful? Cheers, [Your name]",
    fr: "Salut [Name], je vous contacte parce que je n'ai pas trouvé beaucoup d'informations sur [BUSINESS_NAME] en ligne. Puis-je vous aider? [Votre nom]",
  },
  {
    title: "Follow up — you haven't replied",
    en: "Hi [Name], just wanted to check in - did you get my last message about a website for [BUSINESS_NAME]? I have limited spots available this month. Let me know! [Your name]",
    fr: "Salut [Name], je voulais vérifier - avez-vous reçu mon message? J'ai quelques places disponibles ce mois-ci. [Votre nom]",
  },
  {
    title: "Sample is ready",
    en: "Hi [Name], I've finished the website sample we discussed. Check it out at [SAMPLE_URL] - it's live and you can see exactly what you'd get. Let me know what you think! [Your name]",
    fr: "Salut [Name], j'ai terminé l'exemple de site web. Regardez à [SAMPLE_URL]. Dites-moi ce que vous en pensez! [Votre nom]",
  },
];

const OBJECTION_HANDLERS = [
  {
    objection: "How much does it cost?",
    script:
      "Great question! Most websites I build are between [PRICE_LOW] and [PRICE_HIGH] depending on features. The good news is this typically pays for itself within the first few months from the extra clients you'll get online. I can create a custom quote based on exactly what you need.",
  },
  {
    objection: "I'll think about it",
    script:
      "I totally understand - it's an important decision. Most business owners find it helpful to see a working example first. How about this: let me put together a quick demo for [BUSINESS_NAME] - no pressure, just so you can see the actual product. Then we can chat about next steps. Sound good?",
  },
  {
    objection: "That's too expensive",
    script:
      "I hear you - price matters. Let me ask: how many potential customers are you losing right now because you don't have an online presence? Most of my clients make back their investment within the first month or two from new leads. Would it help if we started with just the essentials and scaled up later?",
  },
  {
    objection: "I already have someone",
    script:
      "No problem! Can I ask - are you happy with what they're delivering? If not, I'd love to show you what we could do differently. If you are happy, great! But if you ever want a second opinion or they don't deliver, I'm here. Deal?",
  },
  {
    objection: "Can you send more details?",
    script:
      "Absolutely! I'll send you some samples of my work and a quick pricing sheet. But honestly, the best way to understand is to see a live example. Can we schedule a 15-minute call this week where I can walk you through what I'd build for [BUSINESS_NAME]? That way you can ask any questions.",
  },
];

function ClientPlaybookPage() {
  const [completedSteps, setCompletedSteps] = useState<CompletedSteps>({
    findLead: false,
    buildSite: false,
    sendOutreach: false,
    closeDeal: false,
    getPaid: false,
  });

  const [copiedIdx, setCopiedIdx] = useState<string | null>(null);
  const [pricingInput, setPricingInput] = useState("500");
  const [pricingCurrency, setPricingCurrency] = useState<"FCFA" | "NGN">("FCFA");

  const completedCount = Object.values(completedSteps).filter(Boolean).length;
  const totalSteps = 5;

  const handleCopy = (text: string, idx: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const convertCurrency = (amount: number, from: string): string => {
    const conversions: Record<string, number> = {
      FCFA: 0.00167,
      NGN: 0.00063,
    };
    const usd = amount * (conversions[from] || 1);
    return `$${usd.toFixed(2)}`;
  };

  return (
    <div className="px-5 sm:px-8 lg:px-12 py-8 lg:py-12 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl sm:text-5xl font-display font-semibold mb-3">Land Your First Client</h1>
        <p className="text-lg text-muted-foreground mb-6">
          Follow this system step by step. Every tool, prompt and script you need is right here.
        </p>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Progress</span>
            <span className="text-muted-foreground">
              {completedCount} of {totalSteps} steps complete
            </span>
          </div>
          <div className="h-2 bg-card rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-primary transition-all duration-500"
              style={{ width: `${(completedCount / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {/* Step 1: Find Your Lead */}
        <StepCard
          stepNum={1}
          title="Find Your Lead"
          completed={completedSteps.findLead}
          onToggle={() => setCompletedSteps({ ...completedSteps, findLead: !completedSteps.findLead })}
        >
          <p className="text-muted-foreground mb-4">
            Use the Lead Finder to search any city and find businesses without websites.
          </p>

          <Link
            to="/search"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-primary text-primary-foreground hover:shadow-glow transition font-medium mb-6"
          >
            Go to Lead Finder <ExternalLink size={16} />
          </Link>

          <div className="bg-card/50 rounded-lg p-4 border border-border/50 mt-4">
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Zap size={16} className="text-primary" />
              Pro Tips
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Start with small towns in the UK, Nigeria or Cameroon</li>
              <li>• Trades businesses like plumbers and electricians respond best</li>
              <li>• Filter by businesses with phone numbers for higher conversion</li>
            </ul>
          </div>
        </StepCard>

        {/* Step 2: Build Their Website */}
        <StepCard
          stepNum={2}
          title="Build Their Website"
          completed={completedSteps.buildSite}
          onToggle={() => setCompletedSteps({ ...completedSteps, buildSite: !completedSteps.buildSite })}
        >
          <p className="text-muted-foreground mb-6">
            Use these proven prompts to build a professional website for your lead in under 30 minutes.
          </p>

          {/* Prompt Library */}
          <div className="mb-8">
            <h4 className="font-semibold mb-4">Prompt Library</h4>
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              {BUSINESS_PROMPTS.map((p, i) => (
                <div
                  key={i}
                  className="p-4 rounded-lg border border-border bg-card/30 hover:border-primary/50 hover:bg-card/50 transition"
                >
                  <h5 className="font-semibold text-sm mb-2">{p.type}</h5>
                  <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{p.prompt}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopy(p.prompt, `prompt-${i}`)}
                      className="flex-1 px-3 py-2 rounded-lg border border-border hover:border-primary hover:bg-card transition text-xs font-medium flex items-center justify-center gap-1"
                    >
                      {copiedIdx === `prompt-${i}` ? (
                        <>
                          <Check size={14} /> Copied
                        </>
                      ) : (
                        <>
                          <Copy size={14} /> Copy
                        </>
                      )}
                    </button>
                    <a
                      href="https://lovable.dev"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-3 py-2 rounded-lg bg-primary/20 hover:bg-primary/30 transition text-xs font-medium flex items-center justify-center gap-1"
                    >
                      <ExternalLink size={14} /> Lovable
                    </a>
                    <a
                      href="https://landingsite.ai"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-3 py-2 rounded-lg bg-accent/20 hover:bg-accent/30 transition text-xs font-medium flex items-center justify-center gap-1"
                    >
                      <ExternalLink size={14} /> Landing
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Deployment Guide */}
          <div>
            <h4 className="font-semibold mb-4">Deployment Guide</h4>
            <Accordion type="single" collapsible>
              <AccordionItem value="github">
                <AccordionTrigger>How to export code to GitHub</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 text-sm">
                    <p>
                      <strong>Step 1:</strong> In Lovable or LandingSite, click "Export" → "GitHub"
                    </p>
                    <p>
                      <strong>Step 2:</strong> Authorize the app and select your GitHub account
                    </p>
                    <p>
                      <strong>Step 3:</strong> Name your repository (e.g., "business-name-website")
                    </p>
                    <p>
                      <strong>Step 4:</strong> Click "Export" and wait for the repository to be created
                    </p>
                    <p className="text-muted-foreground">
                      Tip: Your code is now on GitHub ready for deployment!
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="cloudflare">
                <AccordionTrigger>How to deploy to Cloudflare Workers</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 text-sm">
                    <p>
                      <strong>Step 1:</strong> Go to cloudflare.com and sign up for a free account
                    </p>
                    <p>
                      <strong>Step 2:</strong> Click "Pages" → "Create a project"
                    </p>
                    <p>
                      <strong>Step 3:</strong> Connect your GitHub account and select the repository
                    </p>
                    <p>
                      <strong>Step 4:</strong> Cloudflare will automatically build and deploy your site
                    </p>
                    <p className="text-muted-foreground">
                      You'll get a free .pages.dev domain instantly!
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="spaceship">
                <AccordionTrigger>How to connect a domain on Spaceship</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 text-sm">
                    <p>
                      <strong>Step 1:</strong> Buy a domain on spaceship.com (usually $5-10/year)
                    </p>
                    <p>
                      <strong>Step 2:</strong> In Spaceship, go to Domains → Your domain → DNS Settings
                    </p>
                    <p>
                      <strong>Step 3:</strong> Copy the nameservers from Cloudflare Pages
                    </p>
                    <p>
                      <strong>Step 4:</strong> Paste them into Spaceship DNS settings and save
                    </p>
                    <p className="text-muted-foreground">
                      Wait 24 hours for DNS to propagate. Your custom domain is live!
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </StepCard>

        {/* Step 3: Send The Outreach */}
        <StepCard
          stepNum={3}
          title="Send The Outreach"
          completed={completedSteps.sendOutreach}
          onToggle={() =>
            setCompletedSteps({ ...completedSteps, sendOutreach: !completedSteps.sendOutreach })
          }
        >
          <p className="text-muted-foreground mb-6">
            Copy one of these proven WhatsApp messages and send it to your lead.
          </p>

          <div className="space-y-4 mb-6">
            {OUTREACH_TEMPLATES.map((template, i) => (
              <div
                key={i}
                className="p-4 rounded-lg border border-border bg-card/30 hover:border-primary/50 transition"
              >
                <h4 className="font-semibold text-sm mb-3">{template.title}</h4>

                <div className="space-y-3">
                  {/* English */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">English</label>
                    <div className="p-3 rounded-lg bg-card/50 border border-border/50 text-sm mb-2 leading-relaxed">
                      {template.en}
                    </div>
                    <button
                      onClick={() => handleCopy(template.en, `en-${i}`)}
                      className="px-3 py-2 rounded-lg border border-border hover:border-primary hover:bg-card transition text-xs font-medium flex items-center gap-1"
                    >
                      {copiedIdx === `en-${i}` ? (
                        <>
                          <Check size={14} /> Copied
                        </>
                      ) : (
                        <>
                          <Copy size={14} /> Copy
                        </>
                      )}
                    </button>
                  </div>

                  {/* French */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Français</label>
                    <div className="p-3 rounded-lg bg-card/50 border border-border/50 text-sm mb-2 leading-relaxed">
                      {template.fr}
                    </div>
                    <button
                      onClick={() => handleCopy(template.fr, `fr-${i}`)}
                      className="px-3 py-2 rounded-lg border border-border hover:border-primary hover:bg-card transition text-xs font-medium flex items-center gap-1"
                    >
                      {copiedIdx === `fr-${i}` ? (
                        <>
                          <Check size={14} /> Copied
                        </>
                      ) : (
                        <>
                          <Copy size={14} /> Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-card/50 rounded-lg p-4 border border-border/50">
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Zap size={16} className="text-primary" />
              Send Timing Tips
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Send between 9am and 6pm local time</li>
              <li>• Never send more than 20 messages per hour</li>
              <li>• Personalize with business name and owner first name</li>
            </ul>
          </div>
        </StepCard>

        {/* Step 4: Close The Deal */}
        <StepCard
          stepNum={4}
          title="Close The Deal"
          completed={completedSteps.closeDeal}
          onToggle={() => setCompletedSteps({ ...completedSteps, closeDeal: !completedSteps.closeDeal })}
        >
          <p className="text-muted-foreground mb-6">
            When they reply — use these scripts to answer every question and objection confidently.
          </p>

          {/* Objection Handlers */}
          <div className="mb-8">
            <h4 className="font-semibold mb-4">Objection Handlers</h4>
            <div className="space-y-3">
              {OBJECTION_HANDLERS.map((handler, i) => (
                <div key={i} className="p-4 rounded-lg border border-border bg-card/30">
                  <h5 className="font-semibold text-sm mb-3">"{handler.objection}"</h5>
                  <div className="p-3 rounded-lg bg-card/50 border border-border/50 text-sm mb-3 leading-relaxed">
                    {handler.script}
                  </div>
                  <button
                    onClick={() => handleCopy(handler.script, `objection-${i}`)}
                    className="px-3 py-2 rounded-lg border border-border hover:border-primary hover:bg-card transition text-xs font-medium flex items-center gap-1"
                  >
                    {copiedIdx === `objection-${i}` ? (
                      <>
                        <Check size={14} /> Copied
                      </>
                    ) : (
                      <>
                        <Copy size={14} /> Copy
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Calculator */}
          <div className="bg-card/30 border border-border rounded-lg p-6 mb-6">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Calculator size={18} />
              Pricing Calculator
            </h4>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label className="text-sm mb-2 block">Price Amount</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={pricingInput}
                    onChange={(e) => setPricingInput(e.target.value)}
                    className="flex-1"
                  />
                  <select
                    value={pricingCurrency}
                    onChange={(e) => setPricingCurrency(e.target.value as "FCFA" | "NGN")}
                    className="px-3 py-2 rounded-lg border border-border bg-card"
                  >
                    <option value="FCFA">FCFA</option>
                    <option value="NGN">NGN</option>
                  </select>
                </div>
              </div>
              <div className="flex-1">
                <Label className="text-sm mb-2 block">USD Equivalent</Label>
                <div className="px-4 py-2 rounded-lg border border-border bg-card font-semibold">
                  {convertCurrency(parseFloat(pricingInput) || 0, pricingCurrency)}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg border border-border bg-card/30">
            <h5 className="font-semibold text-sm mb-2">Upsell Script</h5>
            <p className="text-sm text-muted-foreground mb-3">
              "By the way, I also offer ongoing hosting and maintenance — many clients have me handle their
              updates and backups so they never have to worry. That's usually $50-100/month. Would that interest
              you?"
            </p>
            <button
              onClick={() =>
                handleCopy(
                  "By the way, I also offer ongoing hosting and maintenance — many clients have me handle their updates and backups so they never have to worry. That's usually $50-100/month. Would that interest you?",
                  "upsell"
                )
              }
              className="px-3 py-2 rounded-lg border border-border hover:border-primary hover:bg-card transition text-xs font-medium flex items-center gap-1"
            >
              {copiedIdx === "upsell" ? (
                <>
                  <Check size={14} /> Copied
                </>
              ) : (
                <>
                  <Copy size={14} /> Copy
                </>
              )}
            </button>
          </div>
        </StepCard>

        {/* Step 5: Get Paid and Deliver */}
        <StepCard
          stepNum={5}
          title="Get Paid and Deliver"
          completed={completedSteps.getPaid}
          onToggle={() => setCompletedSteps({ ...completedSteps, getPaid: !completedSteps.getPaid })}
        >
          <p className="text-muted-foreground mb-6">
            Collect payment, deliver the site and keep the client long term.
          </p>

          {/* Payment Collection Guide */}
          <div className="mb-8">
            <h4 className="font-semibold mb-4">Payment Collection Methods</h4>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { method: "Bank Transfer", emoji: "🏦", tips: "Direct to your account - most reliable" },
                { method: "Paystack", emoji: "💳", tips: "Popular in West Africa, 1.5% fee" },
                {
                  method: "Flutterwave",
                  emoji: "🌍",
                  tips: "Works across Africa, flexible rates",
                },
              ].map((payment, i) => (
                <div key={i} className="p-4 rounded-lg border border-border bg-card/30">
                  <div className="text-3xl mb-2">{payment.emoji}</div>
                  <h5 className="font-semibold text-sm mb-2">{payment.method}</h5>
                  <p className="text-xs text-muted-foreground">{payment.tips}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Checklist */}
          <div className="mb-8">
            <h4 className="font-semibold mb-4">Site Delivery Checklist</h4>
            <div className="space-y-3 p-4 rounded-lg border border-border bg-card/30">
              {[
                "Domain connected and live",
                "SSL certificate active",
                "Google Search Console submitted",
                "Google Business Profile created",
                "Client walkthrough completed",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Checkbox id={`delivery-${i}`} />
                  <label htmlFor={`delivery-${i}`} className="text-sm cursor-pointer">
                    {item}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Retention Messages */}
          <div>
            <h4 className="font-semibold mb-4">Retention Message Templates</h4>
            <div className="space-y-3">
              {[
                {
                  title: "Monthly Check-in",
                  message:
                    "Hi [Name], just checking in! How's the website performing? Getting good inquiries? Let me know if you need any tweaks or if you'd like to chat about adding features.",
                },
                {
                  title: "Upsell Follow-up",
                  message:
                    "[Name], quick thought - with hosting/maintenance from me, you'd never have to worry about updates or security. Interested in discussing that?",
                },
                {
                  title: "Referral Ask",
                  message:
                    "Hi [Name]! I'm so glad the website is working well for you. If you know other business owners who need a site, I'd love a referral. Commission available!",
                },
              ].map((retention, i) => (
                <div key={i} className="p-4 rounded-lg border border-border bg-card/30">
                  <h5 className="font-semibold text-sm mb-2">{retention.title}</h5>
                  <div className="p-3 rounded-lg bg-card/50 border border-border/50 text-sm mb-2 leading-relaxed">
                    {retention.message}
                  </div>
                  <button
                    onClick={() => handleCopy(retention.message, `retention-${i}`)}
                    className="px-3 py-2 rounded-lg border border-border hover:border-primary hover:bg-card transition text-xs font-medium flex items-center gap-1"
                  >
                    {copiedIdx === `retention-${i}` ? (
                      <>
                        <Check size={14} /> Copied
                      </>
                    ) : (
                      <>
                        <Copy size={14} /> Copy
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </StepCard>
      </div>
    </div>
  );
}

interface StepCardProps {
  stepNum: number;
  title: string;
  completed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function StepCard({ stepNum, title, completed, onToggle, children }: StepCardProps) {
  const [isOpen, setIsOpen] = useState(stepNum === 1);

  return (
    <div
      className={`rounded-2xl border transition-all ${
        completed
          ? "border-primary/50 bg-card/20"
          : isOpen
            ? "border-primary/30 bg-card/30"
            : "border-border bg-card/10 hover:bg-card/20"
      }`}
    >
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!completed) onToggle();
        }}
        className="w-full px-6 py-6 flex items-start justify-between gap-4 hover:bg-card/10 transition rounded-t-2xl"
      >
        <div className="flex items-start gap-4 text-left flex-1">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 transition ${
              completed
                ? "bg-gradient-primary text-white"
                : "bg-primary/20 text-primary border border-primary/50"
            }`}
          >
            {completed ? <CheckCircle2 size={24} /> : stepNum}
          </div>

          <div>
            <h3 className="text-xl font-semibold flex items-center gap-3">
              {title}
              {completed && <Badge className="bg-primary/20 text-primary">Completed</Badge>}
            </h3>
          </div>
        </div>

        <div className="text-muted-foreground flex-shrink-0">
          {isOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </div>
      </button>

      {isOpen && (
        <div className="px-6 pb-6 border-t border-border/50 space-y-4">
          {children}

          {!completed && (
            <button
              onClick={onToggle}
              className="w-full px-4 py-3 rounded-lg bg-gradient-primary text-primary-foreground hover:shadow-glow transition font-medium flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={18} />
              Mark as Complete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
