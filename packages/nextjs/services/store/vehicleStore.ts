import { create } from "zustand";

interface Vehicle {
  vin: string;
  name: string;
  make: string;
  model: string;
  image: string;
}

interface VehicleStore {
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  customVin: string;
  isLoading: boolean;
  error: string | null;
  setVehicles: (vehicles: Vehicle[]) => void;
  setSelectedVehicle: (vehicle: Vehicle | null) => void;
  setCustomVin: (vin: string) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useVehicleStore = create<VehicleStore>((set) => ({
  vehicles: [],
  selectedVehicle: null,
  customVin: "",
  isLoading: true,
  error: null,
  setVehicles: (vehicles) => set({ vehicles }),
  setSelectedVehicle: (vehicle) => set({ selectedVehicle: vehicle }),
  setCustomVin: (vin) => set({ customVin: vin }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
})); 