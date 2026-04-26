from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from .state import AgentState
from .nodes import (
    router_node, extraction_node, query_node, chat_node,
    audio_node, vision_node, document_node, report_node,
    research_node, recommendation_node, statement_node,
    auth_node, unauthorized_node, file_type_confirmation_node
)
from .nodes_advanced import (
    budget_node, fund_node, reminder_node, shopping_list_node,
    subscription_node, custom_category_node
)

def route_intent(state: AgentState):
    intent = state.get("intent")
    if intent == "record":
        return "extraction"
    elif intent == "query":
        return "query"
    elif intent == "budget":
        return "budget"
    elif intent == "fund":
        return "fund"
    elif intent == "reminder":
        return "reminder"
    elif intent == "shopping_list":
        return "shopping_list"
    elif intent == "subscription":
        return "subscription"
    elif intent == "custom_category":
        return "custom_category"
    elif intent == "report":
        return "report"
    elif intent == "recommendation":
        return "research"
    elif intent == "statement":
        return "statement"
    elif intent == "audio":
        return "audio"
    elif intent == "image":
        return "image"
    elif intent == "pdf":
        return "pdf"
    elif intent == "auth":
        return "auth"
    elif intent == "unauthorized":
        return "unauthorized"
    elif intent == "awaiting_file_type":
        return "file_type_confirmation"
    else:
        return "chat"

def create_graph():
    builder = StateGraph(AgentState)
    
    builder.add_node("router", router_node)
    builder.add_node("extraction", extraction_node)
    builder.add_node("query", query_node)
    builder.add_node("chat", chat_node)
    builder.add_node("audio", audio_node)
    builder.add_node("image", vision_node)
    builder.add_node("pdf", document_node)
    builder.add_node("report", report_node)
    builder.add_node("research", research_node)
    builder.add_node("recommendation", recommendation_node)
    builder.add_node("statement", statement_node)
    builder.add_node("auth", auth_node)
    builder.add_node("unauthorized", unauthorized_node)
    builder.add_node("file_type_confirmation", file_type_confirmation_node)
    # New nodes
    builder.add_node("budget", budget_node)
    builder.add_node("fund", fund_node)
    builder.add_node("reminder", reminder_node)
    builder.add_node("shopping_list", shopping_list_node)
    builder.add_node("subscription", subscription_node)
    builder.add_node("custom_category", custom_category_node)
    
    builder.add_edge(START, "router")
    
    builder.add_conditional_edges(
        "router",
        route_intent,
        {
            "extraction": "extraction",
            "query": "query",
            "budget": "budget",
            "fund": "fund",
            "reminder": "reminder",
            "shopping_list": "shopping_list",
            "subscription": "subscription",
            "custom_category": "custom_category",
            "report": "report",
            "research": "research",
            "statement": "statement",
            "chat": "chat",
            "audio": "audio",
            "image": "image",
            "pdf": "pdf",
            "auth": "auth",
            "unauthorized": "unauthorized",
            "file_type_confirmation": "file_type_confirmation"
        }
    )
    
    builder.add_edge("audio", "extraction")
    builder.add_edge("image", "extraction")
    builder.add_edge("pdf", "extraction")
    
    builder.add_edge("research", "recommendation")
    builder.add_edge("recommendation", END)
    
    builder.add_edge("statement", END)
    
    builder.add_edge("auth", END)
    builder.add_edge("unauthorized", END)
    builder.add_edge("file_type_confirmation", END)
    
    builder.add_edge("extraction", END)
    builder.add_edge("query", END)
    builder.add_edge("report", END)
    builder.add_edge("chat", END)
    builder.add_edge("budget", END)
    builder.add_edge("fund", END)
    builder.add_edge("reminder", END)
    builder.add_edge("shopping_list", END)
    builder.add_edge("subscription", END)
    builder.add_edge("custom_category", END)
    
    memory = MemorySaver()
    return builder.compile(checkpointer=memory)

graph = create_graph()
