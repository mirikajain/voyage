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
  ItineraryItem
} from '../types';
import { 
  mockTrips, 
  mockExploreItems, 
  mockUserProfile, 
  defaultRecommendation 
} from '../data/mockData';
import { initialAgentSteps, parseTravelPrompt } from '../services/agentService';
import { runAgent, type BackendAgentResponse } from '../services/agentApi';

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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<NavigationPage>('home');
  const [trips] = useState<Trip[]>(mockTrips);
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

    const reqBudget = data.breakdown.requested_budget !== undefined && data.breakdown.requested_budget !== null
      ? data.breakdown.requested_budget
      : (data.budget || data.breakdown.total_estimated_cost);

    return {
      id: `rec-${data.thread_id || Date.now()}`,
      planTitle: `YOUR ${data.destination.toUpperCase()} PLAN`,
      destination: data.destination,
      durationDays: data.duration_days,
      breakdown: {
        hotelName: data.breakdown.hotel_name,
        hotelCost: data.breakdown.hotel_cost,
        diningCost: data.breakdown.dining_cost,
        activitiesCost: data.breakdown.activities_cost,
        transportCost: data.breakdown.transport_cost,
        travelCost: data.breakdown.travel_cost,
        totalEstimatedCost: data.breakdown.total_estimated_cost,
        requestedBudget: reqBudget,
        remainingBuffer: data.breakdown.remaining_buffer,
        hotelSource: data.breakdown.hotel_source,
        hotelIsLive: data.breakdown.hotel_is_live,
        travelSource: data.breakdown.travel_source,
        travelIsLive: data.breakdown.travel_is_live,
      },
      reasons: data.reasons,
      itinerary: formattedItinerary,
      isBudgetExceeded: data.is_budget_exceeded,
      compromiseMessage: data.compromise_message,
      dataSourceNotice: data.data_source_notice || 'Prices shown from simulated external travel providers',
      aiMode: data.ai_mode || 'demo',
      providerSummary: data.provider_summary,
    };
  };

  const runAgentPlanning = async (promptText: string) => {
    const { destination, durationDays, budget } = parseTravelPrompt(promptText);

    // 1. Append user message
    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      text: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // 2. Append agent thinking acknowledgment
    const budgetMsg = budget ? ` around your ₹${budget.toLocaleString()} budget` : '';
    const agentAckMsg: ChatMessage = {
      id: `msg-agent-ack-${Date.now()}`,
      sender: 'agent',
      text: `I'll build a ${durationDays}-day ${destination} itinerary${budgetMsg}. I'll check accommodation, activities, dining and transport while keeping the trip balanced.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages(prev => [...prev, userMsg, agentAckMsg]);
    setIsAgentRunning(true);
    setActiveRecommendationResult(null);

    // Initial reset of workflow steps for visual presentation
    const stepTemplates: AgentWorkflowStep[] = initialAgentSteps.map(s => ({ ...s, status: 'waiting' }));
    setWorkflowSteps(stepTemplates);

    try {
      // Step 1 presentation
      stepTemplates[0] = { ...stepTemplates[0], status: 'active', activeDescription: `Parsing "${promptText}"...` };
      setWorkflowSteps([...stepTemplates]);
      await sleep(350);
      stepTemplates[0] = { ...stepTemplates[0], status: 'complete' };

      // Step 2 presentation
      stepTemplates[1] = { ...stepTemplates[1], status: 'active', activeDescription: `Loading preferences for ${destination}...` };
      setWorkflowSteps([...stepTemplates]);
      await sleep(300);
      stepTemplates[1] = { ...stepTemplates[1], status: 'complete' };

      // Step 3 presentation (Calling LangGraph backend)
      stepTemplates[2] = { ...stepTemplates[2], status: 'active', activeDescription: `Querying external travel providers & partner GDS for ${destination}...` };
      setWorkflowSteps([...stepTemplates]);

      // Real Call to FastAPI + LangGraph Agent Backend
      const backendResponse = await runAgent(promptText, currentThreadId || undefined);
      setCurrentThreadId(backendResponse.thread_id);
      setCurrentAIMode(backendResponse.ai_mode || 'demo');

      // Append backend events into activity log
      if (backendResponse.agent_events && backendResponse.agent_events.length > 0) {
        setActivityLogs(backendResponse.agent_events.map(e => ({
          id: e.id,
          timestamp: e.timestamp,
          event: e.event,
          category: e.category,
        })));
      }

      await sleep(350);
      stepTemplates[2] = { ...stepTemplates[2], status: 'complete' };

      // Step 4 presentation
      stepTemplates[3] = { ...stepTemplates[3], status: 'active', activeDescription: 'Evaluating ratings, distance & schedule fit...' };
      setWorkflowSteps([...stepTemplates]);
      await sleep(300);
      stepTemplates[3] = { ...stepTemplates[3], status: 'complete' };

      // Step 5 presentation
      stepTemplates[4] = { ...stepTemplates[4], status: 'active', activeDescription: 'Verifying budget envelopes & contingency...' };
      setWorkflowSteps([...stepTemplates]);
      await sleep(300);
      stepTemplates[4] = { ...stepTemplates[4], status: 'complete' };

      // Step 6 presentation
      stepTemplates[5] = { ...stepTemplates[5], status: 'active', activeDescription: 'Synthesizing recommendation...' };
      setWorkflowSteps([...stepTemplates]);
      await sleep(250);
      stepTemplates[5] = { ...stepTemplates[5], status: 'complete' };
      setWorkflowSteps([...stepTemplates]);

      const clientRec = mapBackendResponseToClient(backendResponse);
      setActiveRecommendationResult(clientRec);
      setIsAgentRunning(false);

      // Append final agent recommendation message
      const finalMsgText = clientRec.isBudgetExceeded && clientRec.compromiseMessage
        ? clientRec.compromiseMessage
        : (backendResponse.budget
            ? `Here is your curated ${clientRec.durationDays}-day ${clientRec.destination} plan. Total estimated cost is ₹${clientRec.breakdown.totalEstimatedCost.toLocaleString()} with ₹${clientRec.breakdown.remainingBuffer.toLocaleString()} remaining in your buffer.`
            : `Here is your curated ${clientRec.durationDays}-day ${clientRec.destination} plan. Total estimated cost is ₹${clientRec.breakdown.totalEstimatedCost.toLocaleString()}.`);

      const finalAgentMsg: ChatMessage = {
        id: `msg-agent-rec-${Date.now()}`,
        sender: 'agent',
        text: finalMsgText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        recommendation: clientRec,
        isBudgetWarning: clientRec.isBudgetExceeded,
        quickPrompts: clientRec.isBudgetExceeded 
          ? [`Adjust budget for ${clientRec.destination}`, 'Reduce activity count', 'Show value stay options']
          : ['Review full itinerary', 'Show dining reservation options', 'Lock in airport transfer'],
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
