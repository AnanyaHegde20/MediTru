package com.meditru.service;

import com.meditru.dto.AuthUser;
import com.meditru.dto.CreateThreadRequest;
import com.meditru.dto.MessageResponse;
import com.meditru.dto.MessageThreadResponse;
import com.meditru.entity.Message;
import com.meditru.entity.MessageThread;
import com.meditru.entity.User;
import com.meditru.repository.MessageRepository;
import com.meditru.repository.MessageThreadRepository;
import com.meditru.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
public class MessageService {

    private static final String EXTERNAL_SENDER_ID = "external";

    private final MessageThreadRepository threads;
    private final MessageRepository messages;
    private final UserRepository users;

    public MessageService(MessageThreadRepository threads, MessageRepository messages, UserRepository users) {
        this.threads = threads;
        this.messages = messages;
        this.users = users;
    }

    public List<MessageThreadResponse> listThreads(AuthUser actor) {
        requireActor(actor);
        return threads.findAll().stream()
                .filter(t -> canView(t, actor))
                .sorted(Comparator.comparingLong(MessageThread::getUpdatedAt).reversed())
                .map(t -> toResponse(t, actor))
                .toList();
    }

    public MessageThreadResponse getThread(Long id, AuthUser actor) {
        MessageThread thread = requireVisible(id, actor);
        markRead(thread, actor);
        return toResponse(thread, actor);
    }

    public MessageResponse sendMessage(Long id, String text, AuthUser actor) {
        MessageThread thread = requireVisible(id, actor);
        if (text == null || text.isBlank()) {
            throw new IllegalArgumentException("Message text is required");
        }
        String trimmed = text.trim();
        if (trimmed.length() > 2000) {
            throw new IllegalArgumentException("Message is too long");
        }

        Message message = new Message();
        message.setThreadId(thread.getId());
        message.setSenderId(actor.id());
        message.setSenderName(actor.name());
        message.setText(trimmed);
        message.setCreatedAt(System.currentTimeMillis());
        messages.save(message);

        thread.setUpdatedAt(message.getCreatedAt());
        threads.save(thread);

        return toMessageResponse(message);
    }

    public MessageThreadResponse createThread(CreateThreadRequest request, AuthUser actor) {
        requireActor(actor);
        String partnerName = request == null || request.partnerName() == null
                ? "" : request.partnerName().trim();
        if (partnerName.isEmpty()) {
            throw new IllegalArgumentException("Partner name is required");
        }
        if (partnerName.equalsIgnoreCase(actor.name())) {
            throw new IllegalArgumentException("You cannot message yourself");
        }

        User partner = findPartner(partnerName, actor);

        Optional<MessageThread> existing = threads.findAll().stream()
                .filter(t -> isParticipant(t, actor))
                .filter(t -> matchesPartner(t, actor, partner, partnerName))
                .findFirst();
        if (existing.isPresent()) {
            return toResponse(existing.get(), actor);
        }

        String partnerId;
        String partnerLabel;
        String partnerAvatar;
        if (partner != null) {
            partnerId = String.valueOf(partner.getId());
            partnerLabel = label(partner.getBadge(), partner.getRole().name());
            partnerAvatar = partner.getAvatar() == null ? "" : partner.getAvatar();
        } else {
            partnerId = null;
            partnerLabel = request.partnerRoleLabel() == null || request.partnerRoleLabel().isBlank()
                    ? "Care Team" : request.partnerRoleLabel().trim();
            partnerAvatar = request.partnerAvatar() == null ? "" : request.partnerAvatar().trim();
        }

        MessageThread thread = new MessageThread();
        thread.setSubject(request.subject() == null || request.subject().isBlank()
                ? null : request.subject().trim());
        thread.setUser1Id(actor.id());
        thread.setUser1Name(actor.name());
        thread.setUser1Avatar(actor.avatar() == null ? "" : actor.avatar());
        thread.setUser1RoleLabel(label(actor.badge(), actor.role()));
        thread.setUser2Id(partnerId);
        thread.setUser2Name(partnerName);
        thread.setUser2Avatar(partnerAvatar);
        thread.setUser2RoleLabel(partnerLabel);
        thread.setUser1LastReadId(0L);
        thread.setUser2LastReadId(0L);
        thread.setUpdatedAt(System.currentTimeMillis());
        return toResponse(threads.save(thread), actor);
    }

    private MessageThread requireVisible(Long id, AuthUser actor) {
        requireActor(actor);
        MessageThread thread = threads.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Message thread not found"));
        if (!canView(thread, actor)) {
            throw new IllegalArgumentException("You are not allowed to view this thread");
        }
        return thread;
    }

    private void requireActor(AuthUser actor) {
        if (actor == null || actor.id() == null) {
            throw new IllegalArgumentException("Not authenticated");
        }
    }

    private boolean canView(MessageThread thread, AuthUser actor) {
        return isParticipant(thread, actor) || isAdmin(actor);
    }

    private boolean isParticipant(MessageThread thread, AuthUser actor) {
        return actor.id().equals(thread.getUser1Id()) || actor.id().equals(thread.getUser2Id());
    }

    private boolean isAdmin(AuthUser actor) {
        return "admin".equals(actor.role());
    }

    private void markRead(MessageThread thread, AuthUser actor) {
        if (actor.id().equals(thread.getUser1Id())) {
            thread.setUser1LastReadId(lastMessageId(thread.getId()));
            threads.save(thread);
        } else if (actor.id().equals(thread.getUser2Id())) {
            thread.setUser2LastReadId(lastMessageId(thread.getId()));
            threads.save(thread);
        }
    }

    private long lastMessageId(Long threadId) {
        List<Message> all = messages.findByThreadIdOrderByIdAsc(threadId);
        return all.isEmpty() ? 0L : all.get(all.size() - 1).getId();
    }

    private User findPartner(String partnerName, AuthUser actor) {
        return users.findAll().stream()
                .filter(u -> u.getName() != null && u.getName().equalsIgnoreCase(partnerName))
                .filter(u -> u.getEmail() == null || !u.getEmail().equals(actor.email()))
                .findFirst()
                .orElse(null);
    }

    private boolean matchesPartner(MessageThread thread, AuthUser actor, User partner, String partnerName) {
        boolean actorIsSide1 = actor.id().equals(thread.getUser1Id());
        String otherId = actorIsSide1 ? thread.getUser2Id() : thread.getUser1Id();
        String otherName = actorIsSide1 ? thread.getUser2Name() : thread.getUser1Name();
        if (partner != null) {
            return otherId != null && otherId.equals(String.valueOf(partner.getId()));
        }
        return otherId == null && otherName != null && otherName.equalsIgnoreCase(partnerName);
    }

    private MessageThreadResponse toResponse(MessageThread thread, AuthUser actor) {
        List<Message> threadMessages = messages.findByThreadIdOrderByIdAsc(thread.getId());
        boolean actorIsSide1 = actor.id().equals(thread.getUser1Id());
        boolean actorIsSide2 = actor.id().equals(thread.getUser2Id());

        String partnerName;
        String partnerRoleLabel;
        String partnerAvatar;
        if (actorIsSide2) {
            partnerName = thread.getUser1Name();
            partnerRoleLabel = thread.getUser1RoleLabel();
            partnerAvatar = thread.getUser1Avatar();
        } else {
            partnerName = thread.getUser2Name();
            partnerRoleLabel = thread.getUser2RoleLabel();
            partnerAvatar = thread.getUser2Avatar();
        }

        int unread = 0;
        if (actorIsSide1) {
            long lastRead = thread.getUser1LastReadId() == null ? 0L : thread.getUser1LastReadId();
            unread = countUnread(threadMessages, lastRead, actor.id());
        } else if (actorIsSide2) {
            long lastRead = thread.getUser2LastReadId() == null ? 0L : thread.getUser2LastReadId();
            unread = countUnread(threadMessages, lastRead, actor.id());
        }

        List<MessageResponse> messageResponses = threadMessages.stream()
                .map(this::toMessageResponse)
                .toList();

        return new MessageThreadResponse(
                String.valueOf(thread.getId()),
                thread.getSubject(),
                partnerName == null ? "" : partnerName,
                partnerRoleLabel == null ? "" : partnerRoleLabel,
                partnerAvatar == null ? "" : partnerAvatar,
                thread.getUpdatedAt(),
                unread,
                messageResponses
        );
    }

    private int countUnread(List<Message> threadMessages, long lastReadId, String viewerId) {
        int count = 0;
        for (Message m : threadMessages) {
            if (m.getId() > lastReadId && !viewerId.equals(m.getSenderId())) {
                count++;
            }
        }
        return count;
    }

    private MessageResponse toMessageResponse(Message message) {
        return new MessageResponse(
                String.valueOf(message.getId()),
                message.getSenderId(),
                message.getSenderName() == null ? "" : message.getSenderName(),
                message.getText(),
                message.getCreatedAt()
        );
    }

    private String label(String badge, String role) {
        if (badge != null && !badge.isBlank()) {
            return badge.trim();
        }
        if (role == null || role.isEmpty()) {
            return "Member";
        }
        return role.substring(0, 1).toUpperCase() + role.substring(1);
    }
}
