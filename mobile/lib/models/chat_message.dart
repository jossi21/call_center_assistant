class ChatMessage {
  final String role; // "user" | "assistant"
  final String content;
  final String? agent;
  final String? id;
  final bool? interrupted;
  final bool? isStaff;

  ChatMessage({
    required this.role,
    required this.content,
    this.agent,
    this.id,
    this.interrupted,
    this.isStaff,
  });
}