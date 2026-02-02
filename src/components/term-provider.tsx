"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";

import { getTerms } from "@/actions/terms";

export interface Term {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

interface TermContextValue {
  terms: Term[];
  selectedTerm: Term | null;
  activeTerm: Term | null;
  setSelectedTermId: (termId: string) => void;
  isHistoricView: boolean;
  isLoading: boolean;
  refreshTerms: () => Promise<void>;
}

const TermContext = createContext<TermContextValue | null>(null);

const STORAGE_KEY = "selectedTermId";

interface TermProviderProps {
  children: ReactNode;
  initialTerms?: Term[];
}

export function TermProvider({ children, initialTerms }: TermProviderProps) {
  const [terms, setTerms] = useState<Term[]>(initialTerms ?? []);
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(initialTerms === undefined);

  const activeTerm = terms.find((t) => t.isActive) ?? null;
  const selectedTerm = terms.find((t) => t.id === selectedTermId) ?? activeTerm;
  const isHistoricView =
    selectedTerm !== null &&
    activeTerm !== null &&
    selectedTerm.id !== activeTerm.id;

  const refreshTerms = useCallback(async () => {
    try {
      const result = await getTerms();

      const termsData = result.terms.map((t) => ({
        id: t.id,
        name: t.name,
        startDate: new Date(t.startDate),
        endDate: new Date(t.endDate),
        isActive: t.isActive,
      }));

      setTerms(termsData);
    } catch (error) {
      console.error("Failed to fetch terms:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize selected term from localStorage
  useEffect(() => {
    // Only run on client-side and once
    if (typeof window === "undefined") {
      return;
    }

    const storedTermId = localStorage.getItem(STORAGE_KEY);
    if (storedTermId !== null) {
      // eslint-disable-next-line react-you-might-not-need-an-effect/no-initialize-state
      setSelectedTermId(storedTermId);
    }
  }, []);

  // Fetch terms if not provided initially
  useEffect(() => {
    if (initialTerms === undefined) {
      void refreshTerms();
    }
  }, [initialTerms, refreshTerms]);

  const handleSetSelectedTermId = useCallback((termId: string) => {
    setSelectedTermId(termId);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, termId);
    }
  }, []);

  return (
    <TermContext.Provider
      value={{
        terms,
        selectedTerm,
        activeTerm,
        setSelectedTermId: handleSetSelectedTermId,
        isHistoricView,
        isLoading,
        refreshTerms,
      }}
    >
      {children}
    </TermContext.Provider>
  );
}

export function useTerm() {
  const context = useContext(TermContext);
  if (context === null) {
    throw new Error("useTerm must be used within a TermProvider");
  }
  return context;
}
