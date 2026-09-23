package com.meditru.seed;

import com.meditru.entity.*;
import com.meditru.entity.User.UserRole;
import com.meditru.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;

@Component
@Profile("!test")
public class DataSeeder implements CommandLineRunner {

    private final UserRepository users;
    private final DoctorRepository doctors;
    private final AppointmentRepository appointments;
    private final LabReportRepository labReports;
    private final PrescriptionRepository prescriptions;
    private final PatientQueueRepository patientQueue;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository users, DoctorRepository doctors,
                      AppointmentRepository appointments, LabReportRepository labReports,
                      PrescriptionRepository prescriptions, PatientQueueRepository patientQueue,
                      PasswordEncoder passwordEncoder) {
        this.users = users;
        this.doctors = doctors;
        this.appointments = appointments;
        this.labReports = labReports;
        this.prescriptions = prescriptions;
        this.patientQueue = patientQueue;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (users.count() > 0) return;

        // ── Users ──────────────────────────────────────────
        User patient = new User("Priya Sharma", "priya.sharma@example.com", passwordEncoder.encode("password"), UserRole.patient);
        patient.setAvatar("https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80");
        patient.setBadge("Patient");
        patient.setAge(29);
        patient.setGender("Female");
        patient.setBloodGroup("O+");
        patient.setPhone("+1 (555) 382-9012");
        patient.setAllergies("Penicillin,Peanuts");
        patient.setMedicalCondition("Mild Hypertension, Seasonal Rhinitis");
        users.save(patient);

        User doctor = new User("Dr. Rajesh Kumar", "rajesh.kumar@medicare.health", passwordEncoder.encode("password"), UserRole.doctor);
        doctor.setAvatar("https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80");
        doctor.setBadge("Senior Cardiologist");
        doctor.setPhone("+1 (555) 902-1144");
        users.save(doctor);

        User admin = new User("Sarah Jenkins (Admin)", "admin@medicare.health", passwordEncoder.encode("password"), UserRole.admin);
        admin.setAvatar("https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80");
        admin.setBadge("System Administrator");
        admin.setPhone("+1 (555) 789-0011");
        users.save(admin);

        // ── Doctors ────────────────────────────────────────
        String slotsJson = "{\"morning\":[\"09:00 AM\",\"10:00 AM\",\"11:30 AM\"],\"afternoon\":[\"02:30 PM\",\"04:00 PM\"],\"evening\":[\"05:30 PM\",\"06:15 PM\"]}";

        Doctor d1 = new Doctor("Dr. Sarah Jenkins", "Dermatology", new BigDecimal("4.8"), 142, 12, new BigDecimal("80"));
        d1.setNextAvailable("Tomorrow, 10:00 AM");
        d1.setAvatar("https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&auto=format&fit=crop&q=80");
        d1.setBio("Board-certified dermatologist specializing in clinical dermatology, skin cancer screenings, and advanced cosmetic therapies.");
        d1.setHospital("MediTru Central Hospital, San Francisco");
        d1.setEducation("MD from Stanford University School of Medicine");
        d1.setSlotsJson(slotsJson);
        doctors.save(d1);

        Doctor d2 = new Doctor("Dr. Alan Stone", "Cardiology", new BigDecimal("4.9"), 230, 15, new BigDecimal("120"));
        d2.setNextAvailable("Tomorrow, 10:00 AM");
        d2.setAvatar("https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80");
        d2.setBio("Interventional cardiologist with deep expertise in cardiovascular health, hypertension management, and preventative cardiology.");
        d2.setHospital("Heart & Vascular Pavilion, Suite 402");
        d2.setEducation("MD from Johns Hopkins University");
        d2.setSlotsJson("{\"morning\":[\"09:30 AM\",\"10:00 AM\",\"11:00 AM\"],\"afternoon\":[\"02:00 PM\",\"03:30 PM\",\"04:45 PM\"],\"evening\":[\"06:00 PM\"]}");
        doctors.save(d2);

        Doctor d3 = new Doctor("Dr. Robert Mercer", "General Medicine", new BigDecimal("4.7"), 98, 8, new BigDecimal("65"));
        d3.setNextAvailable("Tomorrow, 10:00 AM");
        d3.setAvatar("https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=200&auto=format&fit=crop&q=80");
        d3.setBio("Comprehensive primary care physician dedicated to routine checkups, chronic condition management, and diagnostic medicine.");
        d3.setHospital("Bayfront Family Practice Clinic");
        d3.setEducation("MD from Harvard Medical School");
        d3.setSlotsJson("{\"morning\":[\"08:30 AM\",\"10:00 AM\",\"11:15 AM\"],\"afternoon\":[\"01:30 PM\",\"03:00 PM\"],\"evening\":[\"05:00 PM\",\"06:00 PM\"]}");
        doctors.save(d3);

        Doctor d4 = new Doctor("Dr. Emily Taylor", "Neurology", new BigDecimal("4.9"), 185, 14, new BigDecimal("140"));
        d4.setNextAvailable("Tomorrow, 02:30 PM");
        d4.setAvatar("https://images.unsplash.com/photo-1594824813590-754665427b36?w=200&auto=format&fit=crop&q=80");
        d4.setBio("Specialist in neurological disorders, migraine treatments, sleep medicine, and neuropathic wellness programs.");
        d4.setHospital("Pacific Neuroscience Institute");
        d4.setEducation("MD from Columbia University");
        d4.setSlotsJson("{\"morning\":[\"10:30 AM\",\"11:45 AM\"],\"afternoon\":[\"02:30 PM\",\"03:45 PM\",\"04:30 PM\"],\"evening\":[\"05:45 PM\"]}");
        doctors.save(d4);

        Doctor d5 = new Doctor("Dr. Arjan Dev", "Orthopedics", new BigDecimal("4.6"), 114, 10, new BigDecimal("95"));
        d5.setNextAvailable("Tomorrow, 02:30 PM");
        d5.setAvatar("https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&auto=format&fit=crop&q=80");
        d5.setBio("Orthopedic and sports medicine surgeon specializing in joint mobility, arthroscopy, and spine rehabilitation.");
        d5.setHospital("Metro Orthopedic & Sports Clinic");
        d5.setEducation("MS Orthopedics, MD from University of Pennsylvania");
        d5.setSlotsJson("{\"morning\":[\"09:00 AM\",\"11:00 AM\"],\"afternoon\":[\"02:30 PM\",\"04:00 PM\"],\"evening\":[\"05:15 PM\"]}");
        doctors.save(d5);

        Doctor d6 = new Doctor("Dr. Lisa Wong", "Pediatrics", new BigDecimal("4.8"), 160, 9, new BigDecimal("75"));
        d6.setNextAvailable("Tomorrow, 02:30 PM");
        d6.setAvatar("https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=200&auto=format&fit=crop&q=80");
        d6.setBio("Dedicated pediatrician focused on child development, vaccination schedules, infant nutrition, and adolescent health.");
        d6.setHospital("Children's Wellness Center");
        d6.setEducation("MD from UCSF School of Medicine");
        d6.setSlotsJson("{\"morning\":[\"09:15 AM\",\"10:45 AM\"],\"afternoon\":[\"02:30 PM\",\"03:30 PM\",\"04:45 PM\"],\"evening\":[\"05:30 PM\"]}");
        doctors.save(d6);

        // ── Appointments (for patient) ─────────────────────
        String patientAvatar = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80";
        String stoneAvatar = "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80";
        String jenkinsAvatar = "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&auto=format&fit=crop&q=80";
        String mercerAvatar = "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=200&auto=format&fit=crop&q=80";
        String kumarAvatar = "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80";

        Appointment a1 = new Appointment();
        a1.setPatientId("1");
        a1.setPatientName("Priya Sharma");
        a1.setPatientAvatar(patientAvatar);
        a1.setDoctorId("2");
        a1.setDoctorName("Dr. Alan Stone");
        a1.setSpecialty("Cardiology");
        a1.setDoctorAvatar(stoneAvatar);
        a1.setDate("Oct 24, 2024");
        a1.setTime("10:00 AM");
        a1.setStatus("Confirmed");
        a1.setType("Cardiology Checkup");
        a1.setDuration("30m");
        a1.setNotes("Follow-up on lipid panel & BP tracking.");
        a1.setRoom("Room 304");
        appointments.save(a1);

        Appointment a2 = new Appointment();
        a2.setPatientId("1");
        a2.setPatientName("Priya Sharma");
        a2.setPatientAvatar(patientAvatar);
        a2.setDoctorId("1");
        a2.setDoctorName("Dr. Sarah Jenkins");
        a2.setSpecialty("Dermatology");
        a2.setDoctorAvatar(jenkinsAvatar);
        a2.setDate("Nov 02, 2024");
        a2.setTime("02:30 PM");
        a2.setStatus("Pending");
        a2.setType("Annual Skin Assessment");
        a2.setDuration("20m");
        a2.setNotes("Routine mole check and dry skin consultation.");
        a2.setRoom("Room 108");
        appointments.save(a2);

        Appointment a3 = new Appointment();
        a3.setPatientId("1");
        a3.setPatientName("Priya Sharma");
        a3.setPatientAvatar(patientAvatar);
        a3.setDoctorId("3");
        a3.setDoctorName("Dr. Robert Mercer");
        a3.setSpecialty("General Medicine");
        a3.setDoctorAvatar(mercerAvatar);
        a3.setDate("Dec 14, 2024");
        a3.setTime("09:00 AM");
        a3.setStatus("Confirmed");
        a3.setType("Comprehensive Annual Wellness Exam");
        a3.setDuration("45m");
        a3.setNotes("Full preventative health checkup and routine blood work.");
        a3.setRoom("Suite 201");
        appointments.save(a3);

        // ── Lab Reports ────────────────────────────────────
        LabReport lr1 = new LabReport("1", "Lipid Panel", "Lipid");
        lr1.setDate("Oct 22, 2024");
        lr1.setDoctorName("Dr. Alan Stone");
        lr1.setDoctorSpecialty("Cardiology");
        lr1.setStatus("Normal");
        lr1.setFileSize("1.4 MB");
        lr1.setValuesJson("[{\"parameter\":\"Total Cholesterol\",\"value\":\"184\",\"unit\":\"mg/dL\",\"referenceRange\":\"125 - 200\",\"status\":\"Normal\"},{\"parameter\":\"HDL (Good) Cholesterol\",\"value\":\"58\",\"unit\":\"mg/dL\",\"referenceRange\":\"> 50\",\"status\":\"Normal\"},{\"parameter\":\"LDL (Bad) Cholesterol\",\"value\":\"102\",\"unit\":\"mg/dL\",\"referenceRange\":\"< 100\",\"status\":\"Normal\"},{\"parameter\":\"Triglycerides\",\"value\":\"120\",\"unit\":\"mg/dL\",\"referenceRange\":\"< 150\",\"status\":\"Normal\"}]");
        lr1.setAiSummaryJson("{\"overview\":\"Overall cardiovascular lipid health is well within standard reference intervals.\",\"keyFindings\":[\"Total cholesterol of 184 mg/dL is optimal.\",\"HDL protective level is healthy at 58 mg/dL.\"],\"attentionItems\":[\"LDL is slightly bordering near the target threshold.\"],\"recommendations\":[\"Continue regular 30 minutes daily brisk walks.\",\"Next routine lipid screening in 12 months.\"]}");
        labReports.save(lr1);

        LabReport lr2 = new LabReport("1", "CBC with Differential", "Hematology");
        lr2.setDate("Oct 18, 2024");
        lr2.setDoctorName("Dr. Robert Mercer");
        lr2.setDoctorSpecialty("General Medicine");
        lr2.setStatus("Abnormal");
        lr2.setFileSize("2.1 MB");
        lr2.setValuesJson("[{\"parameter\":\"WBC\",\"value\":\"7.8\",\"unit\":\"x10^3/uL\",\"referenceRange\":\"4.5 - 11.0\",\"status\":\"Normal\"},{\"parameter\":\"Hemoglobin\",\"value\":\"11.2\",\"unit\":\"g/dL\",\"referenceRange\":\"12.0 - 15.5\",\"status\":\"Low\"},{\"parameter\":\"Hematocrit\",\"value\":\"34.1\",\"unit\":\"%\",\"referenceRange\":\"37.0 - 48.0\",\"status\":\"Low\"}]");
        lr2.setAiSummaryJson("{\"overview\":\"Mild microcytic anemia indicators detected.\",\"keyFindings\":[\"WBC and Platelets are healthy.\"],\"attentionItems\":[\"Hemoglobin is below optimal range.\"],\"recommendations\":[\"Discuss iron supplementation with Dr. Mercer.\",\"Incorporate iron-rich foods.\"]}");
        labReports.save(lr2);

        // ── Prescriptions ──────────────────────────────────
        Prescription rx1 = new Prescription("1", "Atorvastatin");
        rx1.setDosage("20 mg");
        rx1.setFrequency("Once daily at bedtime");
        rx1.setDoctorName("Dr. Alan Stone");
        rx1.setSpecialty("Cardiology");
        rx1.setStartDate("Oct 01, 2024");
        rx1.setEndDate("Jan 01, 2025");
        rx1.setRefillsRemaining(2);
        rx1.setTotalRefills(4);
        rx1.setInstructions("Take with a glass of water. Avoid large quantities of grapefruit juice.");
        rx1.setStatus("Active");
        rx1.setPharmacy("Walgreens Pharmacy #4218, Market St.");
        prescriptions.save(rx1);

        Prescription rx2 = new Prescription("1", "Lisinopril");
        rx2.setDosage("10 mg");
        rx2.setFrequency("Once daily in the morning");
        rx2.setDoctorName("Dr. Alan Stone");
        rx2.setSpecialty("Cardiology");
        rx2.setStartDate("Sep 15, 2024");
        rx2.setEndDate("Dec 15, 2024");
        rx2.setRefillsRemaining(1);
        rx2.setTotalRefills(3);
        rx2.setInstructions("For blood pressure maintenance. Monitor blood pressure weekly.");
        rx2.setStatus("Active");
        rx2.setPharmacy("Walgreens Pharmacy #4218, Market St.");
        prescriptions.save(rx2);

        Prescription rx3 = new Prescription("1", "Ferrous Sulfate (Iron)");
        rx3.setDosage("325 mg (65 mg elemental iron)");
        rx3.setFrequency("Once daily with Vitamin C");
        rx3.setDoctorName("Dr. Robert Mercer");
        rx3.setSpecialty("General Medicine");
        rx3.setStartDate("Oct 19, 2024");
        rx3.setEndDate("Nov 19, 2024");
        rx3.setRefillsRemaining(3);
        rx3.setTotalRefills(3);
        rx3.setInstructions("Take with orange juice to maximize absorption.");
        rx3.setStatus("Active");
        rx3.setPharmacy("CVS Pharmacy, Pine Avenue");
        prescriptions.save(rx3);

        // ── Patient Queue ──────────────────────────────────
        PatientQueue q1 = new PatientQueue("1", "Rahul Sharma");
        q1.setPatientAvatar("https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80");
        q1.setAge(42);
        q1.setTime("11:15 AM");
        q1.setWaitTime("10 min");
        q1.setReason("Follow-up on Holter Monitor");
        q1.setStatus("Waiting");
        q1.setRoom("Waiting Lounge A");
        patientQueue.save(q1);

        PatientQueue q2 = new PatientQueue("1", "Sneha Reddy");
        q2.setPatientAvatar("https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80");
        q2.setAge(36);
        q2.setTime("11:30 AM");
        q2.setWaitTime("In therapy room");
        q2.setReason("Echocardiogram examination");
        q2.setStatus("In Progress");
        q2.setRoom("Room 2");
        patientQueue.save(q2);

        PatientQueue q3 = new PatientQueue("1", "Kunal Gupta");
        q3.setPatientAvatar("https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80");
        q3.setAge(51);
        q3.setTime("11:45 AM");
        q3.setWaitTime("Ready");
        q3.setReason("Post-op stent consultation");
        q3.setStatus("Waiting");
        q3.setRoom("Room 3");
        patientQueue.save(q3);

        System.out.println("MediTru DB seeded: 3 users, 6 doctors, 3 appointments, 2 lab reports, 3 prescriptions, 3 queue items");
    }
}
