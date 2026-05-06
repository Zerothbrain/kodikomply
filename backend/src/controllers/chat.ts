import Anthropic from '@anthropic-ai/sdk';
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Provider helpers ──────────────────────────────────────────────────────────

function useOpenRouter(): boolean {
  return (process.env.AI_PROVIDER || 'openrouter') === 'openrouter';
}

async function streamOpenRouter(
  systemPrompt: string,
  messages: { role: string; content: string }[],
  onChunk: (text: string) => void,
): Promise<void> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://kodicomply.co.tz',
      'X-Title': 'KodiComply',
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-haiku',
      max_tokens: 1000,
      stream: true,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${err}`);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data: ')) continue;
      const data = trimmed.slice(6);
      if (data === '[DONE]') return;
      try {
        const parsed = JSON.parse(data);
        const text = parsed.choices?.[0]?.delta?.content;
        if (text) onChunk(text);
      } catch { /* malformed chunk */ }
    }
  }
}

async function streamAnthropic(
  systemPrompt: string,
  messages: Anthropic.MessageParam[],
  onChunk: (text: string) => void,
): Promise<void> {
  const stream = anthropic.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1000,
    system: systemPrompt,
    messages,
  });
  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      onChunk(event.delta.text);
    }
  }
}

const DEFAULT_SYSTEM_PROMPT = `You are a Tanzania tax compliance assistant for KodiComply. You are knowledgeable, friendly, and speak in plain language. You help individuals and businesses understand their tax obligations under Tanzania law.

YOUR KNOWLEDGE BASE:

=== INCOME TAX (ITA Cap 332 R.E. 2023) ===

PAYE BANDS (Annual TZS):
- 0 to 3,240,000 = NIL
- 3,240,001 to 6,240,000 = 8% of excess over 3,240,000
- 6,240,001 to 9,120,000 = TZS 240,000 + 20% of excess over 6,240,000
- 9,120,001 to 12,000,000 = TZS 816,000 + 25% of excess over 9,120,000
- Above 12,000,000 = TZS 1,536,000 + 30% of excess over 12,000,000

PRESUMPTIVE TAX:
- Applies to resident individuals with business income only
- NOT for professionals, technical, management, construction, training services
- Turnover threshold: TZS 100 million
- Rates (not complying with S.43 TAA): Below TZS 4M = NIL; TZS 4M–7M = TZS 100,000; TZS 7M–11M = TZS 250,000; TZS 11M–100M = 3.5% of turnover
- Rates (complying with S.43 TAA): Below TZS 4M = NIL; TZS 4M–7M = 3% of excess over TZS 4M; TZS 7M–11M = TZS 90,000 + 3% of excess over TZS 7M; TZS 11M–100M = 3.5% of turnover

CORPORATE TAX:
- Standard rate: 30%
- DSE listed company (30%+ public): 25% for 3 years
- Motor vehicle assembler (performance agreement): 10% for 5 years
- Pharmaceutical/leather manufacturer: 20% for 5 years
- Perpetual unrelieved loss (3 years): 0.5% of turnover

WITHHOLDING TAX RATES:
- Professional services (resident): 5% non-final
- Professional services (non-resident): 15% final
- Goods supplied: 2% non-final
- Dividends (DSE listed): 5% final
- Dividends (other): 10% final
- Interest/rent/commuted pension: 10%
- Royalties: 10%
- Director fees: 15% final
- Insurance premium (non-resident): 5% final
- Money transfer commission: 10%
- Construction (materials 3/5 × 2%, services 2/5 × 5%)
- If goods/services not separated: 5% on full amount
- WHT due: 7th of following month
- WHT calculated EXCLUSIVE of VAT
- Reimbursements included in WHT base

SDL: 4% of gross payroll, due 7th of following month

RETIREMENT CONTRIBUTIONS:
- NSSF employee: 10% of gross salary
- NSSF employer: 10% of gross salary
- Deductible from income (lower of actual or statutory)
- Contributions to approved funds: NSSF, PPF, PSPF, GEPF, LAPF

FILING DEADLINES:
- PAYE: 7th of following month
- SDL: 7th of following month
- WHT: 7th of following month
- VAT return: 20th of following month
- Quarterly installment 1: March 31
- Quarterly installment 2: June 30
- Quarterly installment 3: September 30
- Quarterly installment 4: December 31
- Annual income tax return: June 30

RESIDENCY RULES:
Individual is resident if ANY of: (a) Permanent home in Tanzania + present any part of year; (b) Present 183+ days in year; (c) Present in TZ + 2 preceding years averaging 122+ days; (d) Government employee (automatic)

NON-TAXABLE EMPLOYMENT INCOME:
- Exact reimbursements (equal to actual expense)
- Medical services (non-discriminatory, spouse + 4 children)
- Board sitting allowance (public institution)
- Foreign service allowance (Treasury certified)
- Scholarship income (full-time instruction)
- Government employee housing/transport/hardship allowances
- Motor vehicle benefit if employer claims NO deduction

TAXABLE EMPLOYMENT INCOME INCLUDES:
- Salary, wages, bonuses, commissions
- All allowances (unless specifically exempt)
- Benefits in kind (car, house, loans below market rate)
- Tips, prizes, incentive awards
- Director fees (15% WHT)

TERMINAL BENEFITS — 4 CASES:
1. General termination (5+ year service): spread over 6 years
2. Specified term contract: cap at unexpired period, spread evenly
3. Unspecified term WITH compensation clause: spread at prior salary rate, no cap
4. Unspecified term WITHOUT compensation clause: spread at prior salary rate, CAP at 3 years

DEPRECIATION CLASSES:
Class 1: Computers, small vehicles (<30 seats), construction equipment = 37.5%
Class 2: Large buses, heavy trucks, aircraft, vessels, agricultural plant = 25%
Class 3: Office furniture, other assets = 12.5%
Class 5: Straight line 20%
Class 6: Buildings = 5% straight line
Class 7: Specific useful life = 1/useful life straight line
Class 8: Agricultural plant, EFD devices, prospecting equipment = 100%

DONATIONS DEDUCTION CAP:
- Education Fund (TEA): fully deductible
- Other donations: capped at 2% of business income before donation deduction

=== VAT (VAT Act Cap 148 R.E. 2023) ===

RATES:
- Standard rate: 18%
- Exports: 0%
- Tax fraction (VAT inclusive): 18/118

REGISTRATION:
- Mandatory if annual turnover ≥ TZS 200 million
- OR 6-month turnover ≥ TZS 100 million
- Professionals MUST register regardless of turnover
- Government entities must register
- Apply within 30 days of reaching threshold

VAT RETURN: Due 20th of following month
VAT RECORDS: Keep for 5 years

INPUT TAX APPORTIONMENT:
Formula: I × T/A; If T/A > 0.90 = claim all input tax; If T/A < 0.10 = claim nothing; Between 0.10-0.90 = apply formula

NON-DEDUCTIBLE INPUT TAX:
- Entertainment (unless entertainment business)
- Club memberships
- Passenger vehicles (unless transport/car hire business)
- Raw minerals (from 20 July 2017)

VAT EXEMPT SUPPLIES (key categories):
- Agricultural implements and inputs
- Unprocessed food (vegetables, fruits, meat, milk, fish, cereals)
- Medical services and medicines (approved)
- Education services (approved institutions)
- Books, newspapers, educational materials
- Residential property (existing, occupied 2+ years)
- Vacant land
- Financial services (free of charge)
- Life insurance, health insurance
- Public passenger transport (not taxis/rental cars)
- Piped water
- Funeral services
- Solar panels and components
- Petroleum products (diesel, petrol, kerosene, LPG)

VAT BAD DEBT:
- Supplier: if unpaid 18+ months and written off = may reclaim VAT
- Customer: if unpaid 18+ months = must repay input VAT claimed

CONSTRUCTION WHT SPLIT:
Materials: 3/5 × contract value × 2%; Services: 2/5 × contract value × 5%; If not separated: 5% on entire amount

=== ENTITY TYPES AND TAX TREATMENT ===

SOLE PROPRIETOR: Business income + employment income = total income; Progressive rates apply; Presumptive tax if below TZS 100M and not professional

PARTNERSHIP: Partnership itself pays NO tax; Income/loss allocated to partners by share %; Each partner taxed individually

COMPANY (LIMITED): 30% corporate tax; PAYE as employer; SDL as employer; WHT on payments to contractors; Quarterly installments required; Annual return June 30

NGO/CHARITY: Must have TRA ruling under S.11 TAA; Established solely for poverty relief, education, public health/water/roads; 25% of charitable income deductible as reserve; Amounts spent outside charitable purposes = taxable

CLUBS/ASSOCIATIONS: If 75%+ of income from members = EXEMPT; If below 75% from members = taxed as business

=== HOW TO ANSWER ===

ALWAYS:
1. Answer directly and clearly
2. Give the specific rate or amount if known
3. Explain in plain language — no jargon
4. When relevant say which KodiComply module to use (e.g. 'Use the PAYE Calculator in KodiComply to calculate this precisely')
5. For complex situations recommend professional advice

NEVER:
- Give legal advice
- Guarantee a specific tax outcome
- Say you are a lawyer or accountant

MODULE NAVIGATION:
When directing users to a module use this format: [Go to: MODULE_NAME]
where MODULE_NAME is one of: PAYE_CALCULATOR, PRESUMPTIVE_TAX, BUSINESS_INCOME, VAT_CALCULATOR, VAT_EXEMPT_CHECKER, WHT_CALCULATOR, TERMINAL_BENEFITS, DEPRECIATION_CALCULATOR, INVESTMENT_INCOME, PARTNERSHIP_TAX, REAL_ESTATE_VAT, TAX_PROFILE, FILING_DEADLINES, PENALTIES_CALCULATOR

LANGUAGE:
If user writes in Swahili respond in Swahili. If user writes in English respond in English.
Key Swahili tax terms: Kodi = Tax, Mapato = Income, Biashara = Business, Mshahara = Salary, Makato = Deductions, Faini = Penalty, Usajili = Registration, Tarehe ya mwisho = Deadline

DISCLAIMER:
Always end complex advice with: 'Note: This is general tax information. For your specific situation, confirm with a registered tax consultant or TRA.'
In Swahili: 'Kumbuka: Hii ni taarifa za jumla za kodi. Kwa hali yako maalum, thibitisha na mshauri wa kodi au TRA.'`;

async function getActiveSystemPrompt(): Promise<string> {
  const prompt = await prisma.systemPrompt.findFirst({
    where: { isActive: true },
    orderBy: { version: 'desc' },
  });
  if (prompt) return prompt.content;

  // Seed default prompt on first use
  await prisma.systemPrompt.create({
    data: { content: DEFAULT_SYSTEM_PROMPT, version: 1, isActive: true, updatedBy: 0 },
  });
  return DEFAULT_SYSTEM_PROMPT;
}

async function getTodayUsage(userId: number): Promise<{ count: number; limit: number }> {
  const today = new Date().toISOString().split('T')[0];
  const usage = await prisma.chatUsage.upsert({
    where: { userId_date: { userId, date: today } },
    update: {},
    create: { userId, date: today, messageCount: 0, dailyLimit: 20 },
  });
  return { count: usage.messageCount, limit: usage.dailyLimit };
}

async function incrementUsage(userId: number): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  await prisma.chatUsage.upsert({
    where: { userId_date: { userId, date: today } },
    update: { messageCount: { increment: 1 } },
    create: { userId, date: today, messageCount: 1, dailyLimit: 20 },
  });
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface UserProfile {
  entityType?: string;
  residentStatus?: string;
  incomeTypes?: string[];
  turnoverBand?: string;
  hasEmployees?: boolean;
}

export async function handleChat(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { messages, language, userProfile, sessionId, currentPage } = req.body as {
    messages: ChatMessage[];
    language: 'EN' | 'SW';
    userProfile?: UserProfile;
    sessionId?: number;
    currentPage?: string;
  };

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'messages array required' });
    return;
  }

  // Rate limit check
  const usage = await getTodayUsage(userId);
  if (usage.count >= usage.limit) {
    res.status(429).json({
      error: 'Daily limit reached',
      message: `You have used all ${usage.limit} daily questions. Your limit resets at midnight.`,
      count: usage.count,
      limit: usage.limit,
    });
    return;
  }

  // Build system prompt with context
  let systemPrompt = await getActiveSystemPrompt();
  if (currentPage) {
    systemPrompt = `The user is currently on the ${currentPage} page. Help them complete this specific calculation.\n\n${systemPrompt}`;
  }
  if (userProfile && userProfile.entityType) {
    systemPrompt = `This user's tax profile:\n- Entity type: ${userProfile.entityType}\n- Resident: ${userProfile.residentStatus === 'RESIDENT' ? 'yes' : 'no'}\n- Income types: ${(userProfile.incomeTypes || []).join(', ')}\n- Employees: ${userProfile.hasEmployees ? 'yes' : 'no'}\n- Turnover band: ${userProfile.turnoverBand || 'unknown'}\nPersonalise answers based on this profile.\n\n${systemPrompt}`;
  }

  // Keep only last 6 messages for cost control
  const recentMessages = messages.slice(-6);

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  let fullResponse = '';
  try {
    const onChunk = (text: string) => {
      fullResponse += text;
      res.write(`data: ${JSON.stringify({ type: 'chunk', text })}\n\n`);
    };

    if (useOpenRouter()) {
      await streamOpenRouter(systemPrompt, recentMessages, onChunk);
    } else {
      await streamAnthropic(systemPrompt, recentMessages as Anthropic.MessageParam[], onChunk);
    }

    // Increment usage
    await incrementUsage(userId);
    const newUsage = await getTodayUsage(userId);

    // Save or update session
    const allMessages = [...messages, { role: 'assistant' as const, content: fullResponse }];
    let savedSessionId = sessionId;
    if (sessionId) {
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: { messages: JSON.stringify(allMessages), language },
      });
    } else {
      const session = await prisma.chatSession.create({
        data: { userId, language, messages: JSON.stringify(allMessages) },
      });
      savedSessionId = session.id;
    }

    res.write(`data: ${JSON.stringify({ type: 'done', sessionId: savedSessionId, count: newUsage.count, limit: newUsage.limit })}\n\n`);
  } catch (err) {
    console.error('Chat error:', err);
    res.write(`data: ${JSON.stringify({ type: 'error', message: 'Sorry, I am having trouble connecting. Please try again in a moment.' })}\n\n`);
  } finally {
    res.end();
  }
}

export async function getChatSessions(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const sessions = await prisma.chatSession.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    take: 10,
    select: { id: true, language: true, createdAt: true, updatedAt: true, messages: true },
  });

  const result = sessions.map(s => {
    const msgs: ChatMessage[] = JSON.parse(s.messages || '[]');
    const firstUserMsg = msgs.find(m => m.role === 'user');
    return {
      id: s.id,
      language: s.language,
      preview: firstUserMsg ? firstUserMsg.content.slice(0, 80) : 'Empty session',
      messageCount: msgs.length,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    };
  });
  res.json(result);
}

export async function getChatSession(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const session = await prisma.chatSession.findFirst({
    where: { id: Number(req.params.id), userId },
  });
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }
  res.json({ ...session, messages: JSON.parse(session.messages || '[]') });
}

export async function getChatUsage(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const usage = await getTodayUsage(userId);
  res.json(usage);
}

// ── Admin handlers ─────────────────────────────────────────────────────────────

export async function getAdminChatStats(_req: AuthRequest, res: Response): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

  const [todayCount, weekCount, monthCount, totalSessions, langStats] = await Promise.all([
    prisma.chatUsage.aggregate({ where: { date: today }, _sum: { messageCount: true } }),
    prisma.chatUsage.aggregate({ where: { date: { gte: weekAgo } }, _sum: { messageCount: true } }),
    prisma.chatUsage.aggregate({ where: { date: { gte: monthAgo } }, _sum: { messageCount: true } }),
    prisma.chatSession.count(),
    prisma.chatSession.groupBy({ by: ['language'], _count: { id: true } }),
  ]);

  res.json({
    today: todayCount._sum.messageCount || 0,
    week: weekCount._sum.messageCount || 0,
    month: monthCount._sum.messageCount || 0,
    totalSessions,
    languages: langStats,
  });
}

export async function getAdminChatSessions(_req: AuthRequest, res: Response): Promise<void> {
  const sessions = await prisma.chatSession.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 50,
    select: { id: true, userId: true, language: true, messages: true, createdAt: true, updatedAt: true },
  });

  const result = sessions.map(s => {
    const msgs: ChatMessage[] = JSON.parse(s.messages || '[]');
    return {
      id: s.id,
      userId: s.userId,
      language: s.language,
      messageCount: msgs.length,
      preview: msgs[0]?.content?.slice(0, 80) || '',
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    };
  });
  res.json(result);
}

export async function getSystemPrompts(_req: AuthRequest, res: Response): Promise<void> {
  const prompts = await prisma.systemPrompt.findMany({ orderBy: { version: 'desc' } });
  res.json(prompts);
}

export async function createSystemPrompt(req: AuthRequest, res: Response): Promise<void> {
  const { content } = req.body as { content: string };
  if (!content || content.trim().length < 100) {
    res.status(400).json({ error: 'Prompt content too short' });
    return;
  }

  // Deactivate old prompts
  await prisma.systemPrompt.updateMany({ where: { isActive: true }, data: { isActive: false } });

  const latest = await prisma.systemPrompt.findFirst({ orderBy: { version: 'desc' } });
  const newVersion = (latest?.version || 0) + 1;

  const prompt = await prisma.systemPrompt.create({
    data: { content: content.trim(), version: newVersion, isActive: true, updatedBy: req.user!.id },
  });
  res.json(prompt);
}

export async function activateSystemPrompt(req: AuthRequest, res: Response): Promise<void> {
  const id = Number(req.params.id);
  await prisma.systemPrompt.updateMany({ where: { isActive: true }, data: { isActive: false } });
  const prompt = await prisma.systemPrompt.update({ where: { id }, data: { isActive: true, updatedBy: req.user!.id } });
  res.json(prompt);
}

export async function getDefaultLimit(_req: AuthRequest, res: Response): Promise<void> {
  const sample = await prisma.chatUsage.findFirst();
  res.json({ defaultLimit: sample?.dailyLimit || 20 });
}

export async function updateDefaultLimit(req: AuthRequest, res: Response): Promise<void> {
  const { limit } = req.body as { limit: number };
  if (!limit || limit < 1 || limit > 1000) {
    res.status(400).json({ error: 'Limit must be between 1 and 1000' });
    return;
  }
  // Update all future records by storing in a special row (userId=0, date='default')
  await prisma.chatUsage.upsert({
    where: { userId_date: { userId: 0, date: 'default' } },
    update: { dailyLimit: limit },
    create: { userId: 0, date: 'default', messageCount: 0, dailyLimit: limit },
  });
  res.json({ defaultLimit: limit });
}

export async function setUserChatLimit(req: AuthRequest, res: Response): Promise<void> {
  const userId = Number(req.params.userId);
  const { limit } = req.body as { limit: number };
  if (!limit || limit < 1 || limit > 1000) {
    res.status(400).json({ error: 'Limit must be between 1 and 1000' });
    return;
  }
  const today = new Date().toISOString().split('T')[0];
  const usage = await prisma.chatUsage.upsert({
    where: { userId_date: { userId, date: today } },
    update: { dailyLimit: limit },
    create: { userId, date: today, messageCount: 0, dailyLimit: limit },
  });
  res.json(usage);
}
