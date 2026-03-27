import { Navigate } from "react-router-dom";

// Gallery is now integrated into Graffiti Studio as a tab
export default function GraffitiGallery() {
  return <Navigate to="/graffiti" replace />;
}
