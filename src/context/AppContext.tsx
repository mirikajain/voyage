import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { 
  NavigationPage, 
  ExploreCategory, 
  Trip, 
  ExploreItem, 
  UserPreferences, 
  HomeAddress,
  ChatMessage, 
  AgentWorkflowStep, 
  AgentActivityLogItem,
  AgentRecommendationResult,
  RecommendationProposal,
  ItineraryDay,
  ItineraryItem,
  Transaction,
  CheckoutItem
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
  simulateDisruption,
  resolveDisruption,
  type BackendAgentResponse 
} from '../services/agentApi';

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
  handleSimulateDisruption: (type: string, itemId?: string, reason?: string) => Promise<void>;
  handleResolveDisruption: (approved: boolean, selectedReplacementId?: string) => Promise<void>;
  updateHomeAddress: (address: HomeAddress | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

const getPageFromPathname = (): NavigationPage => {
  if (typeof window === 'undefined') return 'home';
  const path = window.location.pathname.replace(/^\/+/, '').split('/')[0].toLowerCase();
  const validPages: NavigationPage[] = ['home', 'trips', 'explore', 'wallet', 'concierge', 'profile'];
  if (validPages.includes(path as NavigationPage)) {
    return path as NavigationPage;
  }
  return 'home';
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPageState] = useState<NavigationPage>(() => getPageFromPathname());

  useEffect(() => {
    const initialPage = getPageFromPathname();
    const currentPath = window.location.pathname;
    const targetPath = (initialPage === 'home' && (currentPath === '/' || currentPath === '')) ? '/' : `/${initialPage}`;
    window.history.replaceState({ page: initialPage }, '', targetPath);

    const handlePopState = (event: PopStateEvent) => {
      let targetPage: NavigationPage = 'home';
      if (event.state && event.state.page) {
        targetPage = event.state.page;
      } else {
        targetPage = getPageFromPathname();
      }
      setCurrentPageState(targetPage);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const setCurrentPage = (page: NavigationPage) => {
    setCurrentPageState((prev) => {
      if (prev === page) return prev;
      const targetPath = `/${page}`;
      window.history.pushState({ page }, '', targetPath);
      return page;
    });
  };
  const [trips, setTrips] = useState<Trip[]>(mockTrips);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [exploreItems] = useState<ExploreItem[]>(mockExploreItems);
  const [activeExploreCategory, setActiveExploreCategory] = useState<ExploreCategory>('hotels');
  const [activeEvaluationItem, setActiveEvaluationItem] = useState<ExploreItem | null>(null);
  
  // Persistent Profile initialization from localStorage
  const [userProfile, setUserProfile] = useState<UserPreferences>(() => {
    try {
      const savedProfile = localStorage.getItem('voyage_user_profile');
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        return {
          ...mockUserProfile,
          ...parsed,
        };
      }
      const savedHome = localStorage.getItem('voyage_home_address');
      if (savedHome) {
        return {
          ...mockUserProfile,
          homeAddress: JSON.parse(savedHome),
        };
      }
    } catch (e) {
      console.error('Error loading saved profile:', e);
    }
    return mockUserProfile;
  });
  
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
    setUserProfile(prev => {
      const updated = {
        ...prev,
        aiPreferences: {
          ...prev.aiPreferences,
          [key]: value,
        },
      };
      try {
        localStorage.setItem('voyage_user_profile', JSON.stringify(updated));
      } catch (err) {
        console.error('Error persisting profile to localStorage:', err);
      }
      return updated;
    });
  };

  const updateHomeAddress = (address: HomeAddress | null) => {
    setUserProfile(prev => {
      const updated: UserPreferences = {
        ...prev,
        homeAddress: address || undefined,
      };
      try {
        localStorage.setItem('voyage_user_profile', JSON.stringify(updated));
        if (address) {
          localStorage.setItem('voyage_home_address', JSON.stringify(address));
        } else {
          localStorage.removeItem('voyage_home_address');
        }
      } catch (err) {
        console.error('Failed to save home address to localStorage:', err);
      }
      return updated;
    });
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

      // Proactive Travel Disruption Mapping
      disruptionRecovery: data.disruption_recovery ? {
        disruption_detected: data.disruption_recovery.disruption_detected,
        disruption_type: data.disruption_recovery.disruption_type,
        disruption_reason: data.disruption_recovery.disruption_reason,
        disruption_timestamp: data.disruption_recovery.disruption_timestamp,
        is_simulation: data.disruption_recovery.is_simulation,
        affected_item: data.disruption_recovery.affected_item,
        affected_downstream_items: data.disruption_recovery.affected_downstream_items,
        selected_replacement: data.disruption_recovery.selected_replacement,
        replacement_options: data.disruption_recovery.replacement_options,
        itinerary_changes: data.disruption_recovery.itinerary_changes ? data.disruption_recovery.itinerary_changes.map(c => ({
          item_id: c.item_id,
          day: c.day,
          action: c.action,
          original_title: c.original_title,
          new_title: c.new_title,
          original_cost: c.original_cost,
          new_cost: c.new_cost,
          original_time: c.original_time,
          new_time: c.new_time,
          description: c.description,
        })) : [],
        additional_cost: data.disruption_recovery.additional_cost,
        original_item_cost: data.disruption_recovery.original_item_cost,
        replacement_cost: data.disruption_recovery.replacement_cost,
        price_difference: data.disruption_recovery.price_difference,
        recovery_status: data.disruption_recovery.recovery_status,
        requires_approval: data.disruption_recovery.requires_approval,
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

      const backendResponse = await runAgent(
        promptText, 
        currentThreadId || undefined,
        userProfile,
        userProfile.homeAddress
      );
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

    const isDisruptionPayment = Boolean(activeCheckoutItem?.isDisruptionPayment || activeCheckoutItem?.originalBookingCost);
    const bookingRef = `${payload.payment_reference || 'VOYAGE-BOOK'}-BK`;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isDisruptionPayment) {
      // Disruption Recovery Payment Workflow
      if (currentThreadId) {
        try {
          await resolveDisruption(currentThreadId, {
            approved: true,
            payment_id: payload.payment_id,
            order_id: payload.order_id,
            payment_status: 'paid',
            payment_amount: payload.amount,
          });
        } catch (err) {
          console.warn('Backend resolve disruption payment sync:', err);
        }
      }

      // 1. Update active recommendation result: resolve disruption, replace flight in itinerary, update budget
      setActiveRecommendationResult(prev => {
        if (!prev) return null;

        const currentEst = prev.breakdown?.totalEstimatedCost || 27900;
        const currentRem = prev.breakdown?.remainingBuffer ?? 12100;
        const newEstimated = currentEst + payload.amount;
        const newRemaining = Math.max(0, currentRem - payload.amount);

        // Update itinerary: replace cancelled flight with IndiGo 6E 614
        const updatedItinerary = prev.itinerary.map(day => {
          if (day.dayNumber === 1) {
            const updatedItems = day.items.map(item => {
              const isFlight = (item.category as string) === 'flight' || item.category === 'travel' || item.title.toLowerCase().includes('flight') || item.title.toLowerCase().includes('indigo');
              if (isFlight) {
                return {
                  ...item,
                  id: 'flt-indigo-goa-002',
                  time: '10:30 AM',
                  title: 'IndiGo 6E 614 [Confirmed Replacement]',
                  estimatedCost: 8400,
                  bookingRequired: false,
                };
              }
              return item;
            });
            return { ...day, items: updatedItems };
          }
          return day;
        });

        return {
          ...prev,
          paymentStatus: 'paid',
          bookingStatus: 'confirmed',
          requiresApproval: false,
          itinerary: updatedItinerary,
          disruptionRecovery: prev.disruptionRecovery ? {
            ...prev.disruptionRecovery,
            disruption_detected: false,
            recovery_status: 'approved',
            price_difference: payload.amount,
            additional_cost: payload.amount,
          } : undefined,
          breakdown: {
            ...prev.breakdown,
            totalEstimatedCost: newEstimated,
            remainingBuffer: newRemaining,
          },
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
        };
      });

      // 2. Add complete financial action trail to activity logs
      setActivityLogs(prev => [
        {
          id: `log-budg-${Date.now()}-1`,
          timestamp: now,
          event: `✓ Budget recalculated: ₹12,100 → ₹10,900 remaining (Additional ₹${payload.amount.toLocaleString()} committed)`,
          category: 'budget',
        },
        {
          id: `log-itin-${Date.now()}-2`,
          timestamp: now,
          event: `✓ Itinerary updated: IndiGo 6E 614 confirmed (Delhi → Goa, 10:30 AM, ₹8,400)`,
          category: 'complete',
        },
        {
          id: `log-conf-${Date.now()}-3`,
          timestamp: now,
          event: `✓ Replacement confirmed: Disruption resolved successfully`,
          category: 'complete',
        },
        {
          id: `log-payv-${Date.now()}-4`,
          timestamp: now,
          event: `✓ Payment verified: Razorpay ID ${payload.payment_id}`,
          category: 'budget',
        },
        {
          id: `log-payi-${Date.now()}-5`,
          timestamp: now,
          event: `✓ Razorpay payment initiated (Order: ${payload.order_id})`,
          category: 'budget',
        },
        {
          id: `log-appr-${Date.now()}-6`,
          timestamp: now,
          event: `✓ User approved ₹${payload.amount.toLocaleString()}`,
          category: 'system',
        },
        ...prev,
      ]);

      // 3. Update User Profile & Transactions
      setUserProfile(prev => {
        const currentSpent = prev.totalSpent || 27900;
        const newSpent = currentSpent + payload.amount;
        const newTx: Transaction = {
          id: `tx_${Date.now()}`,
          title: `Flight Replacement: IndiGo 6E 614 (Delhi → Goa)`,
          category: 'Disruption Recovery',
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

      // 4. Update Trips state
      setTrips(prev => {
        return prev.map(t => {
          if (t.destination.toLowerCase().includes('goa') || (activeRecommendationResult && t.destination.toLowerCase().includes(activeRecommendationResult.destination.toLowerCase()))) {
            return {
              ...t,
              amountSpent: (t.amountSpent || 27900) + payload.amount,
              itinerary: t.itinerary.map(day => {
                if (day.day === 1) {
                  return {
                    ...day,
                    items: day.items.map(item => {
                      const isFlight = (item.category as string) === 'flight' || item.category === 'travel' || item.title.toLowerCase().includes('flight');
                      if (isFlight) {
                        return {
                          ...item,
                          id: 'flt-indigo-goa-002',
                          title: 'IndiGo 6E 614 [Confirmed Replacement]',
                          time: '10:30 AM',
                          estimatedCost: 8400,
                        };
                      }
                      return item;
                    })
                  };
                }
                return day;
              })
            };
          }
          return t;
        });
      });

      // 5. Chat message confirmation
      const confirmMsg: ChatMessage = {
        id: `msg-agent-disp-conf-${Date.now()}`,
        sender: 'agent',
        text: `✓ Disruption resolved! Payment of ₹${payload.amount.toLocaleString()} verified via Razorpay (${payload.payment_id}).\n\nReplacement Flight Confirmed:\n• IndiGo 6E 614 (Delhi → Goa)\n• Sep 14 · 10:30 AM\n• Itinerary & trip budget updated (₹12,100 → ₹10,900 remaining).`,
        timestamp: now,
      };
      setChatMessages(prev => [...prev, confirmMsg]);

      return;
    }

    // Standard Full Trip Reservation Payment Workflow
    if (currentThreadId) {
      try {
        const res = await confirmPayment(currentThreadId, payload);
        const updatedRec = mapBackendResponseToClient(res);
        setActiveRecommendationResult(updatedRec);
      } catch (err) {
        console.warn('Backend confirm payment sync:', err);
      }
    }

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
      timestamp: now,
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

  const handleSimulateDisruption = async (type: string, itemId?: string, reason?: string) => {
    if (isAgentRunning) return;
    setIsAgentRunning(true);
    const threadId = currentThreadId || `thread_${Date.now()}`;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setActivityLogs(prev => [
      {
        id: `log-disp-${Date.now()}`,
        timestamp: now,
        event: `⚠️ Disruption simulated: ${type.replace(/_/g, ' ')}`,
        category: 'system',
      },
      ...prev,
    ]);

    try {
      const response = await simulateDisruption(threadId, {
        type,
        item_id: itemId,
        reason,
        is_simulation: true,
      });

      if (response.step_progress && response.step_progress.length > 0) {
        setWorkflowSteps(response.step_progress.map(s => ({
          id: s.id,
          label: s.label,
          status: s.status,
          activeDescription: s.active_description,
          completedDescription: s.completed_description,
        })));
      }

      if (response.agent_events && response.agent_events.length > 0) {
        setActivityLogs(response.agent_events.map(e => ({
          id: e.id,
          timestamp: e.timestamp,
          event: e.event,
          category: e.category,
        })));
      }

      const result = mapBackendResponseToClient(response);
      setActiveRecommendationResult(result);

      if (response.reasons && response.reasons.length > 0) {
        const agentMsg: ChatMessage = {
          id: `msg-disp-${Date.now()}`,
          sender: 'agent',
          text: response.reasons[0],
          timestamp: now,
        };
        setChatMessages(prev => [...prev, agentMsg]);
      }
    } catch (err: any) {
      console.error('Disruption simulation error:', err);
      const errMsg: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        sender: 'agent',
        text: `Error during disruption simulation: ${err.message}`,
        timestamp: now,
      };
      setChatMessages(prev => [...prev, errMsg]);
    } finally {
      setIsAgentRunning(false);
    }
  };

  const handleResolveDisruption = async (approved: boolean, selectedReplacementId?: string) => {
    if (isAgentRunning) return;
    setIsAgentRunning(true);
    const threadId = currentThreadId || `thread_${Date.now()}`;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    try {
      const response = await resolveDisruption(threadId, {
        approved,
        selected_replacement_id: selectedReplacementId,
      });

      if (response.agent_events && response.agent_events.length > 0) {
        setActivityLogs(response.agent_events.map(e => ({
          id: e.id,
          timestamp: e.timestamp,
          event: e.event,
          category: e.category,
        })));
      }

      const result = mapBackendResponseToClient(response);

      // If approved without extra payment (cheaper or same price), reflect savings/updates
      if (approved && activeRecommendationResult?.disruptionRecovery) {
        const priceDiff = activeRecommendationResult.disruptionRecovery.price_difference ?? 0;
        const repl = activeRecommendationResult.disruptionRecovery.selected_replacement;
        const replTitle = repl?.name || repl?.airline || repl?.title || 'Alternative Flight';

        if (priceDiff < 0) {
          const savings = Math.abs(priceDiff);
          result.breakdown = {
            ...result.breakdown,
            remainingBuffer: (activeRecommendationResult.breakdown?.remainingBuffer ?? 12100) + savings,
            totalEstimatedCost: (activeRecommendationResult.breakdown?.totalEstimatedCost ?? 27900) - savings,
          };
          setActivityLogs(prev => [
            {
              id: `log-budg-sav-${Date.now()}`,
              timestamp: now,
              event: `✓ Budget recalculated: Saved ₹${savings.toLocaleString()} on replacement booking`,
              category: 'budget',
            },
            {
              id: `log-itin-sav-${Date.now()}`,
              timestamp: now,
              event: `✓ Itinerary updated: ${replTitle} confirmed (${repl?.departure_time || '11:45 AM'})`,
              category: 'complete',
            },
            {
              id: `log-appr-sav-${Date.now()}`,
              timestamp: now,
              event: `✓ User approved replacement (No payment required — ₹${savings.toLocaleString()} saved)`,
              category: 'system',
            },
            ...prev,
          ]);
        } else if (priceDiff === 0) {
          setActivityLogs(prev => [
            {
              id: `log-itin-eq-${Date.now()}`,
              timestamp: now,
              event: `✓ Itinerary updated: ${replTitle} confirmed (${repl?.departure_time || '02:15 PM'})`,
              category: 'complete',
            },
            {
              id: `log-appr-eq-${Date.now()}`,
              timestamp: now,
              event: `✓ User approved replacement (No payment required — within existing budget)`,
              category: 'system',
            },
            ...prev,
          ]);
        }
      }

      setActiveRecommendationResult(result);

      const resMsg: ChatMessage = {
        id: `msg-res-${Date.now()}`,
        sender: 'agent',
        text: approved
          ? `✅ Disruption recovery approved! Your revised itinerary has been updated and confirmed.`
          : `❌ Disruption recovery declined. Original disrupted service remains flagged as unresolved.`,
        timestamp: now,
      };
      setChatMessages(prev => [...prev, resMsg]);
    } catch (err: any) {
      console.error('Resolve disruption error:', err);
    } finally {
      setIsAgentRunning(false);
    }
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
        handleSimulateDisruption,
        handleResolveDisruption,
        updateHomeAddress,
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
