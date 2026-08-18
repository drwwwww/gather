import { CenterCardModal } from "../ds";
import { useLiveUpdatesToast } from "../../hooks/useLiveUpdatesToast";
import { useReopenDigest } from "../../hooks/useReopenDigest";
import { useFirstAssignmentCard } from "../../hooks/useFirstAssignmentCard";
import { useFirstChurchTutorialCard } from "../../hooks/useFirstChurchTutorialCard";
import { navigate } from "../../navigation/navigationRef";

// Swap for any photo that reads as "you're part of the team" / "welcome home".
const FIRST_ASSIGNMENT_IMAGE = "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=900&q=80";
const TUTORIAL_IMAGE = "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=900&q=80";

/**
 * Mounted once, as a sibling of the main Stack.Navigator inside
 * NavigationContainer — hosts the toast queue and the two one-time welcome
 * cards (first assignment, first-church tutorial offer). Not a screen itself,
 * so it renders on top of whatever screen is currently active.
 */
export default function AppOverlays() {
  useLiveUpdatesToast();
  useReopenDigest();

  const { card: firstAssignment, dismiss: dismissFirstAssignment } = useFirstAssignmentCard();
  const { show: showTutorial, dismiss: dismissTutorial } = useFirstChurchTutorialCard();

  return (
    <>
      {/* Tutorial offer takes priority if both happen to land at once (e.g. a new
          SERVICE member who's assigned immediately after joining). */}
      <CenterCardModal
        visible={showTutorial}
        onClose={dismissTutorial}
        imageUri={TUTORIAL_IMAGE}
        eyebrow="Welcome to Gather"
        title="You're in! Want the two-minute tour?"
        body="See how to check announcements, RSVP to events, and — if you're on a serving team — manage your schedule. Takes about two minutes."
        primaryLabel="Show me around"
        onPrimaryPress={() => {
          dismissTutorial();
          navigate("GuidedTour");
        }}
        secondaryLabel="Skip for now"
        onSecondaryPress={dismissTutorial}
      />

      <CenterCardModal
        visible={!!firstAssignment && !showTutorial}
        onClose={dismissFirstAssignment}
        imageUri={FIRST_ASSIGNMENT_IMAGE}
        eyebrow="You're on the team"
        title={`You're serving as ${firstAssignment?.roleLabel ?? "part of the team"}`}
        body={
          firstAssignment?.dateLabel
            ? `You've been added to the schedule for ${firstAssignment.dateLabel}. Head to the Serve tab for full details and to confirm.`
            : "You've been added to the schedule. Head to the Serve tab for full details and to confirm."
        }
        primaryLabel="View assignment"
        onPrimaryPress={() => {
          dismissFirstAssignment();
          navigate("MainTabs", { screen: "Serve" });
        }}
        secondaryLabel="Later"
        onSecondaryPress={dismissFirstAssignment}
      />
    </>
  );
}
