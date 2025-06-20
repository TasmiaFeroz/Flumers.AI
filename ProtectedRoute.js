import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../api/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const [user, loading] = useAuthState(auth);
  const [userRole, setUserRole] = useState(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const location = useLocation(); // Get the current location

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        try {
          const userDoc = doc(db, "users", user.uid);
          const userSnapshot = await getDoc(userDoc);
          if (userSnapshot.exists()) {
            setUserRole(userSnapshot.data().role);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
        }
      }
      setRoleLoading(false);
    };

    fetchUserRole();
  }, [user]);

  if (loading || roleLoading) {
    return <div>Loading...</div>; // Show a loading indicator while checking auth state or role
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />; // Redirect to login and preserve the current location
  }

  // If roles are specified, check if the user has an allowed role
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />; // Redirect to home if role is not allowed
  }

  return children; // Render the protected content if authenticated and role is allowed
};

export default ProtectedRoute;