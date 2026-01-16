/**
 * Service to fetch routes from OSRM (Open Source Routing Machine)
 * that follow the cycling network.
 */
export async function fetchRoute(coordinates) {
  if (!coordinates || coordinates.length < 2) return null;

  const coordString = coordinates
    .map((coord) => `${coord[0]},${coord[1]}`)
    .join(";");

  const url = `https://router.project-osrm.org/route/v1/cycling/${coordString}?overview=full&geometries=geojson`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to fetch route");
    }
    const data = await response.json();

    if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
      throw new Error("No route found");
    }

    return {
      type: "Feature",
      properties: {
        distance: data.routes[0].distance,
        duration: data.routes[0].duration,
      },
      geometry: data.routes[0].geometry,
    };
  } catch (error) {
    console.error("Error fetching route:", error);
    return null;
  }
}
