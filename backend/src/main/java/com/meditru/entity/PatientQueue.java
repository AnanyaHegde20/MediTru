package com.meditru.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "patient_queue")
public class PatientQueue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String doctorId;

    @Column(nullable = false)
    private String patientName;

    private String patientAvatar;
    private Integer age;
    private String time;
    private String waitTime;
    private String reason;
    private String status;
    private String room;

    public PatientQueue() {}

    public PatientQueue(String doctorId, String patientName) {
        this.doctorId = doctorId;
        this.patientName = patientName;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getDoctorId() { return doctorId; }
    public void setDoctorId(String doctorId) { this.doctorId = doctorId; }
    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }
    public String getPatientAvatar() { return patientAvatar; }
    public void setPatientAvatar(String patientAvatar) { this.patientAvatar = patientAvatar; }
    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }
    public String getTime() { return time; }
    public void setTime(String time) { this.time = time; }
    public String getWaitTime() { return waitTime; }
    public void setWaitTime(String waitTime) { this.waitTime = waitTime; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getRoom() { return room; }
    public void setRoom(String room) { this.room = room; }
}
