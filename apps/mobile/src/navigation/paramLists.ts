/** Shared route types only — avoids Metro circular imports between navigators. */

export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  AccountDisabled: undefined;
  ProfilePhoto: undefined;
  ProfileVerse: undefined;
  ChurchSelect: { userId?: string; showOnboardingProgress?: boolean };
};

export type AppStackParamList = {
  MainTabs: { showServe?: boolean };
  AnnouncementsDetail: {
    announcement: {
      id: string;
      title: string;
      body: string;
      publish_at?: string | null;
      image_url?: string | null;
    };
  };
  EventDetail: { eventId: string };
  ProfileMenu: undefined;
  ChurchInfo: undefined;
  Notifications: undefined;
  Members: undefined;
  FeaturePlaceholder: { title: string; subtitle?: string };
  GuidedTour: undefined;
  RequestToServe: undefined;
};
