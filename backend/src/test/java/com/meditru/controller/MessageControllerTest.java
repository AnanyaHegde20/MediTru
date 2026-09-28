package com.meditru.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.meditru.entity.Message;
import com.meditru.entity.MessageThread;
import com.meditru.entity.User;
import com.meditru.repository.MessageRepository;
import com.meditru.repository.MessageThreadRepository;
import com.meditru.repository.UserRepository;
import com.meditru.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class MessageControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MessageThreadRepository threadRepository;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private JwtService jwtService;

    private String patientToken;
    private String otherPatientToken;
    private String doctorToken;
    private String adminToken;
    private User patient;
    private User doctor;
    private Long threadId;

    @BeforeEach
    void setUp() {
        messageRepository.deleteAll();
        threadRepository.deleteAll();
        userRepository.deleteAll();

        patient = userRepository.save(
                new User("Pat Patient", "pat-msg@example.com", "x", User.UserRole.patient));
        User other = userRepository.save(
                new User("Other Patient", "other-msg@example.com", "x", User.UserRole.patient));
        doctor = userRepository.save(
                new User("Doc Doctor", "doc-msg@example.com", "x", User.UserRole.doctor));
        User admin = userRepository.save(
                new User("Adm Admin", "adm-msg@example.com", "x", User.UserRole.admin));

        patientToken = jwtService.generateToken(patient);
        otherPatientToken = jwtService.generateToken(other);
        doctorToken = jwtService.generateToken(doctor);
        adminToken = jwtService.generateToken(admin);

        MessageThread thread = new MessageThread();
        thread.setUser1Id(String.valueOf(patient.getId()));
        thread.setUser1Name(patient.getName());
        thread.setUser1Avatar("");
        thread.setUser1RoleLabel("Patient");
        thread.setUser2Id(String.valueOf(doctor.getId()));
        thread.setUser2Name(doctor.getName());
        thread.setUser2Avatar("");
        thread.setUser2RoleLabel("Doctor");
        thread.setUser1LastReadId(0L);
        thread.setUser2LastReadId(0L);
        thread.setUpdatedAt(System.currentTimeMillis());
        thread = threadRepository.save(thread);
        threadId = thread.getId();

        Message message = new Message();
        message.setThreadId(threadId);
        message.setSenderId(String.valueOf(doctor.getId()));
        message.setSenderName(doctor.getName());
        message.setText("Please bring your BP log.");
        message.setCreatedAt(System.currentTimeMillis());
        messageRepository.save(message);
    }

    private ResultActions listThreads(String token) throws Exception {
        return mockMvc.perform(get("/api/messages/threads")
                .header("Authorization", "Bearer " + token));
    }

    private ResultActions send(String token, String text) throws Exception {
        return mockMvc.perform(post("/api/messages/threads/" + threadId + "/messages")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("text", text))));
    }

    private ResultActions createThread(String token, Map<String, Object> body) throws Exception {
        return mockMvc.perform(post("/api/messages/threads")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)));
    }

    @Test
    void participantListsOwnThreadsWithPartnerAndUnread() throws Exception {
        listThreads(patientToken)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].partnerName").value("Doc Doctor"))
                .andExpect(jsonPath("$[0].unread").value(1))
                .andExpect(jsonPath("$[0].messages.length()").value(1))
                .andExpect(jsonPath("$[0].messages[0].senderId").value(String.valueOf(doctor.getId())));
    }

    @Test
    void nonParticipantSeesNoThreads() throws Exception {
        listThreads(otherPatientToken)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void adminOversightSeesAllThreads() throws Exception {
        MessageThread other = new MessageThread();
        other.setUser1Id(String.valueOf(doctor.getId()));
        other.setUser1Name(doctor.getName());
        other.setUser1Avatar("");
        other.setUser1RoleLabel("Doctor");
        other.setUser2Id(null);
        other.setUser2Name("External Patient");
        other.setUser2Avatar("");
        other.setUser2RoleLabel("Patient");
        other.setUser1LastReadId(0L);
        other.setUser2LastReadId(0L);
        other.setUpdatedAt(System.currentTimeMillis());
        threadRepository.save(other);

        listThreads(adminToken)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void getThreadMarksMessagesRead() throws Exception {
        mockMvc.perform(get("/api/messages/threads/" + threadId)
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unread").value(0));
    }

    @Test
    void nonParticipantCannotReadThread() throws Exception {
        mockMvc.perform(get("/api/messages/threads/" + threadId)
                        .header("Authorization", "Bearer " + otherPatientToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("You are not allowed to view this thread"));
    }

    @Test
    void missingThreadReturnsError() throws Exception {
        mockMvc.perform(get("/api/messages/threads/9999")
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Message thread not found"));
    }

    @Test
    void participantCanSendMessage() throws Exception {
        send(patientToken, "Here is my BP log for the week.")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.senderId").value(String.valueOf(patient.getId())))
                .andExpect(jsonPath("$.text").value("Here is my BP log for the week."));

        listThreads(patientToken)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].messages.length()").value(2));
    }

    @Test
    void sendMessageRequiresText() throws Exception {
        send(patientToken, "   ")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Message text is required"));
    }

    @Test
    void nonParticipantCannotSend() throws Exception {
        send(otherPatientToken, "Hello?")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("You are not allowed to view this thread"));
    }

    @Test
    void anonymousThreadsRejected() throws Exception {
        mockMvc.perform(get("/api/messages/threads"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void createThreadWithRegisteredPartner() throws Exception {
        createThread(patientToken, Map.of("partnerName", "Adm Admin"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.partnerName").value("Adm Admin"))
                .andExpect(jsonPath("$.unread").value(0));

        listThreads(patientToken)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void createThreadReusesExistingConversation() throws Exception {
        createThread(patientToken, Map.of("partnerName", "Doc Doctor"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(String.valueOf(threadId)));
    }

    @Test
    void createThreadWithExternalPartner() throws Exception {
        createThread(patientToken, Map.of(
                        "partnerName", "Dr. Alan Stone",
                        "partnerRoleLabel", "Cardiologist"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.partnerName").value("Dr. Alan Stone"))
                .andExpect(jsonPath("$.partnerRoleLabel").value("Cardiologist"));
    }

    @Test
    void createThreadRequiresPartnerName() throws Exception {
        createThread(patientToken, Map.of())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Partner name is required"));
    }

    @Test
    void createThreadRejectsSelf() throws Exception {
        createThread(patientToken, Map.of("partnerName", "Pat Patient"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("You cannot message yourself"));
    }
}
