/**
 * Board Mapper Utilities
 * Functions to map between lanes and columns
 */

/**
 * Map lane ID to column name
 */
export const mapLaneToColumn = (
  laneId: string | null,
  lanes: { id: string; name: string }[]
): string => {
  if (!laneId || lanes.length === 0) {
    console.warn("⚠️ mapLaneToColumn: No laneId or lanes empty", {
      laneId,
      lanesCount: lanes.length,
    });
    return "ideas"; // Default
  }

  const lane = lanes.find((l) => l.id === laneId);
  if (!lane) {
    console.warn("⚠️ mapLaneToColumn: Lane not found", {
      laneId,
      availableLanes: lanes,
    });
    return "ideas"; // Default if lane not found
  }

  // Map lane name to column ID (normalize to lowercase)
  const columnName = lane.name.toLowerCase();
  console.log("✅ mapLaneToColumn:", {
    laneId,
    laneName: lane.name,
    columnName,
  });
  return columnName;
};

/**
 * Map column name to lane ID
 */
export const mapColumnToLaneId = (
  columnName: string,
  lanes: { id: string; name: string }[]
): string | undefined => {
  const lane = lanes.find((l) => l.name === columnName);
  console.log("🗺️ mapColumnToLaneId:", {
    columnName,
    laneId: lane?.id,
    allLanes: lanes,
  });
  return lane?.id;
};
