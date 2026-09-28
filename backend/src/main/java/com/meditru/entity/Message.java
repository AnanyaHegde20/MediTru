package com.meditru.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "messages")
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "thread_id", nullable = false)
    private Long threadId;

    @Column(name = "sender_id", nullable = false)
    private String senderId;

    @Column(name = "sender_name")
    private String senderName;

    @Column(nullable = false, length = 2000)
    private String text;

    @Column(name = "created_at")
    private long createdAt;

    public Message() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getThreadId() { return threadId; }
    public void setThreadId(Long threadId) { this.threadId = threadId; }
    public String getSenderId() { return senderId; }
    public void setSenderId(String senderId) { this.senderId = senderId; }
    public String getSenderName() { return senderName; }
    public void setSenderName(String senderName) { this.senderName = senderName; }
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
    public long getCreatedAt() { return createdAt; }
    public void setCreatedAt(long createdAt) { this.createdAt = createdAt; }
}
