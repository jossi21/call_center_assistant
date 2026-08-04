from enum import Enum

class AgentType(str, Enum):
    SALES = "sales"
    SUPPORT = "support"
    HR = "hr"