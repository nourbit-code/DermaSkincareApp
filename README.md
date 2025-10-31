#  Clinic Management System 
The **Clinic Management System** is a cross-platform   Web application developed to streamline clinic operations and enhance the coordination between doctors and receptionists.  
It ensures efficient management of appointments, patient history, and diagnosis records — all while maintaining ethical standards and data integrity.  

---

##  Key Features

###  Doctor Module
- Interactive **Dashboard** displaying today’s scheduled patients and appointment statuses  
- Individual **Diagnosis Pages** for entering medical notes, prescriptions, and medications  
- **Medication Box** with integrated search functionality, ready for Egyptian Medication Database connection  
- Access to full **Patient History** and prior visit summaries  

###  Receptionist Module
- Comprehensive **Patient Directory** with searchable records  
- **Appointment Booking**, **Payment Tracking**, and **Patient Registration** functionalities  
- Enforced **edit-only policy** — ensuring ethical handling of medical data with no deletions  

###  General Features
- Organized structure with separate dashboards for each role  
- Clear and responsive layout for smooth navigation  
- Reusable sidebar and modular components for scalability  

---

## 🧩 System Design

###  Entity-Relationship Diagram (ERD)
The ERD defines the relationships among key entities such as:
- **Patients**, **Doctors**, **Appointments**, **Diagnoses**, and **Medications**  
- Designed to support future modules like billing, lab reports, and analytics  

*(See `clinic_ERD.drawio.pdf` for full database schema.)*

###  Wireframe Design
The system interface follows a carefully structured wireframe to ensure clarity, simplicity, and role-based organization.  
Each screen layout was designed to minimize navigation time and optimize user experience.  

*(See `clinic_wireframe.pdf` for visual layout details.)*

---

##  Technology Overview

| Layer | Description |
|--------|--------------|
| **Frontend** | Cross-platform mobile application |
| **Routing** | Organized by role-based paths |
| **Language** | TypeScript |
| **Styling** | Custom native styling for unified branding |
| **Data Layer** | Dummy JSON arrays (planned integration with database) |
| **Future Integration** | Egyptian Medication Database |

---

## 📂 Project Architecture

```
app/
 ├── doctor/
 │   ├── home.tsx               → Doctor landing page (Dashboard)
 │   ├── dashboard.tsx          → Doctor’s statistics and patient list
 │   ├── patient-history.tsx    → Searchable list of all patients
 │   ├── diagnosis/[id].tsx     → Diagnosis entry and medication selection
 │   └── patient-page/[id].tsx  → Full patient record view
 │
 ├── receptionist/
 │   ├── dashboard.tsx
 │   ├── patients-directory.tsx
 │   ├── add-patient.tsx
 │   └── payments.tsx
 │
 ├── components/
 │   ├── DoctorSidebar.tsx
 │   ├── ReceptionistSidebar.tsx
 │   └── Shared UI Components
 │
 └── assets/
     └── Icons, images, and visual elements
```

---

## ⚙️ Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/clinic-management-system.git
   cd clinic-management-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the application**
   ```bash
   npx expo start
   ```

4. **Access the app**
   - Scan the QR code with Expo Go (on your mobile), or  
   - Run on an emulator (`i` for iOS / `a` for Android)

---

##  Planned Enhancements

- Integration with **Egyptian Medication Database** for real-time prescription data  
- Secure **authentication and role-based login system**  
- **Cloud data storage** for patient and appointment records  
- **Analytics Dashboard** for performance and patient flow insights  
- **Internal messaging** between clinic staff  

---

## 💡 Ethical Data Policy
This application strictly follows an **edit-only data principle**, ensuring that medical records cannot be deleted.  
This approach preserves data accuracy and aligns with clinical and ethical standards of healthcare information management.  

---

##  Developed By

**Nour Sameh   --     sarah gado**  
**Nadeen khaled    --    menna adel**
**--youssef adel**

Biomedical Informatics Students — Nile University  
Focused on **AI, Healthcare Security, and Clinical Software Systems**.  

---

## Documentation 
- `clinic_ERD.drawio.pdf` — Database structure and entity relationships  
- `clinic_wireframe.pdf` — Interface wireframe and navigation flow  
- `clinical_workflow.pdf` — System workflow outlining data and process flow  

---

## 🌟 Preview
📷 *Screenshots and live demo coming soon.*
<img width="1899" height="898" alt="image" src="https://github.com/user-attachments/assets/350c3a96-c669-47ab-83e4-86a5db4bf0f6" />
<img width="1887" height="890" alt="image" src="https://github.com/user-attachments/assets/42a442dd-8a19-41b1-bc11-9442a1038eae" />



