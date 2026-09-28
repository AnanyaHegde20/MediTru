package com.meditru.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "message_threads")
public class MessageThread {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String subject;

    @Column(name = "user1_id")
    private String user1Id;
    @Column(name = "user1_name")
    private String user1Name;
    @Column(name = "user1_avatar")
    private String user1Avatar;
    @Column(name = "user1_role_label")
    private String user1RoleLabel;

    @Column(name = "user2_id")
    private String user2Id;
    @Column(name = "user2_name")
    private String user2Name;
    @Column(name = "user2_avatar")
    private String user2Avatar;
    @Column(name = "user2_role_label")
    private String user2RoleLabel;

    @Column(name = "user1_last_read_id")
    private Long user1LastReadId = 0L;
    @Column(name = "user2_last_read_id")
    private Long user2LastReadId = 0L;

    @Column(name = "updated_at")
    private long updatedAt;

    public MessageThread() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getUser1Id() { return user1Id; }
    public void setUser1Id(String user1Id) { this.user1Id = user1Id; }
    public String getUser1Name() { return user1Name; }
    public void setUser1Name(String user1Name) { this.user1Name = user1Name; }
    public String getUser1Avatar() { return user1Avatar; }
    public void setUser1Avatar(String user1Avatar) { this.user1Avatar = user1Avatar; }
    public String getUser1RoleLabel() { return user1RoleLabel; }
    public void setUser1RoleLabel(String user1RoleLabel) { this.user1RoleLabel = user1RoleLabel; }
    public String getUser2Id() { return user2Id; }
    public void setUser2Id(String user2Id) { this.user2Id = user2Id; }
    public String getUser2Name() { return user2Name; }
    public void setUser2Name(String user2Name) { this.user2Name = user2Name; }
    public String getUser2Avatar() { return user2Avatar; }
    public void setUser2Avatar(String user2Avatar) { this.user2Avatar = user2Avatar; }
    public String getUser2RoleLabel() { return user2RoleLabel; }
    public void setUser2RoleLabel(String user2RoleLabel) { this.user2RoleLabel = user2RoleLabel; }
    public Long getUser1LastReadId() { return user1LastReadId; }
    public void setUser1LastReadId(Long user1LastReadId) { this.user1LastReadId = user1LastReadId; }
    public Long getUser2LastReadId() { return user2LastReadId; }
    public void setUser2LastReadId(Long user2LastReadId) { this.user2LastReadId = user2LastReadId; }
    public long getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(long updatedAt) { this.updatedAt = updatedAt; }
}
