import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { 
  NavigationPage, 
  ExploreCategory, 
  Trip, 
  ExploreItem, 
  UserPreferences, 
  ChatMessage, 
  AgentWorkflowStep, 
  AgentActivityLogItem,
  AgentRecommendationResult,
  RecommendationProposal,
  ItineraryDay,
  ItineraryItem,
  Transaction
} from '../types';
import { 
  mockTrips, 
  mockExploreItems, 
  mockUserProfile, 
  defaultRecommendation 
} from '../data/mockData';
import { initialAgentSteps, parseTravelPrompt } from '../services/agentService';
import { 
  runAgent, 
  resumeAgentApproval, 
  confirmPayment, 
  type BackendAgentResponse 
} from '../services/agentApi';

interface CheckoutItem {
  title: string;
  amount: number;
  currency: string;
  description: string;
  category: string;
}

interface AppContextType {
  currentPage: NavigationPage;
  setCurrentPage: (page: NavigationPage) => void;
  trips: Trip[];
  activeTrip: Trip | null;
  setActiveTrip: (trip: Trip | null) => void;
  exploreItems: ExploreItem[];
  activeExploreCategory: ExploreCategory;
  setActiveExploreCategory: (category: ExploreCategory) => void;
  activeEvaluationItem: ExploreItem | null;
  setActiveEvaluationItem: (item: ExploreItem | null) => void;
  userProfile: UserPreferences;
  updateAIPreference: (key: keyof UserPreferences['aiPreferences'], value: boolean) => void;
  isGlobalAIModalOpen: boolean;
  setIsGlobalAIModalOpen: (open: boolean) => void;
  isOptimizeModalOpen: boolean;
  setIsOptimizeModalOpen: (open: boolean) => void;
  isItineraryModalOpen: boolean;
  setIsItineraryModalOpen: (open: boolean) => void;
  isAdjustBudgetModalOpen: boolean;
  setIsAdjustBudgetModalOpen: (open: boolean) => void;
  isRazorpayCheckoutOpen: boolean;
  setIsRazorpayCheckoutOpen: (open: boolean) => void;
  activeCheckoutItem: CheckoutItem | null;
  setActiveCheckoutItem: (item: CheckoutItem | null) => void;
  
  // Agent State
  chatMessages: ChatMessage[];
  workflowSteps: AgentWorkflowStep[];
  activityLogs: AgentActivityLogItem[];
  activeRecommendationResult: AgentRecommendationResult | null;
  isAgentRunning: boolean;
  currentThreadId: string | null;
  currentAIMode: 'llm' | 'demo' | 'fallback';
  
  // Triggers & Handlers
  sendUserMessage: (text: string) => void;
  triggerAIPromptFromAnywhere: (promptText: string) => void;
  handleBookRecommendation: (rec?: RecommendationProposal | AgentRecommendationResult) => void;
  handleAdjustBudgetSubmit: (newBudget: number) => void;
  handleApprovePayment: () => Promise<void>;
  handleRejectPayment: () => Promise<void>;
  handleConfirmPaymentSuccess: (payload: {
    order_id: string;
    payment_id: string;
    payment_reference?: string;
    amount: number;
    currency?: string;
    status?: string;
  }) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<NavigationPage>('home');
  const [trips, setTrips] = useState<Trip[]>(mockTrips);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [exploreItems] = useState<ExploreItem[]>(mockExploreItems);
  const [activeExploreCategory, setActiveExploreCategory] = useState<ExploreCategory>('hotels');
  const [activeEvaluationItem, setActiveEvaluationItem] = useState<ExploreItem | null>(null);
  const [userProfile, setUserProfile] = useState<UserPreferences>(mockUserProfile);
  
  // Modals
  const [isGlobalAIModalOpen, setIsGlobalAIModalOpen] = useState(false);
  const [isOptimizeModalOpen, setIsOptimizeModalOpen] = useState(false);
  const [isItineraryModalOpen, setIsItineraryModalOpen] = useState(false);
  const [isAdjustBudgetModalOpen, setIsAdjustBudgetModalOpen] = useState(false);
  const [isRazorpayCheckoutOpen, setIsRazorpayCheckoutOpen] = useState(false);
  const [activeCheckoutItem, setActiveCheckoutItem] = useState<CheckoutItem | null>(null);

  // Agent State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [workflowSteps, setWorkflowSteps] = useState<AgentWorkflowStep[]>(initialAgentSteps);
  const [activityLogs, setActivityLogs] = useState<AgentActivityLogItem[]>([]);
  const [activeRecommendationResult, setActiveRecommendationResult] = useState<AgentRecommendationResult | null>(null);
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [currentAIMode, setCurrentAIMode] = useState<'llm' | 'demo' | 'fallback'>('demo');

  const isInitialized = useRef(false);

  const updateAIPreference = (key: keyof UserPreferences['aiPreferences'], value: boolean) => {
    setUserProfile(prev => ({
      ...prev,
      aiPreferences: {
        ...prev.aiPreferences,
        [key]: value,
      },
    }));
  };

  const handleBookRecommendation = (rec?: RecommendationProposal | AgentRecommendationResult) => {
    if (activeRecommendationResult) {
      setActiveCheckoutItem({
        title: activeRecommendationResult.planTitle,
        amount: activeRecommendationResult.breakdown.totalEstimatedCost,
        currency: 'INR',
        description: `Voyage Autonomous Plan • ${activeRecommendationResult.destination} (${activeRecommendationResult.durationDays} Days)`,
        category: 'Travel Package',
      });
      setIsRazorpayCheckoutOpen(true);
      return;
    }

    const target = rec || defaultRecommendation;
    if ('price' in target) {
      setActiveCheckoutItem({
        title: target.title,
        amount: target.price,
        currency: 'INR',
        description: `Voyage VIP Autonomous Reservation • ${target.location}`,
        category: target.category,
      });
      setIsRazorpayCheckoutOpen(true);
    }
  };

    const mapBackendResponseToClient = (data: BackendAgentResponse): AgentRecommendationResult => {
    const formattedItinerary: ItineraryDay[] = (data.itinerary || []).map((dayData: any) => ({
      dayNumber: dayData.day || dayData.dayNumber || 1,
      dayTitle: dayData.day_title || dayData.dayTitle || `Day ${dayData.day}`,
      items: (dayData.items || []).map((it: any): ItineraryItem => ({
        time: it.time || '10:00 AM',
        title: it.title || 'Curated Activity',
        location: it.location || '',
        category: it.category || 'activity',
        cost: Number(it.estimated_cost || it.cost || 0),
      })),
    }));

    const breakdownData = data.breakdown || {
      hotel_name: 'Boutique Stay',
      hotel_cost: 0,
      dining_cost: 0,
      activities_cost: 0,
      transport_cost: 0,
      travel_cost: 0,
      total_estimated_cost: data.estimated_total || 0,
      requested_budget: data.budget || 0,
      remaining_buffer: data.remaining_budget || 0,
      hotel_source: 'Voyage Partner',
      hotel_is_live: false,
      travel_source: 'Voyage Partner',
      travel_is_live: false,
      budget_envelopes: data.budget_envelopes,
      category_status: data.category_status,
    };

    const reqBudget = (breakdownData.requested_budget && breakdownData.requested_budget > 0)
      ? breakdownData.requested_budget
      : ((data.budget && data.budget > 0) ? data.budget : breakdownData.total_estimated_cost);

    const dest = data.destination || 'Your Trip';
    let planTitle = `YOUR ${dest.toUpperCase()} PLAN`;
    if (data.intent === 'flight_search') {
      planTitle = `FLIGHTS: ${(data.origin || 'ORIGIN').toUpperCase()} ➔ ${dest.toUpperCase()}`;
    } else if (data.intent === 'hotel_search') {
      planTitle = `HOTELS IN ${dest.toUpperCase()}`;
    } else if (data.intent === 'restaurant_search') {
      planTitle = `RESTAURANTS IN ${dest.toUpperCase()}`;
    } else if (data.intent === 'activity_search') {
      planTitle = `ACTIVITIES IN ${dest.toUpperCase()}`;
    }

    return {
      id: `rec-${data.thread_id || Date.now()}`,
      thread_id: data.thread_id,
      planTitle,
      intent: data.intent,
      destination: dest,
      origin: data.origin || undefined,
      durationDays: data.duration_days || 2,
      breakdown: {
        hotelName: breakdownData.hotel_name,
        hotelCost: breakdownData.hotel_cost,
        diningCost: breakdownData.dining_cost,
        activitiesCost: breakdownData.activities_cost,
        transportCost: breakdownData.transport_cost,
        travelCost: breakdownData.travel_cost,
        totalEstimatedCost: breakdownData.total_estimated_cost,
        requestedBudget: reqBudget,
        remainingBuffer: breakdownData.remaining_buffer,
        hotelSource: breakdownData.hotel_source,
        hotelIsLive: breakdownData.hotel_is_live,
        travelSource: breakdownData.travel_source,
        travelIsLive: breakdownData.travel_is_live,
        budgetEnvelopes: data.budget_envelopes || breakdownData.budget_envelopes,
        categoryStatus: data.category_status || breakdownData.category_status,
      },
      budgetEnvelopes: data.budget_envelopes || breakdownData.budget_envelopes,
      categoryStatus: data.category_status || breakdownData.category_status,
      reasons: data.reasons || [],
      itinerary: formattedItinerary,
      searchResults: data.search_results ? {
        type: data.search_results.type,
        query_title: data.search_results.query_title,
        items: data.search_results.items,
        total_count: data.search_results.total_count,
        provider: data.search_results.provider,
        is_live: data.search_results.is_live,
      } : undefined,
      
      // Phase 5 Financial and Approval Mapping
      requiresApproval: data.requires_approval,
      approvalStatus: data.approval_status || undefined,
      approvalRequest: data.approval_request ? {
        action: data.approval_request.action,
        item: data.approval_request.item,
        amount: data.approval_request.amount,
        currency: data.approval_request.currency,
        payment_reference: data.approval_request.payment_reference,
        requires_approval: data.approval_request.requires_approval,
        approval_reason: data.approval_request.approval_reason,
        budget: data.approval_request.budget || undefined,
        remaining_buffer: data.approval_request.remaining_buffer,
        gateway: data.approval_request.gateway,
      } : undefined,
      paymentStatus: data.payment_status as any,
      bookingStatus: data.booking_status || undefined,
      paymentAmount: data.payment_amount || undefined,
      paymentReference: data.payment_reference || undefined,
      paymentOrder: data.payment_order ? {
        order_id: data.payment_order.order_id,
        amount_in_paise: data.payment_order.amount_in_paise,
        amount_in_rupees: data.payment_order.amount_in_rupees,
        currency: data.payment_order.currency,
        status: data.payment_order.status,
        payment_reference: data.payment_order.payment_reference,
        key_id: data.payment_order.key_id,
        mode: data.payment_order.mode,
        merchant_name: data.payment_order.merchant_name,
      } : undefined,
      paymentConfirmation: data.payment_confirmation ? {
        payment_id: data.payment_confirmation.payment_id,
        order_id: data.payment_confirmation.order_id,
        payment_reference: data.payment_confirmation.payment_reference,
        booking_reference: data.payment_confirmation.booking_reference,
        amount: data.payment_confirmation.amount,
        currency: data.payment_confirmation.currency,
        status: data.payment_confirmation.status as any,
        timestamp: data.payment_confirmation.timestamp,
        method: data.payment_confirmation.method,
        receipt: data.payment_confirmation.receipt,
      } : undefined,
      spendGuardrailResult: data.spend_guardrail_result ? {
        allowed: data.spend_guardrail_result.allowed,
        requires_approval: data.spend_guardrail_result.requires_approval,
        reason: data.spend_guardrail_result.reason,
        budget_ceiling: data.spend_guardrail_result.budget_ceiling || undefined,
        requested_amount: data.spend_guardrail_result.requested_amount,
        remaining_buffer: data.spend_guardrail_result.remaining_buffer,
        is_budget_exceeded: data.spend_guardrail_result.is_budget_exceeded,
        autonomous_limit: data.spend_guardrail_result.autonomous_limit,
        ask_before_purchase: data.spend_guardrail_result.ask_before_purchase,
      } : undefined,

      isBudgetExceeded: data.is_budget_exceeded,
      compromiseMessage: data.compromise_message,
      dataSourceNotice: data.data_source_notice || 'Prices shown from simulated external travel providers',
      aiMode: data.ai_mode || 'demo',
      providerSummary: data.provider_summary,
    };
  };

  const runAgentPlanning = async (promptText: string) => {
    const { intent, destination, origin, durationDays, budget } = parseTravelPrompt(promptText);

    // 1. Append user request to chat
    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      text: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // 2. Append agent thinking acknowledgment
    let ackText = `I'll build a ${durationDays}-day ${destination} itinerary${budget ? ` around your ₹${budget.toLocaleString()} budget` : ''}. I'll check accommodation, activities, dining and transport while keeping the trip balanced.`;
    if (intent === 'flight_search') {
      ackText = `I'm searching flights from ${origin} to ${destination}. Querying live airline schedules and fares...`;
    } else if (intent === 'hotel_search') {
      ackText = `I'm searching accommodations and boutique stays in ${destination}...`;
    } else if (intent === 'restaurant_search') {
      ackText = `I'm searching top-rated restaurants and dining venues in ${destination}...`;
    } else if (intent === 'activity_search') {
      ackText = `I'm finding curated activities and experiences in ${destination}...`;
    }

    const agentAckMsg: ChatMessage = {
      id: `msg-agent-ack-${Date.now()}`,
      sender: 'agent',
      text: ackText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages(prev => [...prev, userMsg, agentAckMsg]);
    setIsAgentRunning(true);
    setActiveRecommendationResult(null);

    // Initial reset of workflow steps
    let stepTemplates: AgentWorkflowStep[];
    if (intent === 'flight_search') {
      stepTemplates = [
        { id: 'step-1', label: 'Understanding request', status: 'active', activeDescription: `Flight search: ${origin} ➔ ${destination}` },
        { id: 'step-2', label: 'Searching flight schedules', status: 'waiting' },
        { id: 'step-3', label: 'Preparing flight options', status: 'waiting' }
      ];
    } else if (intent === 'hotel_search') {
      stepTemplates = [
        { id: 'step-1', label: 'Understanding request', status: 'active', activeDescription: `Hotel search: ${destination}` },
        { id: 'step-2', label: 'Searching accommodations', status: 'waiting' },
        { id: 'step-3', label: 'Preparing hotel options', status: 'waiting' }
      ];
    } else if (intent === 'restaurant_search') {
      stepTemplates = [
        { id: 'step-1', label: 'Understanding request', status: 'active', activeDescription: `Restaurant search: ${destination}` },
        { id: 'step-2', label: 'Searching gastronomy', status: 'waiting' },
        { id: 'step-3', label: 'Preparing dining recommendations', status: 'waiting' }
      ];
    } else {
      stepTemplates = [
        ...initialAgentSteps.map(s => ({ ...s, status: 'waiting' as any })),
        { id: 'step-7', label: 'Preparing payment', status: 'waiting' },
        { id: 'step-8', label: 'Waiting for your approval', status: 'waiting' }
      ];
    }

    setWorkflowSteps(stepTemplates);

    try {
      if (stepTemplates.length > 0) {
        stepTemplates[0].status = 'active';
        setWorkflowSteps([...stepTemplates]);
        await sleep(200);
        stepTemplates[0].status = 'complete';
      }

      const backendResponse = await runAgent(promptText, currentThreadId || undefined);
      setCurrentAIMode(backendResponse.ai_mode || 'demo');
      
      // Save thread ID for multi-turn conversational persistence
      if (backendResponse.thread_id) {
        setCurrentThreadId(backendResponse.thread_id);
      }

      // Sync Agent Events log
      if (backendResponse.agent_events && backendResponse.agent_events.length > 0) {
        setActivityLogs(backendResponse.agent_events.map(e => ({
          id: e.id,
          timestamp: e.timestamp,
          event: e.event,
          category: e.category as any,
        })));
      }

      // Sync Workflow Steps
      if (backendResponse.step_progress && backendResponse.step_progress.length > 0) {
        setWorkflowSteps(backendResponse.step_progress.map(s => ({
          id: s.id,
          label: s.label,
          status: s.status as any,
          activeDescription: s.active_description,
          completedDescription: s.completed_description,
        })));
      }

      await sleep(250);

      // Handle conversational clarification pause (status === 'needs_input')
      if (backendResponse.status === 'needs_input') {
        setIsAgentRunning(false);
        const questionText = backendResponse.question || 'Please share more details about your trip.';

        // Build helpful smart prompts based on missing fields
        const missing = backendResponse.missing_fields || [];
        const dynamicPrompts: string[] = [];
        if (missing.includes('origin')) {
          dynamicPrompts.push('From Mumbai', 'From Delhi', 'From Bangalore');
        }
        if (missing.includes('departure_date') || missing.includes('return_date')) {
          dynamicPrompts.push('September 14 to September 18', '2-day trip', 'Next weekend');
        }
        if (missing.includes('budget')) {
          dynamicPrompts.push('Under ₹20,000', 'Under ₹40,000', 'Under ₹60,000');
        }

        const agentClarifyMsg: ChatMessage = {
          id: `msg-agent-clarify-${Date.now()}`,
          sender: 'agent',
          text: questionText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          quickPrompts: dynamicPrompts.slice(0, 3),
        };
        setChatMessages(prev => [...prev, agentClarifyMsg]);
        return;
      }

      const clientRec = mapBackendResponseToClient(backendResponse);
      setActiveRecommendationResult(clientRec);
      setIsAgentRunning(false);

      // Append final agent recommendation message
      let finalMsgText = '';
      if (backendResponse.intent === 'flight_search') {
        const count = backendResponse.search_results?.total_count || 3;
        finalMsgText = `Found ${count} direct flight schedules for ${backendResponse.origin || 'Delhi'} ➔ ${backendResponse.destination}. Check the route cards for departure timings and fares.`;
      } else if (backendResponse.intent === 'hotel_search') {
        finalMsgText = `Found verified luxury boutique accommodations in ${backendResponse.destination}.`;
      } else if (backendResponse.intent === 'restaurant_search') {
        finalMsgText = `Found top-rated dining venues and cafés in ${backendResponse.destination}.`;
      } else if (backendResponse.intent === 'activity_search') {
        finalMsgText = `Found curated activities and cultural experiences in ${backendResponse.destination}.`;
      } else {
        finalMsgText = clientRec.isBudgetExceeded && clientRec.compromiseMessage
          ? clientRec.compromiseMessage
          : (backendResponse.budget
              ? `Here is your curated ${clientRec.durationDays}-day ${clientRec.destination} plan. Total estimated cost is ₹${clientRec.breakdown.totalEstimatedCost.toLocaleString()} with ₹${clientRec.breakdown.remainingBuffer.toLocaleString()} remaining in your buffer.`
              : `Here is your curated ${clientRec.durationDays}-day ${clientRec.destination} plan. Total estimated cost is ₹${clientRec.breakdown.totalEstimatedCost.toLocaleString()}.`);
      }

      const quickPrompts = backendResponse.intent === 'flight_search'
        ? ['Book top flight option', 'Find hotels near airport', 'Plan full itinerary for ' + clientRec.destination]
        : (backendResponse.intent === 'hotel_search'
            ? ['Reserve suite', 'Find flights to ' + clientRec.destination, 'Plan full trip']
            : (clientRec.categoryStatus?.hotel === 'Hotel budget too low'
                ? ['Increase hotel budget to ₹15,000', 'Show available hotel alternatives', 'Book with Voyage']
                : (clientRec.isBudgetExceeded
                    ? [`Adjust budget for ${clientRec.destination}`, 'Reduce activity count', 'Show value stay options']
                    : ['Book with Voyage', 'Review full itinerary', 'Adjust budget'])));

      const finalAgentMsg: ChatMessage = {
        id: `msg-agent-rec-${Date.now()}`,
        sender: 'agent',
        text: finalMsgText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        recommendation: clientRec,
        isBudgetWarning: clientRec.isBudgetExceeded,
        quickPrompts,
      };
      setChatMessages(prev => [...prev, finalAgentMsg]);
    } catch (err: any) {
      setIsAgentRunning(false);
      const errorMsg: ChatMessage = {
        id: `msg-agent-err-${Date.now()}`,
        sender: 'agent',
        text: `Error contacting LangGraph agent backend: ${err?.message || err}. Please ensure the backend is running.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages(prev => [...prev, errorMsg]);
    }
  };

  // Phase 5 Approval & Payment Handlers
  const handleApprovePayment = async () => {
    if (!activeRecommendationResult) return;

    // Update Control Center workflow
    setWorkflowSteps(prev => {
      const updated: AgentWorkflowStep[] = prev.map(s => {
        if (s.id === 'step-8') {
          return { ...s, status: 'complete' as const, completedDescription: 'Payment approved by user' };
        }
        return s;
      });
      if (!updated.some(s => s.id === 'step-9')) {
        updated.push({
          id: 'step-9',
          label: 'Processing payment',
          status: 'active' as const,
          activeDescription: 'Launching Razorpay secure checkout...'
        });
      }
      return updated;
    });

    if (currentThreadId) {
      try {
        const res = await resumeAgentApproval(currentThreadId, true);
        const updatedRec = mapBackendResponseToClient(res);
        setActiveRecommendationResult(updatedRec);
      } catch (err) {
        console.warn('Backend resume approval sync:', err);
      }
    }

    // Launch Razorpay Checkout Modal
    setActiveCheckoutItem({
      title: `${activeRecommendationResult.destination} Trip Package`,
      amount: activeRecommendationResult.breakdown.totalEstimatedCost,
      currency: 'INR',
      description: `${activeRecommendationResult.durationDays} Days · ${activeRecommendationResult.breakdown.hotelName}`,
      category: 'Travel Package',
    });
    setIsRazorpayCheckoutOpen(true);
  };

  const handleRejectPayment = async () => {
    if (!activeRecommendationResult) return;

    if (currentThreadId) {
      try {
        const res = await resumeAgentApproval(currentThreadId, false);
        const updatedRec = mapBackendResponseToClient(res);
        setActiveRecommendationResult(updatedRec);
      } catch (err) {
        console.warn('Backend reject approval sync:', err);
      }
    }

    setActiveRecommendationResult(prev => prev ? {
      ...prev,
      paymentStatus: 'cancelled',
      requiresApproval: false
    } : null);

    setWorkflowSteps(prev => prev.map(s => {
      if (s.id === 'step-8') return { ...s, status: 'complete', completedDescription: 'Payment cancelled by user' };
      return s;
    }));

    const cancelMsg: ChatMessage = {
      id: `msg-agent-cancel-${Date.now()}`,
      sender: 'agent',
      text: 'No payment was made. Your itinerary is still saved in Voyage.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages(prev => [...prev, cancelMsg]);
  };

  const handleConfirmPaymentSuccess = async (payload: {
    order_id: string;
    payment_id: string;
    payment_reference?: string;
    amount: number;
    currency?: string;
    status?: string;
  }) => {
    if (!activeRecommendationResult) return;

    if (currentThreadId) {
      try {
        const res = await confirmPayment(currentThreadId, payload);
        const updatedRec = mapBackendResponseToClient(res);
        setActiveRecommendationResult(updatedRec);
      } catch (err) {
        console.warn('Backend confirm payment sync:', err);
      }
    }

    const bookingRef = `${payload.payment_reference || 'VOYAGE-BOOK'}-BK`;

    // 1. Update active recommendation result
    setActiveRecommendationResult(prev => prev ? {
      ...prev,
      paymentStatus: 'paid',
      requiresApproval: false,
      paymentConfirmation: {
        payment_id: payload.payment_id,
        order_id: payload.order_id,
        payment_reference: payload.payment_reference || 'VOYAGE-REF',
        booking_reference: bookingRef,
        amount: payload.amount,
        currency: payload.currency || 'INR',
        status: 'paid',
        timestamp: new Date().toLocaleString(),
        method: 'UPI / Card (Razorpay Secure)',
      }
    } : null);

    // 2. Deterministically update Trips state
    setTrips(prev => {
      const dest = activeRecommendationResult.destination;
      const existingIdx = prev.findIndex(t => t.destination.toLowerCase().includes(dest.toLowerCase()));
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          status: 'Booked',
          bookingReference: bookingRef,
          paymentReference: payload.payment_reference,
          paymentStatus: 'paid',
          amountSpent: payload.amount,
        };
        return updated;
      } else {
        const newTrip: Trip = {
          id: `trip-${Date.now()}`,
          destination: dest,
          country: 'India',
          image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=800&auto=format&fit=crop',
          startDate: '15 Oct 2026',
          endDate: '19 Oct 2026',
          durationDays: activeRecommendationResult.durationDays,
          totalBudget: activeRecommendationResult.breakdown.requestedBudget || payload.amount,
          amountSpent: payload.amount,
          currency: 'INR',
          status: 'Booked',
          travelVibe: 'Curated Luxury',
          bookingReference: bookingRef,
          paymentReference: payload.payment_reference,
          paymentStatus: 'paid',
          itinerary: activeRecommendationResult.itinerary.map(d => ({
            day: d.dayNumber,
            title: d.dayTitle,
            items: d.items,
          })),
        };
        return [newTrip, ...prev];
      }
    });

    // 3. Deterministically update Wallet & User Profile state
    setUserProfile(prev => {
      const currentSpent = prev.totalSpent || 132400;
      const newSpent = currentSpent + payload.amount;
      const newTx: Transaction = {
        id: `tx_${Date.now()}`,
        title: `Voyage Booking: ${activeRecommendationResult.destination} (${activeRecommendationResult.durationDays}D)`,
        category: 'Travel Package',
        date: 'Today',
        amount: payload.amount,
        currency: 'INR',
        status: 'Settled',
        razorpayPaymentId: payload.payment_id,
        method: 'Razorpay Instant Settlement',
      };
      return {
        ...prev,
        totalSpent: newSpent,
        transactions: [newTx, ...(prev.transactions || [])],
      };
    });

    // 4. Update workflow steps
    setWorkflowSteps(prev => {
      const updated = prev.map(s => {
        if (s.id === 'step-9') return { ...s, status: 'complete' as any, completedDescription: 'Razorpay checkout authorized' };
        return s;
      });
      return [
        ...updated,
        {
          id: 'step-10',
          label: 'Payment completed',
          status: 'complete',
          completedDescription: `Booking Reference: ${bookingRef}`
        }
      ];
    });

    // 5. Append agent chat confirmation message
    const confirmMsg: ChatMessage = {
      id: `msg-agent-conf-${Date.now()}`,
      sender: 'agent',
      text: `Payment of ₹${payload.amount.toLocaleString()} confirmed via Razorpay (${payload.payment_id}). Your trip to ${activeRecommendationResult.destination} is officially BOOKED!\n\nBooking Reference: ${bookingRef}\nWallet & Trips have been updated.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages(prev => [...prev, confirmMsg]);
  };

  const sendUserMessage = (text: string) => {
    if (!text.trim() || isAgentRunning) return;
    runAgentPlanning(text);
  };

  const triggerAIPromptFromAnywhere = (promptText: string) => {
    setCurrentPage('concierge');
    setIsGlobalAIModalOpen(false);
    runAgentPlanning(promptText);
  };

  const handleAdjustBudgetSubmit = (newBudget: number) => {
    setIsAdjustBudgetModalOpen(false);
    const dest = activeRecommendationResult?.destination || 'Goa';
    const days = activeRecommendationResult?.durationDays || 4;
    runAgentPlanning(`Plan a ${days}-day ${dest} trip under ₹${newBudget.toLocaleString()}`);
  };

  // Initialize with standard example on first load
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      runAgentPlanning('Plan a 4-day Goa trip under ₹40,000');
    }
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentPage,
        setCurrentPage,
        trips,
        activeTrip,
        setActiveTrip,
        exploreItems,
        activeExploreCategory,
        setActiveExploreCategory,
        activeEvaluationItem,
        setActiveEvaluationItem,
        userProfile,
        updateAIPreference,
        isGlobalAIModalOpen,
        setIsGlobalAIModalOpen,
        isOptimizeModalOpen,
        setIsOptimizeModalOpen,
        isItineraryModalOpen,
        setIsItineraryModalOpen,
        isAdjustBudgetModalOpen,
        setIsAdjustBudgetModalOpen,
        isRazorpayCheckoutOpen,
        setIsRazorpayCheckoutOpen,
        activeCheckoutItem,
        setActiveCheckoutItem,
        chatMessages,
        workflowSteps,
        activityLogs,
        activeRecommendationResult,
        isAgentRunning,
        currentThreadId,
        currentAIMode,
        sendUserMessage,
        triggerAIPromptFromAnywhere,
        handleBookRecommendation,
        handleAdjustBudgetSubmit,
        handleApprovePayment,
        handleRejectPayment,
        handleConfirmPaymentSuccess,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
