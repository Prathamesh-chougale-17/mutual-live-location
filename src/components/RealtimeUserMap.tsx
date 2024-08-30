import React, { useState, useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Circle,
  Popup,
  useMap,
  Marker,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface User {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  isFixed: boolean;
}

interface RealtimeUserMapProps {
  initialCurrentUser: User;
  initialOtherUsers: User[];
  thresholdDistance: number;
}

const UpdateMapView: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
};

const RealtimeUserMap: React.FC<RealtimeUserMapProps> = ({
  initialCurrentUser,
  initialOtherUsers,
  thresholdDistance,
}) => {
  const [currentUser, setCurrentUser] = useState(initialCurrentUser);
  const [otherUsers, setOtherUsers] = useState(initialOtherUsers);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [intersections, setIntersections] = useState<Set<string>>(new Set());

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  useEffect(() => {
    const checkIntersections = () => {
      const newIntersections = new Set<string>();
      const newAlerts: string[] = [];
      const allUsers = [currentUser, ...otherUsers];

      for (let i = 0; i < allUsers.length; i++) {
        for (let j = i + 1; j < allUsers.length; j++) {
          const user1 = allUsers[i];
          const user2 = allUsers[j];
          const distance = calculateDistance(
            user1.latitude,
            user1.longitude,
            user2.latitude,
            user2.longitude
          );

          if (distance <= thresholdDistance * 2) {
            newIntersections.add(user1.id);
            newIntersections.add(user2.id);
            newAlerts.push(`${user1.name} and ${user2.name} are within range!`);
          }
        }
      }

      setIntersections(newIntersections);
      setAlerts(newAlerts);
    };
    checkIntersections();
  }, [currentUser, otherUsers, thresholdDistance]);

  const userIcon = useMemo(
    () =>
      new L.DivIcon({
        html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
             <path fill="#3b82f6" d="M12 0C7.589 0 4 3.589 4 8c0 5.5 8 16 8 16s8-10.5 8-16c0-4.411-3.589-8-8-8zm0 12c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4z"/>
           </svg>`,
        className: "",
        iconSize: [24, 24],
        iconAnchor: [12, 24],
      }),
    []
  );

  const moveUser = (user: User, newLat: number, newLng: number) => {
    if (user.isFixed) return; // Don't move if the user's location is fixed

    const updatedUser = { ...user, latitude: newLat, longitude: newLng };
    if (user.id === currentUser.id) {
      setCurrentUser(updatedUser);
    } else {
      setOtherUsers(
        otherUsers.map((u) => (u.id === user.id ? updatedUser : u))
      );
    }
  };

  const toggleFixedLocation = (user: User) => {
    const updatedUser = { ...user, isFixed: !user.isFixed };
    if (user.id === currentUser.id) {
      setCurrentUser(updatedUser);
    } else {
      setOtherUsers(
        otherUsers.map((u) => (u.id === user.id ? updatedUser : u))
      );
    }
  };

  return (
    <div className="h-screen w-full relative">
      <MapContainer
        center={[currentUser.latitude, currentUser.longitude]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <UpdateMapView center={[currentUser.latitude, currentUser.longitude]} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {[currentUser, ...otherUsers].map((user) => (
          <React.Fragment key={user.id}>
            <Marker
              position={[user.latitude, user.longitude]}
              icon={userIcon}
              eventHandlers={{
                click: () => {
                  if (!user.isFixed) {
                    const newLat = user.latitude + (Math.random() - 0.5) * 0.01;
                    const newLng =
                      user.longitude + (Math.random() - 0.5) * 0.01;
                    moveUser(user, newLat, newLng);
                  }
                },
              }}
            >
              <Popup>
                {user.name}
                <br />
                Lat: {user.latitude.toFixed(4)}, Lng:{" "}
                {user.longitude.toFixed(4)}
                <br />
                <Button onClick={() => toggleFixedLocation(user)}>
                  {user.isFixed ? "Unfix Location" : "Fix Location"}
                </Button>
              </Popup>
            </Marker>
            <Circle
              center={[user.latitude, user.longitude]}
              radius={thresholdDistance}
              pathOptions={{
                color: intersections.has(user.id) ? "red" : "blue",
                fillColor: intersections.has(user.id) ? "red" : "blue",
                fillOpacity: 0.2,
              }}
            />
          </React.Fragment>
        ))}
      </MapContainer>
      <div className="absolute top-4 left-4 z-[1000] space-y-2">
        {alerts.map((alert, index) => (
          <Alert key={index}>
            <AlertTitle>Proximity Alert</AlertTitle>
            <AlertDescription>{alert}</AlertDescription>
          </Alert>
        ))}
      </div>
      <div className="absolute bottom-4 left-4 z-[1000]">
        <Button
          onClick={() => {
            if (!currentUser.isFixed) {
              const newLat =
                currentUser.latitude + (Math.random() - 0.5) * 0.01;
              const newLng =
                currentUser.longitude + (Math.random() - 0.5) * 0.01;
              moveUser(currentUser, newLat, newLng);
            }
          }}
        >
          Move Current User
        </Button>
      </div>
    </div>
  );
};

export default RealtimeUserMap;
