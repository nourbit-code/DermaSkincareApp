import React, { createContext, useState } from 'react';

export type Appointment = {
  patient: string;
  service: string;
  time: string;
  status: string;
  price: string;
};

export type AppointmentContextType = {
  appointments: any[];
  addAppointment: (appt: any) => void;
};


export const AppointmentContext = createContext<AppointmentContextType>({
  appointments: [],
  addAppointment: () => {},
});


export const AppointmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const addAppointment = (appointment: Appointment) => {
    setAppointments(prev => [...prev, appointment]);
  };

  return (
    <AppointmentContext.Provider value={{ appointments, addAppointment }}>
      {children}
    </AppointmentContext.Provider>
  );
};