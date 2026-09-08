'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowRight, BarChart3, Check, ChevronDown, CircleUserRound, Database,
  Download, Globe2, Hash, LockKeyhole, Menu, MessageCircle, Mic2,
  Monitor, MoreHorizontal, Plus, Radio, Search, Share2, ShieldCheck,
  SlidersHorizontal, Smartphone, Sparkles, Upload, UsersRound, X, Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const integrations: Array<[string, string, LucideIcon]> = [
  ['CRM', 'Auto-fill your CRM with notes and call logs.', Globe2],
  ['Project Management', 'Create tasks automatically after every meeting.', Check],
  ['ATS', 'Send meeting notes and transcripts to your team.', Database],
  ['Slack', 'Get notes and alerts in the channels where you work.', MessageCircle],
];

const faqs = [
  'What is Firefiles AI Assistant?',
  'How is Firefiles different from a regular AI notetaker?',
  'Can I transcribe meetings in multiple languages?',
  'How secure is my meeting data?',
];

function Button({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return <Link className={`landing-button ${light ? 'landing-button-light' : ''}`} href="/register">{children}<ArrowRight size={16} strokeWidth={2.2} /></Link>;
}

function BrandMark() {
  return <span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span>;
}

function TranscriptMockup() {
  return <div className="transcript-mockup"><div className="mockup-label"><Radio size={14} /> Transcript</div><div className="mockup-search"><Search size={14} /> Search</div>{[
    ['C', 'Cate', '00:53', "There's some concern about onboarding. Clients feel it's not intuitive enough."], ['R', 'Rohan', '01:24', "Noted. We'll pass that to product. On the seating front, how are we doing with capacity?"], ['T', 'Tom', '01:47', ''], ['E', 'Emily', '02:19', ''],
  ].map(([initial, name, time, copy], index) => <div className="transcript-line" key={name}><span className={`speaker speaker-${index}`}>{initial}</span><strong>{name}</strong><ChevronDown className="caret" size={12} /><a>{time}</a>{copy && <p>{copy}</p>}{index === 0 && <span className="bookmark"><BookmarkIcon /></span>}</div>)}</div>;
}

function BookmarkIcon() { return <span aria-hidden="true">▮</span>; }

function AppMockup() {
  return <div className="app-mockup"><div className="app-toolbar"><Menu size={15} /><span><Hash size={12} /> Sales　/　Kickoff Call - Firefiles.ai x Acme</span><b><Mic2 size={10} /> REC</b><span className="toolbar-right"><Radio size={13} /> Soundbite　 <strong><Share2 size={13} /> Share</strong>　<Plus size={15} />　 <CircleUserRound size={16} /></span></div><div className="app-body"><h3>Kickoff Call - Firefiles.ai x Acme</h3><small><CircleUserRound size={13} /> Sarah Watts, +3　 Mar 15 · 11:30 AM</small><div className="app-tabs"><Monitor size={13} /> Default Notes　 <Sparkles size={13} /> <b>Customize</b> <span><Plus size={13} /> AI Apps　<MoreHorizontal size={14} /></span></div><h4>Overview</h4><p>The kickoff call served as an introduction between Fireflies.ai and Acme Inc. They aim to use Fireflies.ai primarily to streamline internal communications, automate sales call follow-ups, and improve meeting workflows.</p></div></div>;
}

function FeatureCard({ title, children, tone = 'lavender' }: { title: string; children: React.ReactNode; tone?: string }) {
  return <div className={`feature-card ${tone}`}><h3>{title}</h3><p>{children}</p><div className="card-visual"><div className="visual-window"><Sparkles size={14} /><span>Meeting summary</span><strong>Key takeaways</strong><div className="visual-summary"><i>Improve onboarding flow</i><i>Automate CRM updates</i><i>Share coaching notes</i></div></div></div></div>;
}

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  return <main className="landing-page">
    <div className="announcement"><b>NEW</b> Meet Email Assistant: Your inbox triaged and replies auto-drafted. <u>See Now</u><button aria-label="Dismiss announcement"><X size={15} /></button></div>
    <header className="landing-header"><Link className="brand" href="/"><BrandMark /> firefiles.ai</Link><nav><a>Product <ChevronDown size={12} /></a><a>Solutions <ChevronDown size={12} /></a><a>Integration <ChevronDown size={12} /></a><a>Resources <ChevronDown size={12} /></a><a>Enterprise</a><a>Pricing</a></nav><div className="header-actions"><Link href="/login">Login</Link><Link className="demo-link" href="/login">Request Demo</Link><Button>Get Started</Button></div><button className="menu-button" aria-label="Open menu"><Menu size={20} /></button></header>
    <section className="hero hero-dark"><div className="hero-copy"><h1>The #1 AI Assistant For<br />Your Meetings</h1><p>Transcribe, summarize, search, and analyze all your team conversations.</p><div><Button>Get Started</Button><Button light>Request Demo</Button></div></div><div className="hero-proof"><span><b>G</b> Rated 4.8 / 5</span><span className="stars-rating">★ ★ ★ ★ <i>★</i></span><span><LockKeyhole size={12} /> GDPR, SOC2, More</span></div><div className="hero-product"><AppMockup /></div><div className="stars" /></section>
    <section className="proof-band"><div className="browser-card"><div className="browser-top">●　●　●　 <span>firefiles.ai</span></div><div className="browser-content"><div className="notes"><h3>Notes</h3><b>■　Use Case &amp; Requirements: 00:00 - 10:12</b><p>•　Acme wants their sales team more present during calls</p><p>•　They want to automate data entry in HubSpot CRM</p><p>•　Team managers want to use Fireflies to provide call coaching</p><b>■　Metrics &amp; Goals: 10:15 - 20:43</b></div><div className="comments"><b>Chris　⌄　<a>01:47</a></b><p>I&apos;ll prepare a follow-up and reach out after the meeting.</p><b>Sarah　⌄　<a>02:19</a></b></div></div></div><p className="eyebrow">USED ACROSS 1 MILLION+ COMPANIES</p><div className="logos"><b>Λ AssemblyAI</b><b>EMAAR</b><b>◉ Leonardo.Ai</b><b>▣ Penn</b></div></section>
    <section className="split-section"><div className="section-copy"><h2>High Quality Meeting<br /><em>Transcription &amp; Recording</em></h2><Button>Get Started</Button><div className="stats-grid"><div><b><BarChart3 /><br />95% Accurate</b><p>Fireflies is the industry leader in transcription accuracy.</p></div><div><b><Globe2 /><br />100+ Languages</b><p>Transcribe meetings in English, Spanish, French, &amp; several others.</p></div><div><b><UsersRound /><br />Speaker Recognition</b><p>Fireflies identifies different speakers in meetings and audio files.</p></div><div><b><Zap /><br />Auto-Language Detection</b><p>Automatically switch languages from meeting to meeting with ease.</p></div></div></div><TranscriptMockup /></section>
    <section className="dark-showcase"><div className="center-copy"><h2>Comprehensive <em>AI Summaries</em></h2><p>Get detailed notes, action items, and customized summaries instantly<br />after every meeting.</p><Button>Get Started</Button><div className="pills"><b>Overview</b><b>Bullet Points</b><b>Action Items</b><b>Custom Notes</b></div></div><AppMockup /></section>
    <section className="capture-section"><h2><em>Capture</em> Meetings <em>Anywhere</em> &amp; Anytime</h2><div className="capture-grid"><FeatureCard title="AI Note Taker Bot"><b>Invite fred@fireflies.ai</b> to a live meeting or have it autojoin your calendar meetings to record, transcribe, and summarize.</FeatureCard><FeatureCard title="Chrome Extension">Automatically record your Google Meet calls and get <u>real-time transcripts.</u></FeatureCard></div><div className="mini-features"><div><b><Smartphone /><br />Mobile App</b><p>Transcribe and summarize in-person conversation with the mobile app.</p></div><div><b><Monitor /><br />Desktop App</b><p>Transcribe and summarize your calls with the desktop app.</p></div><div><b><Upload /><br />Dialers &amp; API</b><p>Transcribe calls from Aircall, Ringcentral and other dialers.</p></div></div></section>
    <section className="search-section"><h2><em>Remember</em> Every Conversation<br />With <em>AI Powered Search</em></h2><p>Fireflies gives you perfect memory after every conversation.</p><div className="search-cards"><FeatureCard title="Meeting Search" tone="pink">Remember what was discussed on calls several months ago down to the specific sentence and timestamp.</FeatureCard><FeatureCard title="AskFred" tone="mint">Let Fred review your meetings and come back with answers to any question you have.</FeatureCard></div></section>
    <section className="live-section"><div className="live-card"><div className="app-icons"><Sparkles size={16} /><Mic2 size={16} /><MessageCircle size={16} /><Zap size={16} /></div><h2>Get Real-Time Suggestions, Coaching,<br />And Answers During Meetings.</h2><p>Meet the new Live Assist that can provide real-time<br />suggestions, coaching, and answers during your meetings.</p><Button>Explore Live Assist</Button></div></section>
    <section className="split-section analytics"><div className="section-copy"><h2>Drive Insights With<br /><em>Conversation Intelligence</em></h2><p>Detailed analytics to help you uncover insights across every conversation.</p>{[['Speaker Talk-time', BarChart3], ['AI Filters', SlidersHorizontal], ['Sentiment Analysis', Radio], ['Topic Trackers', Hash]].map(([label, Icon], i) => <div className={`accordion ${i === 3 ? 'active' : ''}`} key={label as string}><b><Icon size={15} />{label as string}</b><ChevronDown size={14} />{i === 3 && <p>Automatically identify key topics and track relevant keywords discussed in your meetings.</p>}</div>)}</div><TranscriptMockup /></section>
    <section className="integrations"><h2>Integrate <em>Fireflies</em> With Your Favorite<br /><em>Work Tools</em></h2><p>Integrate Fireflies with your favorite Work Tools</p><div className="integration-grid">{integrations.map(([title, copy, Icon]) => <div key={String(title)}><Icon size={24} /><h3>{title}</h3><p>{copy}</p></div>)}</div><div className="integration-visual"><AppMockup /></div></section>
    <section className="security"><div><h2>Enterprise-Grade <em>Security</em> <LockKeyhole size={22} /></h2><p>Fireflies is the preferred platform for CIOs across the Fortune 500, offering robust admin controls and stringent security protocols.</p></div><Button>Get Started</Button><div className="security-grid">{['SOC 2 Type II', 'GDPR', 'HIPAA Compliant', 'Zero Data Retention', 'Private Storage', 'Customer Own Their Data'].map((item, i) => <div key={item}><span className={`security-icon s${i}`}>{i < 3 ? <ShieldCheck size={18} /> : i === 3 ? <LockKeyhole size={18} /> : <Database size={18} />}</span><h3>{item}</h3><p>Rigorous data protection and privacy standards for your organization’s data.</p></div>)}</div></section>
    <section className="capabilities"><p>...and many more capabilities</p><div className="capability-grid">{[['Expand Summary Notes', SlidersHorizontal], ['Download Meetings', Download], ['Soundbites', Radio], ['Channels', Hash], ['User Groups', UsersRound], ['Comments & Bookmarks', MessageCircle]].map(([item, Icon]) => <div key={item as string}><Icon size={18} /><h3>{item as string}</h3><p>Expand specific meeting details and keep your team moving forward.</p></div>)}</div></section>
    <section className="faq"><h2>Frequently Asked Questions</h2>{faqs.map((faq, i) => <button key={faq} onClick={() => setOpenFaq(openFaq === i ? null : i)}><b>{faq}</b><span>{openFaq === i ? '−' : '+'}</span>{openFaq === i && <p>Firefiles helps teams record, transcribe, search, and understand every conversation in one place.</p>}</button>)}</section>
    <footer><div className="footer-hero"><h2>Unlock The Knowledge Buried<br />Inside Your Conversations</h2><Button>Try Fireflies For Free</Button></div><div className="footer-links"><div><b>Product</b><p>Features<br />Notetaker<br />AI Assistant<br />Daily Brief<br />Email Assistant</p></div><div><b>Use Cases</b><p>Sales<br />Recruiting<br />Marketing<br />Collaboration<br />Engineering</p></div><div><b>Integrations</b><p>All integrations<br />Video conferencing<br />Audio recording<br />CRM<br />Dialers</p></div><div><b>Company</b><p>About<br />Careers<br />Partnership<br />HIPAA<br />Privacy Policy</p></div></div></footer>
    <button className="chat-button" aria-label="Open chat"><MessageCircle size={22} strokeWidth={2.2} /></button>
  </main>;
}