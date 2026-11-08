with Interfaces;
with System;

with SD_Fare;
with SD_Geo;
with SD_Trip;

package body SD_API is
   procedure Put_Exception
     (Msg  : System.Address;
      Size : Interfaces.Unsigned_32;
      Line : Interfaces.Unsigned_32)
     with Export, Convention => C, External_Name => "__gnat_put_exception";

   procedure Put_Exception
     (Msg  : System.Address;
      Size : Interfaces.Unsigned_32;
      Line : Interfaces.Unsigned_32)
   is
      pragma Unreferenced (Msg, Size, Line);
   begin
      null;
   end Put_Exception;

   function Len_Of (S : String) return Integer is (S'Length);

   function Char_Of (S : String; K : Integer) return Integer is
   begin
      if K < 0 or else K >= S'Length then
         return 0;
      end if;
      return Character'Pos (S (S'First + K));
   end Char_Of;

   function Flag (B : Boolean) return Integer is
     (if B then 1 else 0);

   function Ready return Integer is (1);
   function Logic_Version return Integer is (SD_Trip.Logic_Version);

   function Place_Count return Integer is (SD_Geo.Place_Count);
   function Place_Name_Len (I : Integer) return Integer is
     (Len_Of (SD_Geo.Place_Name (I)));
   function Place_Name_Char (I, K : Integer) return Integer is
     (Char_Of (SD_Geo.Place_Name (I), K));
   function Place_Lat_U (I : Integer) return Integer is (SD_Geo.Lat (I));
   function Place_Lng_U (I : Integer) return Integer is (SD_Geo.Lng (I));
   function Place_Pickable (I : Integer) return Integer is
     (Flag (SD_Geo.Pickable (I)));

   function Airport_Count return Integer is (SD_Geo.Airport_Count);
   function Airport_Name_Len (I : Integer) return Integer is
     (Len_Of (SD_Geo.Airport_Name (I)));
   function Airport_Name_Char (I, K : Integer) return Integer is
     (Char_Of (SD_Geo.Airport_Name (I), K));

   function Edge_Count return Integer is (SD_Geo.Edge_Count);
   function Edge_A (I : Integer) return Integer is (SD_Geo.Edge_A (I));
   function Edge_B (I : Integer) return Integer is (SD_Geo.Edge_B (I));

   function Service_Count return Integer is (SD_Trip.Service_Count);
   function Service_Name_Len (I : Integer) return Integer is
     (Len_Of (SD_Trip.Service_Name (I)));
   function Service_Name_Char (I, K : Integer) return Integer is
     (Char_Of (SD_Trip.Service_Name (I), K));

   function Service return Integer is (SD_Trip.Service);
   function Pick return Integer is (SD_Trip.Pick);
   function Dest return Integer is (SD_Trip.Dest);
   function Seats return Integer is (SD_Trip.Seats);
   function Size return Integer is (SD_Trip.Size);
   function Pax return Integer is (SD_Trip.Pax);
   function Offer return Integer is (SD_Trip.Offer);
   function Suggested return Integer is (SD_Trip.Suggested);
   function Min_Offer return Integer is (SD_Trip.Min_Offer);
   function Distance_M return Integer is (SD_Trip.Distance_M);
   function Direct_M return Integer is (SD_Trip.Direct_M);
   function Route_Len return Integer is (SD_Trip.Route_Len);

   function Route_Lat_U (K : Integer) return Integer is
      P : constant Integer := SD_Trip.Route_Place (K);
   begin
      if P < 0 then
         return 0;
      end if;
      return SD_Geo.Lat (P);
   end Route_Lat_U;

   function Route_Lng_U (K : Integer) return Integer is
      P : constant Integer := SD_Trip.Route_Place (K);
   begin
      if P < 0 then
         return 0;
      end if;
      return SD_Geo.Lng (P);
   end Route_Lng_U;

   function Route_Place (K : Integer) return Integer is
     (SD_Trip.Route_Place (K));

   function Set_Service (I : Integer) return Integer is
     (SD_Trip.Set_Service (I));
   function Set_Pick (I : Integer) return Integer is (SD_Trip.Set_Pick (I));
   function Set_Dest (I : Integer) return Integer is (SD_Trip.Set_Dest (I));
   function Set_Seats (N : Integer) return Integer is (SD_Trip.Set_Seats (N));
   function Set_Size (N : Integer) return Integer is (SD_Trip.Set_Size (N));
   function Set_Pax (N : Integer) return Integer is (SD_Trip.Set_Pax (N));
   function Set_Offer (N : Integer) return Integer is (SD_Trip.Set_Offer (N));
   function Set_From_Airport (I : Integer) return Integer is
     (SD_Trip.Set_From_Airport (I));
   function Set_To_Airport (I : Integer) return Integer is
     (SD_Trip.Set_To_Airport (I));
   function From_Airport return Integer is (SD_Trip.From_Airport);
   function To_Airport return Integer is (SD_Trip.To_Airport);

   procedure Set_Contact_Len (N : Integer) is
   begin
      SD_Trip.Set_Contact_Len (N);
   end Set_Contact_Len;

   procedure Set_Contact_Char (I, Code : Integer) is
   begin
      SD_Trip.Set_Contact_Char (I, Code);
   end Set_Contact_Char;

   function Contact_Len return Integer is (SD_Trip.Contact_Len);
   function Contact_Char (I : Integer) return Integer is
     (SD_Trip.Contact_Char (I));

   procedure Set_Load_Len (N : Integer) is
   begin
      SD_Trip.Set_Load_Len (N);
   end Set_Load_Len;

   procedure Set_Load_Char (I, Code : Integer) is
   begin
      SD_Trip.Set_Load_Char (I, Code);
   end Set_Load_Char;

   function Load_Len return Integer is (SD_Trip.Load_Len);
   function Load_Char (I : Integer) return Integer is (SD_Trip.Load_Char (I));

   procedure Load_Sample is
   begin
      SD_Trip.Load_Sample;
   end Load_Sample;

   function Start_Sample return Integer is (SD_Trip.Start_Sample);
   function Request return Integer is (SD_Trip.Request);
   function Accept_Offer (Index : Integer) return Integer is
     (SD_Trip.Accept_Offer (Index));

   procedure Cancel is
   begin
      SD_Trip.Cancel;
   end Cancel;

   function Tick return Integer is (SD_Trip.Tick);
   function Status return Integer is (SD_Trip.Status);
   function Auto return Integer is (SD_Trip.Auto);
   function Error_Code return Integer is (SD_Trip.Error_Code);
   function Error_Len return Integer is (Len_Of (SD_Trip.Error_Text));
   function Error_Char (K : Integer) return Integer is
     (Char_Of (SD_Trip.Error_Text, K));
   function Banner_Len return Integer is (Len_Of (SD_Trip.Banner));
   function Banner_Char (K : Integer) return Integer is
     (Char_Of (SD_Trip.Banner, K));

   function Offer_Count return Integer is (SD_Trip.Offer_Count);
   function Offer_Name_Len (I : Integer) return Integer is
     (Len_Of (SD_Trip.Offer_Name (I)));
   function Offer_Name_Char (I, K : Integer) return Integer is
     (Char_Of (SD_Trip.Offer_Name (I), K));
   function Offer_Price (I : Integer) return Integer is
     (SD_Trip.Offer_Price (I));
   function Offer_Veh (I : Integer) return Integer is (SD_Trip.Offer_Veh (I));
   function Offer_Sim (I : Integer) return Integer is (SD_Trip.Offer_Sim (I));
   function Offer_Example (I : Integer) return Integer is
     (SD_Trip.Offer_Example (I));
   function Offer_Chosen (I : Integer) return Integer is
     (SD_Trip.Offer_Chosen (I));

   function Price return Integer is (SD_Trip.Price);
   function Driver_Lat_U return Integer is (SD_Trip.Driver_Lat);
   function Driver_Lng_U return Integer is (SD_Trip.Driver_Lng);
   function Driver_Name_Len return Integer is (Len_Of (SD_Trip.Driver_Name));
   function Driver_Name_Char (K : Integer) return Integer is
     (Char_Of (SD_Trip.Driver_Name, K));

   function Fleet_Count return Integer is (SD_Trip.Fleet_Count);
   function Fleet_Name_Len (I : Integer) return Integer is
     (Len_Of (SD_Trip.Fleet_Name (I)));
   function Fleet_Name_Char (I, K : Integer) return Integer is
     (Char_Of (SD_Trip.Fleet_Name (I), K));
   function Fleet_Lat_U (I : Integer) return Integer is (SD_Trip.Fleet_Lat (I));
   function Fleet_Lng_U (I : Integer) return Integer is (SD_Trip.Fleet_Lng (I));
   function Fleet_Veh (I : Integer) return Integer is (SD_Trip.Fleet_Veh (I));
   function Fleet_Home (I : Integer) return Integer is (SD_Trip.Fleet_Home (I));
   function Focus_Fleet return Integer is (SD_Trip.Focus_Fleet);

   function Sample_Driver_Len return Integer is
     (Len_Of (SD_Trip.Sample_Driver));
   function Sample_Driver_Char (K : Integer) return Integer is
     (Char_Of (SD_Trip.Sample_Driver, K));
   function Sample_Note_Len return Integer is (Len_Of (SD_Trip.Sample_Note));
   function Sample_Note_Char (K : Integer) return Integer is
     (Char_Of (SD_Trip.Sample_Note, K));
   function Quote_Note_Len return Integer is (Len_Of (SD_Trip.Quote_Note));
   function Quote_Note_Char (K : Integer) return Integer is
     (Char_Of (SD_Trip.Quote_Note, K));

   function Quote (Service, Meters, Seats, Size : Integer) return Integer is
     (SD_Fare.Quote (Service, Meters, Seats, Size));
   function Jet_Quote (From_I, To_I : Integer) return Integer is
     (SD_Trip.Jet_Quote (From_I, To_I));
   function Covered_M return Integer is (SD_Trip.Covered_M);
   function Leg_M return Integer is (SD_Trip.Leg_M);
end SD_API;
