/** Shared route types only — avoids Metro circular imports between navigators. */

export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  AccountDisabled: undefined;
  ChurchSelect: { userId?: string; fullName?: string; email?: string };
};

export type AppStackParamList = {
  MainTabs: { showServe?: boolean };
  AnnouncementsDetail: {
    announcement: {
      id: string;
      title: string;
      body: string;
      publish_at?: string | null;
    };
  };
  EventDetail: { eventId: string };
  ProfileMenu: undefined;
  ChurchInfo: undefined;
  AssignmentDetail: { assignmentId: string };
  Notifications: undefined;
  Members: undefined;
  FeaturePlaceholder: { title: string; subtitle?: string };
};
