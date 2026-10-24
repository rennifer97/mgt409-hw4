// Opens the chat concierge and sends a question (ChatWidget listens for this event).
export function askConcierge(text: string) {
  window.dispatchEvent(new CustomEvent('cc:ask', { detail: text }))
}
