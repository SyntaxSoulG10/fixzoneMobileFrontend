import React, { createContext, useContext, useState } from 'react';
import { MOCK_VEHICLES, Vehicle } from '../constants/mock_data';

interface UserData {
  name: string;
  mobile: string;
  email: string;
  profileImage: string | null;
  vehicles: Vehicle[];
}

interface UserContextType {
  user: UserData;
  updateUser: (newData: Partial<UserData>) => void;
  addVehicle: (vehicle: Vehicle) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData>({
    name: 'John Doe',
    mobile: '+94 77 123 4567',
    email: 'john.doe@example.com',
    profileImage: null,
    vehicles: MOCK_VEHICLES,
  });

  const updateUser = (newData: Partial<UserData>) => {
    setUser(prev => ({ ...prev, ...newData }));
  };

  const addVehicle = (vehicle: Vehicle) => {
    setUser(prev => ({ ...prev, vehicles: [vehicle, ...prev.vehicles] }));
  };

  return (
    <UserContext.Provider value={{ user, updateUser, addVehicle }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
