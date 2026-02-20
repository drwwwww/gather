import { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, TouchableOpacity, ScrollView, Image } from "react-native";
import { ui } from "../ui";
import { loadLocalEvents, saveLocalEvents, type LocalEvent, type LocalRsvpStatus } from "../localEvents";

export default function EventDetailScreen({ navigation, route }: any) {
  const { eventId } = route.params;
  const [event, setEvent] = useState<LocalEvent | null>(null);
  const [status, setStatus] = useState<LocalRsvpStatus | null>(null);

  useEffect(() => {
    const stored = loadLocalEvents();
    const found = stored.events.find((item) => item.id === eventId) ?? null;
    setEvent(found);
    const rsvp = stored.rsvps.find((item) => item.eventId === eventId) ?? null;
    setStatus(rsvp?.status ?? null);
  }, [eventId]);

  const handleRsvp = (nextStatus: LocalRsvpStatus) => {
    const stored = loadLocalEvents();
    const nextRsvps = stored.rsvps.filter((item) => item.eventId !== eventId);
    nextRsvps.unshift({ eventId, status: nextStatus });
    saveLocalEvents({ events: stored.events, rsvps: nextRsvps });
    setStatus(nextStatus);
  };

  const summary = useMemo(() => {
    if (!event) return "";
    return event.location || "TBD";
  }, [event]);

  return (
    <View style={[ui.screen, { paddingTop: 48 }]}> 
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <View>
          <Text style={ui.title}>{event?.title ?? "Event"}</Text>
          <Text style={ui.subtitle}>ID: {eventId}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation?.navigate?.("Profile")}
          style={{ marginLeft: 12 }}
          accessibilityLabel="Open profile menu"
        >
          <Image source={require("../../assets/logo.png")} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: ui.cardAlt.backgroundColor }} />
        </TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={ui.card}>
          <Text style={ui.cardTitle}>{summary}</Text>
          <Text style={ui.subtitle}>{event?.description ?? ""}</Text>
          <Pressable style={ui.button} onPress={() => handleRsvp("GOING")}>
            <Text style={ui.buttonText}>{status === "GOING" ? "Going (saved)" : "RSVP Going"}</Text>
          </Pressable>
          <Pressable style={ui.buttonGhost} onPress={() => handleRsvp("MAYBE")}>
            <Text style={ui.buttonText}>{status === "MAYBE" ? "Maybe (saved)" : "Maybe"}</Text>
          </Pressable>
          <Pressable style={ui.buttonGhost} onPress={() => handleRsvp("NO")}>
            <Text style={ui.buttonText}>{status === "NO" ? "No (saved)" : "No"}</Text>
          </Pressable>
        </View>
        {/* TODO: Map real event details here */}
      </ScrollView>
    </View>
  );
}
