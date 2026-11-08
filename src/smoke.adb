with Ada.Command_Line;
with Ada.Text_IO;

with SD_API;

--  Native checks of the same integers the browser reads from WebAssembly.
procedure Smoke is
   use Ada.Text_IO;

   Failed : Boolean := False;

   type Len0 is access function return Integer with Convention => C;
   type Char0 is access function (K : Integer) return Integer
     with Convention => C;
   type Len1 is access function (I : Integer) return Integer
     with Convention => C;
   type Char2 is access function (I, K : Integer) return Integer
     with Convention => C;

   procedure Check (Cond : Boolean; What : String) is
   begin
      if Cond then
         Put_Line ("  ok  " & What);
      else
         Put_Line ("FAIL  " & What);
         Failed := True;
      end if;
   end Check;

   function Chars (Len : Len0; Char : Char0) return String is
      N : constant Integer := Len.all;
      S : String (1 .. N);
   begin
      for K in S'Range loop
         S (K) := Character'Val (Char.all (K - 1));
      end loop;
      return S;
   end Chars;

   function Indexed (Len : Len1; Char : Char2; I : Integer) return String is
      N : constant Integer := Len.all (I);
      S : String (1 .. N);
   begin
      for K in S'Range loop
         S (K) := Character'Val (Char.all (I, K - 1));
      end loop;
      return S;
   end Indexed;

   function Place (I : Integer) return String is
     (Indexed (SD_API.Place_Name_Len'Access, SD_API.Place_Name_Char'Access, I));

   function Offer_Name (I : Integer) return String is
     (Indexed (SD_API.Offer_Name_Len'Access, SD_API.Offer_Name_Char'Access, I));

   function Driver return String is
     (Chars (SD_API.Driver_Name_Len'Access, SD_API.Driver_Name_Char'Access));

   function Contact return String is
     (Chars (SD_API.Contact_Len'Access, SD_API.Contact_Char'Access));

   function Load_Text return String is
     (Chars (SD_API.Load_Len'Access, SD_API.Load_Char'Access));

   function Banner return String is
     (Chars (SD_API.Banner_Len'Access, SD_API.Banner_Char'Access));

   function Note return String is
     (Chars (SD_API.Quote_Note_Len'Access, SD_API.Quote_Note_Char'Access));

   function Sample_Driver return String is
     (Chars (SD_API.Sample_Driver_Len'Access, SD_API.Sample_Driver_Char'Access));

   procedure Drive_To_Done (What : String) is
      St : Integer := 0;
      N  : Integer := 0;
   begin
      loop
         St := SD_API.Tick;
         N := N + 1;
         exit when St = 6 or else St = 7 or else N > 1000;
      end loop;
      Check (St = 6 and then N < 1000, What & " reaches done");
   end Drive_To_Done;

   procedure Set_Load (Text : String) is
   begin
      for I in Text'Range loop
         SD_API.Set_Load_Char (I - Text'First, Character'Pos (Text (I)));
      end loop;
      SD_API.Set_Load_Len (Text'Length);
   end Set_Load;
begin
   Check (SD_API.Ready = 1, "ready");
   Check (SD_API.Logic_Version = 1, "logic version");
   Check
     (Banner = "SYNTHETIC DEMO - not a real booking or payment",
      "banner");
   Check (Sample_Driver = "Osaro", "sample driver name");
   Check
     (Chars (SD_API.Sample_Note_Len'Access, SD_API.Sample_Note_Char'Access)
        = "simulated driver",
      "sample note");
   Check (Place (7) = "Oba Market", "Oba Market");
   Check (Place (8) = "National Museum", "National Museum");
   Check (Place (10) = "King's Square", "King's Square");
   Check (SD_API.Place_Pickable (7) = 1, "Oba is pickable");
   Check (SD_API.Place_Pickable (10) = 0, "junction is not a pickup list item");
   Check (Contact = "08000000000", "synthetic phone");
   Check (Load_Text = "synthetic sample crates", "synthetic load");

   Check (SD_API.Direct_M = 451, "direct Oba to Museum is 451 m");
   Check (SD_API.Distance_M = 461, "routed Oba to Museum is 461 m");
   Check (SD_API.Direct_M /= SD_API.Distance_M, "route is not the straight line");
   Check (SD_API.Route_Len = 3, "sample route has a waypoint");
   Check (SD_API.Route_Place (0) = 7, "route starts at Oba");
   Check (SD_API.Route_Place (1) = 10, "route via King's Square");
   Check (SD_API.Route_Place (2) = 8, "route ends at the Museum");
   Check (SD_API.Suggested = 1_500, "sample ride fare 1500");
   Check (SD_API.Min_Offer = 1_050, "minimum offer 1050");
   Check (SD_API.Offer = 1_500, "default offer is the suggestion");
   Check (SD_API.Fleet_Home (0) = 9, "Osaro starts at Ring Road");
   Check
     (SD_API.Fleet_Lat_U (0) = SD_API.Place_Lat_U (9)
        and then SD_API.Fleet_Lng_U (0) = SD_API.Place_Lng_U (9),
      "Osaro home coordinates");

   Check (SD_API.Quote (0, 20_000, 1, 0) = 5_600, "20 km ride is 5600");
   Check (SD_API.Quote (3, 20_000, 1, 0) = 21_000, "20 km truck is 21000");
   Check (SD_API.Quote (1, 7_350, 6, 0) = 5_350, "bus quote");
   Check (SD_API.Quote (2, 7_350, 1, 1) = 1_700, "dispatch medium quote");
   Check (SD_API.Quote (0, 7_350, 1, 0) = 2_450, "long ride quote");
   Check (SD_API.Quote (4, 1_000, 1, 0) = 0, "jet has no fixed fare");
   Check (SD_API.Jet_Quote (0, 1) = 18_500_000, "domestic example quote");
   Check (SD_API.Jet_Quote (0, 3) = 32_000_000, "Accra example quote");

   Check (SD_API.Set_Offer (1_000) = 0, "set a low offer");
   Check (SD_API.Request = 2, "offer below 70 percent is rejected");
   Check (SD_API.Status = 0, "rejected request stays idle");
   Check (SD_API.Offer_Count = 0, "rejected request has no offers");
   Check
     (Chars (SD_API.Error_Len'Access, SD_API.Error_Char'Access)
        = "Offer is below 70 percent of the suggested fare.",
      "low-offer text");
   Check (SD_API.Set_Offer (1_050) = 0, "set the minimum");
   Check (SD_API.Request = 0, "minimum offer is accepted by the rules");
   Check (SD_API.Offer_Count = 3, "three car offers");

   SD_API.Load_Sample;
   Check (SD_API.Set_Dest (7) = 0, "same place");
   Check (SD_API.Request = 1, "identical ends rejected");

   SD_API.Load_Sample;
   Check (SD_API.Set_Pick (0) = 0 and then SD_API.Set_Dest (8) = 0, "long ends");
   Check (SD_API.Distance_M = 5_347, "Ikpoba to Museum is 5347 m");
   Check (SD_API.Suggested = 1_950, "that ride is 1950, above the minimum");
   Check (SD_API.Route_Len = 7, "long route hop count");
   Check (SD_API.Route_Place (0) = 0, "long route start");
   Check (SD_API.Route_Place (1) = 12, "long route airport road");
   Check (SD_API.Route_Place (2) = 4, "long route motor park");
   Check (SD_API.Route_Place (3) = 5, "long route vegetable market");
   Check (SD_API.Route_Place (4) = 11, "long route Akpakpava");
   Check (SD_API.Route_Place (5) = 10, "long route King's Square");
   Check (SD_API.Route_Place (6) = 8, "long route museum");

   declare
      Bad : Integer := 0;
   begin
      for A in 0 .. 8 loop
         for B in 0 .. 8 loop
            if A /= B then
               if SD_API.Set_Pick (A) /= 0 or else SD_API.Set_Dest (B) /= 0
                 or else SD_API.Distance_M not in 1 .. 100_000
               then
                  Bad := Bad + 1;
               end if;
            end if;
         end loop;
      end loop;
      Check (Bad = 0, "every landmark pair has a schematic route");
   end;

   SD_API.Load_Sample;
   Check (SD_API.Start_Sample = 0, "sample starts");
   Check (SD_API.Status = 2, "sample is in offers");
   Check (SD_API.Auto = 1, "sample accepts on its own");
   Check (SD_API.Offer_Count = 3, "Osaro, Efosa, Ada");
   Check (Offer_Name (0) = "Osaro", "first offer Osaro");
   Check (SD_API.Offer_Price (0) = 1_500, "Osaro offers 1500");
   Check (SD_API.Offer_Sim (0) = 1, "Osaro is simulated");
   Check (Offer_Name (1) = "Efosa", "second offer");
   Check (SD_API.Offer_Price (1) = 1_650, "Efosa counters 1650");
   Check (Offer_Name (2) = "Ada", "third offer");
   Check (SD_API.Offer_Price (2) = 1_800, "third counter 1800");
   Drive_To_Done ("sample");
   Check (SD_API.Price = 1_500, "agreed 1500");
   Check (Driver = "Osaro", "accepted driver");
   Check
     (SD_API.Driver_Lat_U = SD_API.Place_Lat_U (8)
        and then SD_API.Driver_Lng_U = SD_API.Place_Lng_U (8),
      "Osaro finishes at the Museum");
   Check (SD_API.Tick = 6, "done stays done");
   SD_API.Load_Sample;
   Check
     (SD_API.Fleet_Lat_U (0) = SD_API.Place_Lat_U (9),
      "Osaro returns home after reset");

   SD_API.Load_Sample;
   Check (SD_API.Set_Service (1) = 0, "bus");
   Check (SD_API.Set_Seats (6) = 0, "six seats");
   Check (SD_API.Suggested = 2_400, "bus fare 2400");
   Check (SD_API.Request = 0, "bus request");
   Check (Offer_Name (0) = "Osas" and then SD_API.Offer_Price (0) = 2_400,
          "Osas at the customer price");
   Check (Offer_Name (1) = "Uyi" and then SD_API.Offer_Price (1) = 2_650,
          "Uyi counter");

   SD_API.Load_Sample;
   Check (SD_API.Set_Service (2) = 0, "dispatch");
   SD_API.Set_Contact_Len (0);
   Check (SD_API.Request = 4, "dispatch needs a phone");
   SD_API.Load_Sample;
   Check (SD_API.Set_Service (2) = 0, "dispatch again");
   Check (SD_API.Set_Size (1) = 0, "medium parcel");
   Check (SD_API.Suggested = 850, "medium dispatch fare 850");
   Check (SD_API.Request = 0, "dispatch request");
   Check (Offer_Name (0) = "Ehi" and then SD_API.Offer_Price (0) = 850, "Ehi");
   Check (SD_API.Accept_Offer (0) = 0, "accept Ehi");
   Drive_To_Done ("dispatch");
   Check (SD_API.Price = 850 and then Driver = "Ehi", "Ehi completed");

   SD_API.Load_Sample;
   Check (SD_API.Set_Service (3) = 0, "truck");
   SD_API.Set_Load_Len (0);
   Check (SD_API.Request = 5, "truck needs a load");
   Set_Load ("boxes");
   Check (SD_API.Request = 0, "truck request");
   Check (SD_API.Suggested = 15_000, "truck minimum");
   Check (Offer_Name (0) = "Eki" and then SD_API.Offer_Price (0) = 15_000, "Eki");

   SD_API.Load_Sample;
   Check (SD_API.Set_Service (4) = 0, "jet");
   Check (SD_API.Set_Pax (13) = 0, "too many passengers stored");
   Check (SD_API.Request = 6, "13 passengers rejected");
   Check (SD_API.Set_Pax (4) = 0, "four passengers");
   Check (SD_API.Request = 0, "domestic charter request");
   Check (SD_API.Offer_Example (0) = 1, "example flag");
   Check (SD_API.Offer_Price (0) = 18_500_000, "domestic quote");
   Check (Offer_Name (0) = "Demo charter operator", "operator name");
   Check (Note = "EXAMPLE QUOTE - not a real price", "example label");
   Check (SD_API.Set_To_Airport (3) = 0, "Accra");
   Check (SD_API.Request = 0, "international request");
   Check (SD_API.Offer_Price (0) = 32_000_000, "Accra quote");
   Check (SD_API.Accept_Offer (0) = 0, "accept example quote");
   Drive_To_Done ("jet");
   Check (SD_API.Price = 32_000_000, "agreed example quote");

   Check
     (Indexed (SD_API.Service_Name_Len'Access, SD_API.Service_Name_Char'Access, 0)
        = "Ride",
      "service Ride");
   Check
     (Indexed (SD_API.Service_Name_Len'Access, SD_API.Service_Name_Char'Access, 4)
        = "Private jet",
      "service Private jet");

   if Failed then
      Put_Line ("smoke failed");
      Ada.Command_Line.Set_Exit_Status (Ada.Command_Line.Failure);
   else
      Put_Line ("smoke passed");
   end if;
end Smoke;
