// app/map/page.tsx
"use client";

import dynamic from "next/dynamic";
import { User } from "@/types/user";

const RealtimeUserMap = dynamic(() => import("@/components/RealtimeUserMap"), {
  ssr: false,
});

// In a real application, this data would come from an API or database
const currentUser: User = {
  id: "1",
  name: "Current User",
  latitude: 40.7128,
  longitude: -74.006,
  isFixed: false,
};
const otherUsers: User[] = [
  {
    id: "2",
    name: "User 2",
    latitude: 40.7138,
    longitude: -74.007,
    isFixed: false,
  },
  {
    id: "3",
    name: "User 3",
    latitude: 40.7118,
    longitude: -74.005,
    isFixed: false,
  },
];
const thresholdDistance = 500; // meters

export default function MapPage() {
  return (
    <div className="h-screen w-full">
      <RealtimeUserMap
        initialCurrentUser={currentUser}
        initialOtherUsers={otherUsers}
        thresholdDistance={thresholdDistance}
      />
    </div>
  );
}
