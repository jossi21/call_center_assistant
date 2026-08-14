import uuid
from datetime import datetime

from sqlalchemy import (
    Column,
    String,
    Text,
    ForeignKey,
    DateTime,
    UniqueConstraint,
    Boolean,
    Integer
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    preferred_language = Column(String(10), default="en", nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    channel_identities = relationship("UserChannelIdentity", back_populates="user")
    messages = relationship("Message", back_populates="user")
    memory_entries = relationship("UserMemory", back_populates="user")
    audit_entries = relationship("AuditLog", back_populates="user")


class Channel(Base):
    __tablename__ = "channels"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(50), unique=True, nullable=False)  # slug: telegram, whatsapp, facebook, web
    display_name = Column(String(100), nullable=False)
    config = Column(JSONB, nullable=False)  # bot_token, webhook_secret, etc.
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

class OTPVerification(Base):
    __tablename__ = "otp_verifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    phone_number = Column(String(20), nullable=False)
    code = Column(String(6), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

class UserChannelIdentity(Base):
    __tablename__ = "user_channel_identities"
    __table_args__ = (
        UniqueConstraint("channel_type", "channel_specific_id", name="uq_channel_identity"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    channel_type = Column(String(20), nullable=False)
    channel_specific_id = Column(String(255), nullable=False)
    username = Column(String(150), nullable=True)       # NEW
    display_name = Column(String(150), nullable=True)   # NEW
    pending_phone = Column(String(20), nullable=True)    # NEW — holds the phone during verification
    verified_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="channel_identities")


    
class Message(Base):
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    channel_type = Column(String(20), nullable=False)
    role = Column(String(10), nullable=False)
    content = Column(Text, nullable=False)
    agent_name = Column(String(50), nullable=True)       # NEW — which agent produced this (assistant messages only)
    response_time_ms = Column(Integer, nullable=True)    # NEW — how long it took to generate (assistant messages only)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    user = relationship("User", back_populates="messages")

class UserMemory(Base):
    __tablename__ = "user_memory"
    __table_args__ = (
        UniqueConstraint("user_id", "key", name="uq_user_memory_key"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    key = Column(String(100), nullable=False)
    value = Column(Text, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="memory_entries")


class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    action = Column(String(100), nullable=False)
    payload = Column(JSONB, nullable=True)
    result = Column(String(20), nullable=True)  # 'success', 'failed', 'pending_confirmation'
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    user = relationship("User", back_populates="audit_entries")


    # Agents data base 
class Agent(Base):
    __tablename__ = "agents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(50), unique=True, nullable=False)  # slug, e.g. "sales"
    display_name = Column(String(100), nullable=False)      # e.g. "Sales"
    description = Column(Text, nullable=False)               # tells the router when to use this agent
    system_prompt = Column(Text, nullable=False)             # the agent's actual persona/instructions
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

# tools
class Tool(Base):
    __tablename__ = "tools"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=False)
    parameters_schema = Column(JSONB, nullable=False)
    risk_tier = Column(String(20), nullable=False)  # safe, reversible, destructive
    action_type = Column(String(50), nullable=False)  # write_user_memory, update_user_field, call_webhook
    action_config = Column(JSONB, nullable=False)
    agent_name = Column(String(50), nullable=True)  # which agent this tool belongs to; null = available to all
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

# pending action database
class PendingAction(Base):
    __tablename__ = "pending_actions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    tool_name = Column(String(100), nullable=False)
    tool_args = Column(JSONB, nullable=False)
    status = Column(String(30), default="awaiting_confirmation", nullable=False)  # widened from 20 to 30
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    expires_at = Column(DateTime(timezone=True), nullable=False)

# Language database
class Language(Base):
    __tablename__ = "languages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(10), unique=True, nullable=False)  # 'en', 'am'
    name = Column(String(50), nullable=False)  # 'English', 'Amharic'
    is_active = Column(Boolean, default=True, nullable=False)

# staff database
class StaffProfile(Base):
    __tablename__ = "staff_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    name = Column(String(150), nullable=False)
    email = Column(String(255), nullable=False)
    specialty = Column(String(50), nullable=False)
    is_available = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

# Agent database 
class Handoff(Base):
    __tablename__ = "handoffs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    reason = Column(Text, nullable=False)
    originating_agent = Column(String(50), nullable=True)
    status = Column(String(30), default="waiting_confirmation", nullable=False)
    assigned_staff_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    assigned_at = Column(DateTime(timezone=True), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)