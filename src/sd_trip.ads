--  Offer list, trip state machine, and the scripted sample.
--  Simulated drivers only. Nothing here contacts a server or a person.
package SD_Trip is
   function Logic_Version return Integer;

   function Service_Count return Integer;
   function Service_Name (I : Integer) return String;

   function Service return Integer;
   function Pick return Integer;
   function Dest return Integer;
   function Seats return Integer;
   function Size return Integer;
   function Pax return Integer;
   function Offer return Integer;
   function Suggested return Integer;
   function Min_Offer return Integer;
   function Distance_M return Integer;
   function Direct_M return Integer;

   function Route_Len return Integer;
   function Route_Place (K : Integer) return Integer;

   function Set_Service (I : Integer) return Integer;
   function Set_Pick (I : Integer) return Integer;
   function Set_Dest (I : Integer) return Integer;
   function Set_Seats (N : Integer) return Integer;
   function Set_Size (N : Integer) return Integer;
   function Set_Pax (N : Integer) return Integer;
   function Set_Offer (N : Integer) return Integer;
   function Set_From_Airport (I : Integer) return Integer;
   function Set_To_Airport (I : Integer) return Integer;
   function From_Airport return Integer;
   function To_Airport return Integer;

   procedure Set_Contact_Len (N : Integer);
   procedure Set_Contact_Char (I, Code : Integer);
   function Contact_Len return Integer;
   function Contact_Char (I : Integer) return Integer;

   procedure Set_Load_Len (N : Integer);
   procedure Set_Load_Char (I, Code : Integer);
   function Load_Len return Integer;
   function Load_Char (I : Integer) return Integer;

   procedure Load_Sample;
   function Start_Sample return Integer;
   function Request return Integer;
   function Accept_Offer (Index : Integer) return Integer;
   procedure Cancel;
   function Tick return Integer;

   function Status return Integer;
   function Auto return Integer;
   function Error_Code return Integer;
   function Error_Text return String;
   function Banner return String;

   function Offer_Count return Integer;
   function Offer_Name (I : Integer) return String;
   function Offer_Price (I : Integer) return Integer;
   function Offer_Veh (I : Integer) return Integer;
   function Offer_Sim (I : Integer) return Integer;
   function Offer_Example (I : Integer) return Integer;
   function Offer_Chosen (I : Integer) return Integer;

   function Price return Integer;
   function Driver_Lat return Integer;
   function Driver_Lng return Integer;
   function Driver_Name return String;

   function Fleet_Count return Integer;
   function Fleet_Name (I : Integer) return String;
   function Fleet_Lat (I : Integer) return Integer;
   function Fleet_Lng (I : Integer) return Integer;
   function Fleet_Veh (I : Integer) return Integer;
   function Fleet_Home (I : Integer) return Integer;
   function Focus_Fleet return Integer;

   function Sample_Driver return String;
   function Sample_Note return String;
   function Quote_Note return String;

   function Jet_Quote (From_I, To_I : Integer) return Integer;
   function Covered_M return Integer;
   function Leg_M return Integer;
end SD_Trip;
