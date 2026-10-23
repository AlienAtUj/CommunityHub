import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import {
  Incident,
  Resource,
  Alert,
  IncidentType,
  IncidentStatus,
  ScheduledOutage,
  SEED_INCIDENTS,
  SEED_RESOURCES,
  SEED_SCHEDULED_OUTAGES,
  ACTIVE_ALERT,
} from "../lib/data";

export interface ToastMessage {
  id: string;
  variant: "success" | "error" | "info";
  message: string;
}

interface DataContextValue {
  incidents: Incident[];
  scheduledOutages: ScheduledOutage[];
  toggleOutageReminder: (id: string) => void;
  resources: Resource[];
  activeAlert: Alert | null;
  dismissAlert: () => void;
  toast: ToastMessage | null;
  showToast: (message: string, variant?: "success" | "error" | "info") => void;
  dismissToast: () => void;
  submitReport: (report: {
    type: IncidentType;
    location: string;
    landmark?: string;
    description?: string;
  }) => string;
  updateIncidentStatus: (id: string, status: IncidentStatus, eta?: string) => void;
  ngoOffers: Record<string, { provide: string; quantity: string; eta: string }>;
  submitNgoOffer: (type: IncidentType, details: { provide: string; quantity: string; eta: string }) => void;
  selectedIncidentId: string | null;
  setSelectedIncidentId: (id: string | null) => void;
  isReportOpen: boolean;
  setIsReportOpen: (open: boolean) => void;
  pathname: string;
  navigate: (to: string) => void;
  visitedScreens: Record<string, boolean>;
  markScreenVisited: (screen: string) => void;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [incidents, setIncidents] = useState<Incident[]>(SEED_INCIDENTS);
  const [scheduledOutages, setScheduledOutages] = useState<ScheduledOutage[]>(
    SEED_SCHEDULED_OUTAGES
  );
  const [resources] = useState<Resource[]>(SEED_RESOURCES);
  const [activeAlert, setActiveAlert] = useState<Alert | null>(ACTIVE_ALERT);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [ngoOffers, setNgoOffers] = useState<
    Record<string, { provide: string; quantity: string; eta: string }>
  >({});
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(() => {
    return typeof window !== "undefined" && window.location.pathname === "/report";
  });
  const [pathname, setPathname] = useState<string>(() => {
    if (typeof window === "undefined") return "/";
    return window.location.pathname === "/report" ? "/" : window.location.pathname || "/";
  });
  const [visitedScreens, setVisitedScreens] = useState<Record<string, boolean>>({});

  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback(
    (message: string, variant: "success" | "error" | "info" = "success") => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
      const id = `TOAST-${Date.now()}`;
      setToast({ id, variant, message });
      toastTimerRef.current = window.setTimeout(() => {
        setToast(null);
      }, 3000);
    },
    []
  );

  const dismissToast = useCallback(() => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    setToast(null);
  }, []);

  const dismissAlert = useCallback(() => {
    setActiveAlert(null);
  }, []);

  const toggleOutageReminder = useCallback(
    (id: string) => {
      setScheduledOutages((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          const nextState = !item.reminderSet;
          showToast(
            nextState
              ? `Reminder set for ${item.day} (${item.timeSlot}). We'll alert you on the day.`
              : `Reminder removed for ${item.title}.`,
            nextState ? "success" : "info"
          );
          return { ...item, reminderSet: nextState };
        })
      );
    },
    [showToast]
  );

  const navigate = useCallback((to: string) => {
    if (to === "/report") {
      setIsReportOpen(true);
      window.history.pushState({}, "", "/report");
      return;
    }
    setIsReportOpen(false);
    setPathname(to);
    window.history.pushState({}, "", to);
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const current = window.location.pathname || "/";
      if (current === "/report") {
        setIsReportOpen(true);
      } else {
        setIsReportOpen(false);
        setPathname(current);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleSetReportOpen = useCallback(
    (open: boolean) => {
      setIsReportOpen(open);
      if (open) {
        window.history.pushState({}, "", "/report");
      } else if (window.location.pathname === "/report") {
        window.history.pushState({}, "", pathname || "/");
      }
    },
    [pathname]
  );

  const submitReport = useCallback(
    (report: {
      type: IncidentType;
      location: string;
      landmark?: string;
      description?: string;
    }) => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const mins = String(now.getMinutes()).padStart(2, "0");
      const timeStr = `${hours}:${mins}`;
      const newId = `INC-00${incidents.length + 1}`;
      const fullLocation = report.landmark?.trim()
        ? `${report.landmark.trim()}, ${report.location}`
        : report.location;

      const newIncident: Incident = {
        id: newId,
        type: report.type,
        location: fullLocation,
        affected: 45,
        confirmations: 0,
        status: "reported",
        priority:
          report.type === "flood" || report.type === "fire" ? "critical" : "high",
        facilities:
          report.description && report.description.toLowerCase().includes("clinic")
            ? ["Clinic fridge"]
            : ["Local network"],
        time: timeStr,
        description:
          report.description?.trim() ||
          "Reported by resident via CommunityPulse mobile.",
        isMine: true,
      };

      setIncidents((prev) => [newIncident, ...prev]);

      // Simulate verification after 2s
      window.setTimeout(() => {
        setIncidents((prev) =>
          prev.map((inc) =>
            inc.id === newId && inc.status === "reported"
              ? { ...inc, confirmations: 3, status: "verified" }
              : inc
          )
        );
        showToast("Confirmed by 3 neighbours.", "info");
      }, 2000);

      // Simulate assignment after 4s
      window.setTimeout(() => {
        setIncidents((prev) =>
          prev.map((inc) =>
            inc.id === newId && (inc.status === "verified" || inc.status === "reported")
              ? { ...inc, confirmations: 3, status: "assigned", eta: "19:45" }
              : inc
          )
        );
        showToast("Repair team assigned. ETA 19:45. See Updates for details.", "info");
      }, 4000);

      return newId;
    },
    [incidents.length, showToast]
  );

  const updateIncidentStatus = useCallback(
    (id: string, status: IncidentStatus, eta?: string) => {
      setIncidents((prev) =>
        prev.map((inc) =>
          inc.id === id
            ? {
                ...inc,
                status,
                eta: eta !== undefined ? eta : inc.eta || (status === "assigned" ? "19:45" : undefined),
              }
            : inc
        )
      );
    },
    []
  );

  const submitNgoOffer = useCallback(
    (type: IncidentType, details: { provide: string; quantity: string; eta: string }) => {
      setNgoOffers((prev) => ({
        ...prev,
        [type]: details,
      }));
    },
    []
  );

  const markScreenVisited = useCallback((screen: string) => {
    setVisitedScreens((prev) => (prev[screen] ? prev : { ...prev, [screen]: true }));
  }, []);

  return (
    <DataContext.Provider
      value={{
        incidents,
        scheduledOutages,
        toggleOutageReminder,
        resources,
        activeAlert,
        dismissAlert,
        toast,
        showToast,
        dismissToast,
        submitReport,
        updateIncidentStatus,
        ngoOffers,
        submitNgoOffer,
        selectedIncidentId,
        setSelectedIncidentId,
        isReportOpen,
        setIsReportOpen: handleSetReportOpen,
        pathname,
        navigate,
        visitedScreens,
        markScreenVisited,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error("useData must be used within a DataProvider");
  }
  return ctx;
}

export function usePathname(): string {
  const { pathname } = useData();
  return pathname;
}
