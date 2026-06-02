"""Admin chat endpoints

Implements chat with Admin where conversations are separated per user.
- User sends messages to admin chat conversation tied to user_id.
- Admin can list/read messages for a specific user.
- Admin can reply to user's messages.

Endpoints (prefix /api/admin/chat from main.py):
- POST /api/admin/chat/messages           (User sends message)
- GET  /api/admin/chat/my-messages       (User gets own messages)
- GET  /api/admin/chat/messages          (Admin reads messages for user)
- POST /api/admin/chat/reply             (Admin replies to user)
- GET  /api/admin/chat/conversations     (Admin lists all conversations)
"""

from fastapi import APIRouter, Depends, HTTPException
from config import get_connection
from middleware.auth import require_role, get_current_user
from models.schemas import (
    AdminChatSendRequest,
    AdminChatMessageResponse,
    AdminChatReplyRequest,
)

from typing import List

router = APIRouter(tags=["AdminChat"])


@router.post("/messages", response_model=List[AdminChatMessageResponse])
def user_send_message(
    request: AdminChatSendRequest,
    current_user: dict = Depends(get_current_user),
):
    """User sends a message to Admin.

    Creates conversation if it doesn't exist and persists message.
    Returns latest messages so frontend can refresh.
    """
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    content = (request.message or "").strip()
    if not content:
        raise HTTPException(status_code=400, detail="Message is required")

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO admin_chat_conversations (user_id)
                VALUES (%s)
                ON CONFLICT (user_id) DO NOTHING
                RETURNING id
                """,
                (user_id,),
            )
            row = cursor.fetchone()

            if row and row.get("id"):
                conversation_id = row["id"]
            else:
                cursor.execute(
                    "SELECT id FROM admin_chat_conversations WHERE user_id = %s",
                    (user_id,),
                )
                c_row = cursor.fetchone()
                if not c_row:
                    raise HTTPException(status_code=500, detail="Failed to create conversation")
                conversation_id = c_row["id"]

            cursor.execute(
                """
                INSERT INTO admin_chat_messages (conversation_id, sender_role, sender_user_id, content)
                VALUES (%s, %s, %s, %s)
                RETURNING id, created_at
                """,
                (conversation_id, 0, user_id, content),
            )
            msg_row = cursor.fetchone()
            conn.commit()

            # Return last 50 messages for UI refresh
            cursor.execute(
                """
                SELECT m.id, m.sender_role, m.sender_user_id, m.content, m.created_at
                FROM admin_chat_messages m
                WHERE m.conversation_id = %s
                ORDER BY m.created_at DESC, m.id DESC
                LIMIT 50
                """,
                (conversation_id,),
            )
            messages = cursor.fetchall()

        # Reverse to chronological order
        messages = list(reversed(messages))

        return [
            AdminChatMessageResponse(
                id=m["id"],
                user_id=user_id,
                sender_role=int(m["sender_role"]),
                sender_user_id=m.get("sender_user_id"),
                content=m["content"],
                created_at=m["created_at"],
            )
            for m in messages
        ]
    finally:
        conn.close()


@router.get("/my-messages", response_model=List[AdminChatMessageResponse])
def user_get_my_messages(
    current_user: dict = Depends(get_current_user),
):
    """User gets their own messages with admin."""
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT id FROM admin_chat_conversations WHERE user_id = %s",
                (user_id,),
            )
            conv = cursor.fetchone()
            if not conv:
                return []

            conversation_id = conv["id"]

            cursor.execute(
                """
                SELECT m.id, m.sender_role, m.sender_user_id, m.content, m.created_at
                FROM admin_chat_messages m
                WHERE m.conversation_id = %s
                ORDER BY m.created_at ASC, m.id ASC
                """,
                (conversation_id,),
            )
            messages = cursor.fetchall()

        return [
            AdminChatMessageResponse(
                id=m["id"],
                user_id=user_id,
                sender_role=int(m["sender_role"]),
                sender_user_id=m.get("sender_user_id"),
                content=m["content"],
                created_at=m["created_at"],
            )
            for m in messages
        ]
    finally:
        conn.close()


@router.get("/messages", response_model=List[AdminChatMessageResponse])
def admin_get_messages(
    user_id: int,
    current_user: dict = Depends(require_role(1)),
):
    """Admin reads messages for a specific user conversation."""
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT id FROM admin_chat_conversations WHERE user_id = %s",
                (user_id,),
            )
            conv = cursor.fetchone()
            if not conv:
                return []

            conversation_id = conv["id"]

            cursor.execute(
                """
                SELECT m.id, m.sender_role, m.sender_user_id, m.content, m.created_at
                FROM admin_chat_messages m
                WHERE m.conversation_id = %s
                ORDER BY m.created_at ASC, m.id ASC
                """,
                (conversation_id,),
            )
            messages = cursor.fetchall()

        return [
            AdminChatMessageResponse(
                id=m["id"],
                user_id=user_id,
                sender_role=int(m["sender_role"]),
                sender_user_id=m.get("sender_user_id"),
                content=m["content"],
                created_at=m["created_at"],
            )
            for m in messages
        ]
    finally:
        conn.close()


@router.post("/reply", response_model=AdminChatMessageResponse)
def admin_reply_message(
    request: AdminChatReplyRequest,
    current_user: dict = Depends(require_role(1)),
):
    """Admin replies to a user's conversation.

    Creates message as admin (sender_role=1).
    """
    admin_id = current_user.get("id")
    if not admin_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    content = (request.message or "").strip()
    if not content:
        raise HTTPException(status_code=400, detail="Message is required")

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # Find user's conversation
            cursor.execute(
                "SELECT id FROM admin_chat_conversations WHERE user_id = %s",
                (request.user_id,),
            )
            conv = cursor.fetchone()
            if not conv:
                raise HTTPException(status_code=404, detail="User conversation not found")

            conversation_id = conv["id"]

            # Insert admin reply
            cursor.execute(
                """
                INSERT INTO admin_chat_messages (conversation_id, sender_role, sender_user_id, content)
                VALUES (%s, %s, %s, %s)
                RETURNING id, created_at
                """,
                (conversation_id, 1, admin_id, content),
            )
            msg_row = cursor.fetchone()
            conn.commit()

            return AdminChatMessageResponse(
                id=msg_row["id"],
                user_id=request.user_id,
                sender_role=1,
                sender_user_id=admin_id,
                content=content,
                created_at=msg_row["created_at"],
            )
    finally:
        conn.close()


@router.get("/conversations")
def admin_list_conversations(
    current_user: dict = Depends(require_role(1)),
):
    """Admin lists all user conversations with latest message info."""
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    c.user_id,
                    u.username,
                    u.full_name,
                    u.email,
                    c.created_at as conversation_started,
                    (
                        SELECT m.content
                        FROM admin_chat_messages m
                        WHERE m.conversation_id = c.id
                        ORDER BY m.created_at DESC
                        LIMIT 1
                    ) as last_message,
                    (
                        SELECT m.created_at
                        FROM admin_chat_messages m
                        WHERE m.conversation_id = c.id
                        ORDER BY m.created_at DESC
                        LIMIT 1
                    ) as last_message_at,
                    (
                        SELECT COUNT(*)
                        FROM admin_chat_messages m
                        WHERE m.conversation_id = c.id
                    ) as message_count
                FROM admin_chat_conversations c
                JOIN users u ON u.id = c.user_id
                ORDER BY last_message_at DESC NULLS LAST
                """
            )
            conversations = cursor.fetchall()

        return [
            {
                "user_id": conv["user_id"],
                "username": conv["username"],
                "full_name": conv["full_name"],
                "email": conv["email"],
                "conversation_started": conv["conversation_started"],
                "last_message": conv["last_message"],
                "last_message_at": conv["last_message_at"],
                "message_count": conv["message_count"],
            }
            for conv in conversations
        ]
    finally:
        conn.close()