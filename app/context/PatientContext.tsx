import React, { createContext, useState, ReactNode } from "react";

export type Patient = {
  name: string;
  gender: string;
  age: number;
  phone: string;
};

type PatientsContextType = {
  patients: Patient[];
  updatePatient: (index: number, updated: Patient) => void;
};

export const PatientsContext = createContext<PatientsContextType>({
  patients: [],
  updatePatient: () => {},
});

export const PatientsProvider = ({ children }: { children: ReactNode }) => {
  const [patients, setPatients] = useState<Patient[]>([
    { name: "Sara Ahmed", gender: "Female", age: 28, phone: "01012345678" },
    { name: "Mona Ali", gender: "Female", age: 35, phone: "01098765432" },
    { name: "Omar Hassan", gender: "Male", age: 42, phone: "01122334455" },
    { name: "Laila Mostafa", gender: "Female", age: 31, phone: "01234567890" },
  ]);

  const updatePatient = (index: number, updated: Patient) => {
    const newPatients = [...patients];
    newPatients[index] = updated;
    setPatients(newPatients);
  };

  return (
    <PatientsContext.Provider value={{ patients, updatePatient }}>
      {children}
    </PatientsContext.Provider>
  );
};
