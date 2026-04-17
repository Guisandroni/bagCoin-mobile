from langgraph.graph import StateGraph, START, END
from .state import AgentState
from .nodes import (
    router_node, extraction_node, query_node, chat_node,
    audio_node, vision_node, document_node, report_node,
    research_node, recommendation_node, statement_node,
    auth_node, unauthorized_node
)

def route_intent(state: AgentState):
    intent = state.get("intent")
    if intent == "record":
        return "extraction"
    elif intent == "query":
        return "query"
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
    
    builder.add_edge(START, "router")
    
    builder.add_conditional_edges(
        "router",
        route_intent,
        {
            "extraction": "extraction",
            "query": "query",
            "report": "report",
            "research": "research",
            "statement": "statement",
            "chat": "chat",
            "audio": "audio",
            "image": "image",
            "pdf": "pdf",
            "auth": "auth",
            "unauthorized": "unauthorized"
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
    
    builder.add_edge("extraction", END)
    builder.add_edge("query", END)
    builder.add_edge("report", END)
    builder.add_edge("chat", END)
    
    return builder.compile()

graph = create_graph()
