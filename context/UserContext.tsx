import React, { createContext, useContext, useState } from 'react';

interface UserData {
  name: string;
  mobile: string;
  email: string;
  profileImage: string | null;
}

interface UserContextType {
  user: UserData;
  updateUser: (newData: Partial<UserData>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData>({
    name: 'John Doe',
    mobile: '+94 77 123 4567',
    email: 'john.doe@example.com',
    profileImage: null,
  });

  const updateUser = (newData: Partial<UserData>) => {
    setUser(prev => ({ ...prev, ...newData }));
  };

  return (
    <UserContext.Provider value={{ user, updateUser }}>
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
