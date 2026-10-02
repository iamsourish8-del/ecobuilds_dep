import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

interface BuildingContextType {
  activeBuilding: string | null;
  setActiveBuilding: (id: string) => void;
}

const BuildingContext = createContext<BuildingContextType | undefined>(undefined);

export const BuildingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [activeBuilding, setActiveBuildingState] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.building_ids && user.building_ids.length > 0) {
      // If Super Admin, default to global view "ALL" on login if not already set
      if (user.role === "super_admin" && !activeBuilding) {
        setActiveBuildingState("ALL");
      } else if (!activeBuilding || (activeBuilding !== "ALL" && !user.building_ids.includes(activeBuilding))) {
        setActiveBuildingState(user.building_ids[0]);
      }
    } else {
      setActiveBuildingState(null);
    }
  }, [user]);

  const setActiveBuilding = (id: string) => {
    setActiveBuildingState(id);
  };

  return (
    <BuildingContext.Provider value={{ activeBuilding, setActiveBuilding }}>
      {children}
    </BuildingContext.Provider>
  );
};

export const useBuilding = () => {
  const context = useContext(BuildingContext);
  if (!context) throw new Error("useBuilding must be used within a BuildingProvider");
  return context;
};