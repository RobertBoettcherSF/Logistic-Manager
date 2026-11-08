with SD_Types;

--  Landmarks, schematic roads, and the shortest-path router.
--  Landmark coordinates are the public places already listed in the
--  v0.2 README (OpenStreetMap, 2026-10-16), stored as microdegrees.
--  Junctions are demo waypoints. Edge lengths are not a survey.
package SD_Geo is
   subtype Node is SD_Types.Node;

   Unreachable : constant Integer := 1_000_000_000;

   function Place_Count return Integer;
   function Place_Name (I : Integer) return String;
   function Lat (I : Integer) return Integer;
   function Lng (I : Integer) return Integer;
   function Pickable (I : Integer) return Boolean;

   function Airport_Count return Integer;
   function Airport_Name (I : Integer) return String;

   function Edge_Count return Integer;
   function Edge_A (I : Integer) return Integer;
   function Edge_B (I : Integer) return Integer;

   --  Road-factor metres between two coordinates (not the routed path).
   function Road_Meters (A, B : Integer) return Integer;

   type Trail is array (0 .. Node'Last) of Node;

   procedure Shortest
     (Src, Dst : Integer;
      Dist     : out Integer;
      Trail_Out : out Trail;
      Len      : out Natural);
end SD_Geo;
