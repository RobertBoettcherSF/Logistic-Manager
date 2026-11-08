--  C exports for the browser. Every value is an Integer.
--  String indexes are 0-based. Callers that pass a bad index get 0 or -1.
package SD_API is
   function Ready return Integer
     with Export, Convention => C, External_Name => "sd_ready";
   function Logic_Version return Integer
     with Export, Convention => C, External_Name => "sd_logic_version";

   function Place_Count return Integer
     with Export, Convention => C, External_Name => "sd_place_count";
   function Place_Name_Len (I : Integer) return Integer
     with Export, Convention => C, External_Name => "sd_place_name_len";
   function Place_Name_Char (I, K : Integer) return Integer
     with Export, Convention => C, External_Name => "sd_place_name_char";
   function Place_Lat_U (I : Integer) return Integer
     with Export, Convention => C, External_Name => "sd_place_lat_u";
   function Place_Lng_U (I : Integer) return Integer
     with Export, Convention => C, External_Name => "sd_place_lng_u";
   function Place_Pickable (I : Integer) return Integer
     with Export, Convention => C, External_Name => "sd_place_pickable";

   function Airport_Count return Integer
     with Export, Convention => C, External_Name => "sd_airport_count";
   function Airport_Name_Len (I : Integer) return Integer
     with Export, Convention => C, External_Name => "sd_airport_name_len";
   function Airport_Name_Char (I, K : Integer) return Integer
     with Export, Convention => C, External_Name => "sd_airport_name_char";

   function Edge_Count return Integer
     with Export, Convention => C, External_Name => "sd_edge_count";
   function Edge_A (I : Integer) return Integer
     with Export, Convention => C, External_Name => "sd_edge_a";
   function Edge_B (I : Integer) return Integer
     with Export, Convention => C, External_Name => "sd_edge_b";

   function Service_Count return Integer
     with Export, Convention => C, External_Name => "sd_service_count";
   function Service_Name_Len (I : Integer) return Integer
     with Export, Convention => C, External_Name => "sd_service_name_len";
   function Service_Name_Char (I, K : Integer) return Integer
     with Export, Convention => C, External_Name => "sd_service_name_char";

   function Service return Integer
     with Export, Convention => C, External_Name => "sd_service";
   function Pick return Integer
     with Export, Convention => C, External_Name => "sd_pick";
   function Dest return Integer
     with Export, Convention => C, External_Name => "sd_dest";
   function Seats return Integer
     with Export, Convention => C, External_Name => "sd_seats";
   function Size return Integer
     with Export, Convention => C, External_Name => "sd_size";
   function Pax return Integer
     with Export, Convention => C, External_Name => "sd_pax";
   function Offer return Integer
     with Export, Convention => C, External_Name => "sd_offer";
   function Suggested return Integer
     with Export, Convention => C, External_Name => "sd_suggested";
   function Min_Offer return Integer
     with Export, Convention => C, External_Name => "sd_min_offer";
   function Distance_M return Integer
     with Export, Convention => C, External_Name => "sd_distance_m";
   function Direct_M return Integer
     with Export, Convention => C, External_Name => "sd_direct_m";
   function Route_Len return Integer
     with Export, Convention => C, External_Name => "sd_route_len";
   function Route_Lat_U (K : Integer) return Integer
     with Export, Convention => C, External_Name => "sd_route_lat_u";
   function Route_Lng_U (K : Integer) return Integer
     with Export, Convention => C, External_Name => "sd_route_lng_u";
   function Route_Place (K : Integer) return Integer
     with Export, Convention => C, External_Name => "sd_route_place";

   function Set_Service (I : Integer) return Integer
     with Export, Convention => C, External_Name => "sd_set_service";
   function Set_Pick (I : Integer) return Integer
     with Export, Convention => C, External_Name => "sd_set_pick";
   function Set_Dest (I : Integer) return Integer
     with Export, Convention => C, External_Name => "sd_set_dest";
   function Set_Seats (N : Integer) return Integer
     with Export, Convention => C, External_Name => "sd_set_seats";
   function Set_Size (N : Integer) return Integer
     with Export, Convention => C, External_Name => "sd_set_size";
   function Set_Pax (N : Integer) return Integer
     with Export, Convention => C, External_Name => "sd_set_pax";
   function Set_Offer (N : Integer) return Integer
     with Export, Convention => C, External_Name => "sd_set_offer";
   function Set_From_Airport (I : Integer) return Integer
     with Export, Convention => C, External_Name => "sd_set_from_airport";
   function Set_To_Airport (I : Integer) return Integer
     with Export, Convention => C, External_Name => "sd_set_to_airport";
   function From_Airport return Integer
     with Export, Convention => C, External_Name => "sd_from_airport";
   function To_Airport return Integer
     with Export, Convention => C, External_Name => "sd_to_airport";

   procedure Set_Contact_Len (N : Integer)
     with Export, Convention => C, External_Name => "sd_set_contact_len";
   procedure Set_Contact_Char (I, Code : Integer)
     with Export, Convention => C, External_Name => "sd_set_contact_char";
   function Contact_Len return Integer
     with Export, Convention => C, External_Name => "sd_contact_len";
   function Contact_Char (I : Integer) return Integer
     with Export, Convention => C, External_Name => "sd_contact_char";
   procedure Set_Load_Len (N : Integer)
     with Export, Convention => C, External_Name => "sd_set_load_len";
   procedure Set_Load_Char (I, Code : Integer)
     with Export, Convention => C, External_Name => "sd_set_load_char";
   function Load_Len return Integer
     with Export, Convention => C, External_Name => "sd_load_len";
   function Load_Char (I : Integer) return Integer
     with Export, Convention => C, External_Name => "sd_load_char";

   procedure Load_Sample
     with Export, Convention => C, External_Name => "sd_load_sample";
   function Start_Sample return Integer
     with Export, Convention => C, External_Name => "sd_start_sample";
   function Request return Integer
     with Export, Convention => C, External_Name => "sd_request";
   function Accept_Offer (Index : Integer) return Integer
     with Export, Convention => C, External_Name => "sd_accept";
   procedure Cancel
     with Export, Convention => C, External_Name => "sd_cancel";
   function Tick return Integer
     with Export, Convention => C, External_Name => "sd_tick";

   function Status return Integer
     with Export, Convention => C, External_Name => "sd_status";
   function Auto return Integer
     with Export, Convention => C, External_Name => "sd_auto";
   function Error_Code return Integer
     with Export, Convention => C, External_Name => "sd_error";
   function Error_Len return Integer
     with Export, Convention => C, External_Name => "sd_error_len";
   function Error_Char (K : Integer) return Integer
     with Export, Convention => C, External_Name => "sd_error_char";
   function Banner_Len return Integer
     with Export, Convention => C, External_Name => "sd_banner_len";
   function Banner_Char (K : Integer) return Integer
     with Export, Convention => C, External_Name => "sd_banner_char";

   function Offer_Count return Integer
     with Export, Convention => C, External_Name => "sd_offer_count";
   function Offer_Name_Len (I : Integer) return Integer
     with Export, Convention => C, External_Name => "sd_offer_name_len";
   function Offer_Name_Char (I, K : Integer) return Integer
     with Export, Convention => C, External_Name => "sd_offer_name_char";
   function Offer_Price (I : Integer) return Integer
     with Export, Convention => C, External_Name => "sd_offer_price";
   function Offer_Veh (I : Integer) return Integer
     with Export, Convention => C, External_Name => "sd_offer_veh";
   function Offer_Sim (I : Integer) return Integer
     with Export, Convention => C, External_Name => "sd_offer_sim";
   function Offer_Example (I : Integer) return Integer
     with Export, Convention => C, External_Name => "sd_offer_example";
   function Offer_Chosen (I : Integer) return Integer
     with Export, Convention => C, External_Name => "sd_offer_chosen";

   function Price return Integer
     with Export, Convention => C, External_Name => "sd_price";
   function Driver_Lat_U return Integer
     with Export, Convention => C, External_Name => "sd_driver_lat_u";
   function Driver_Lng_U return Integer
     with Export, Convention => C, External_Name => "sd_driver_lng_u";
   function Driver_Name_Len return Integer
     with Export, Convention => C, External_Name => "sd_driver_name_len";
   function Driver_Name_Char (K : Integer) return Integer
     with Export, Convention => C, External_Name => "sd_driver_name_char";

   function Fleet_Count return Integer
     with Export, Convention => C, External_Name => "sd_fleet_count";
   function Fleet_Name_Len (I : Integer) return Integer
     with Export, Convention => C, External_Name => "sd_fleet_name_len";
   function Fleet_Name_Char (I, K : Integer) return Integer
     with Export, Convention => C, External_Name => "sd_fleet_name_char";
   function Fleet_Lat_U (I : Integer) return Integer
     with Export, Convention => C, External_Name => "sd_fleet_lat_u";
   function Fleet_Lng_U (I : Integer) return Integer
     with Export, Convention => C, External_Name => "sd_fleet_lng_u";
   function Fleet_Veh (I : Integer) return Integer
     with Export, Convention => C, External_Name => "sd_fleet_veh";
   function Fleet_Home (I : Integer) return Integer
     with Export, Convention => C, External_Name => "sd_fleet_home";
   function Focus_Fleet return Integer
     with Export, Convention => C, External_Name => "sd_focus_fleet";

   function Sample_Driver_Len return Integer
     with Export, Convention => C, External_Name => "sd_sample_driver_len";
   function Sample_Driver_Char (K : Integer) return Integer
     with Export, Convention => C, External_Name => "sd_sample_driver_char";
   function Sample_Note_Len return Integer
     with Export, Convention => C, External_Name => "sd_sample_note_len";
   function Sample_Note_Char (K : Integer) return Integer
     with Export, Convention => C, External_Name => "sd_sample_note_char";
   function Quote_Note_Len return Integer
     with Export, Convention => C, External_Name => "sd_quote_note_len";
   function Quote_Note_Char (K : Integer) return Integer
     with Export, Convention => C, External_Name => "sd_quote_note_char";

   function Quote (Service, Meters, Seats, Size : Integer) return Integer
     with Export, Convention => C, External_Name => "sd_quote";
   function Jet_Quote (From_I, To_I : Integer) return Integer
     with Export, Convention => C, External_Name => "sd_jet_quote";
   function Covered_M return Integer
     with Export, Convention => C, External_Name => "sd_covered_m";
   function Leg_M return Integer
     with Export, Convention => C, External_Name => "sd_leg_m";
end SD_API;
