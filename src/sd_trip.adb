with SD_Fare;
with SD_Geo;
with SD_Types;

package body SD_Trip is
   pragma Suppress (Overflow_Check);
   use SD_Types;

   Offer_Hold   : constant := 25;
   Accept_Pause : constant := 5;
   Step_M       : constant := 50;

   Svc             : Integer := Ride;
   Cur_Pick        : Integer := Integer (Pick_Oba);
   Cur_Dest        : Integer := Integer (Dest_Museum);
   Cur_Seats       : Integer := 2;
   Cur_Size        : Integer := 0;
   Cur_Pax         : Integer := 2;
   Customer_Offer  : Integer := 0;
   Offer_Touched   : Boolean := False;
   Phase           : Integer := St_Idle;
   Auto_Play       : Integer := 0;
   Err             : Integer := Ok;
   Chosen          : Integer := -1;
   Active_Fleet    : Integer := -1;
   Agreed_Price    : Integer := 0;
   Hold            : Integer := 0;
   Driver_Lat_U    : Integer := 0;
   Driver_Lng_U    : Integer := 0;
   Covered_Now     : Integer := 0;
   Leg_Now         : Integer := 0;
   Progress        : Integer := 0;
   From_Air        : Integer := 0;
   To_Air          : Integer := 1;

   Phone     : String (1 .. 16) := (others => ' ');
   Phone_Len : Natural := 0;
   Load_Buf  : String (1 .. 80) := (others => ' ');
   Load_Len_N : Natural := 0;

   Plan_Trail    : SD_Geo.Trail := (others => 0);
   Plan_Len      : Natural := 0;
   Plan_Meters   : Integer := 0;
   Plan_Suggested : Integer := 0;

   Trip_Trail   : SD_Geo.Trail := (others => 0);
   Trip_Len     : Natural := 0;
   Trip_Meters  : Integer := 0;
   Trip_Suggested : Integer := 0;
   Trip_Customer : Integer := 0;

   Approach       : SD_Geo.Trail := (others => 0);
   Approach_Len   : Natural := 0;
   Approach_Meters : Integer := 0;

   type Offer_Rec is record
      Fleet   : Integer := -1;
      Price   : Integer := 0;
      Veh     : Integer := 0;
      Example : Boolean := False;
   end record;

   Offers  : array (0 .. 2) of Offer_Rec;
   Offer_N : Natural := 0;

   Homes : constant array (0 .. 11) of Integer :=
     (9, 11, 5, 0, 3, 4, 2, 12, 6, 1, 10, 8);
   Vehs : constant array (0 .. 11) of Integer :=
     (Veh_Car, Veh_Car, Veh_Bike, Veh_Bike, Veh_Bike,
      Veh_Bus, Veh_Bus, Veh_Truck, Veh_Car, Veh_Bike,
      Veh_Car, Veh_Truck);
   Cur_Lat : array (0 .. 11) of Integer := (others => 0);
   Cur_Lng : array (0 .. 11) of Integer := (others => 0);

   function Logic_Version return Integer is (1);
   function Service_Count return Integer is (5);

   function Service_Name (I : Integer) return String is
   begin
      case I is
         when Ride => return "Ride";
         when Bus => return "Group bus";
         when Dispatch => return "Dispatch rider";
         when Truck => return "Truck";
         when Jet => return "Private jet";
         when others => return "";
      end case;
   end Service_Name;

   function Service return Integer is (Svc);
   function Pick return Integer is (Cur_Pick);
   function Dest return Integer is (Cur_Dest);
   function Seats return Integer is (Cur_Seats);
   function Size return Integer is (Cur_Size);
   function Pax return Integer is (Cur_Pax);
   function Offer return Integer is (Customer_Offer);
   function From_Airport return Integer is (From_Air);
   function To_Airport return Integer is (To_Air);
   function Status return Integer is (Phase);
   function Auto return Integer is (Auto_Play);
   function Error_Code return Integer is (Err);
   function Covered_M return Integer is (Covered_Now);
   function Leg_M return Integer is (Leg_Now);
   function Driver_Lat return Integer is (Driver_Lat_U);
   function Driver_Lng return Integer is (Driver_Lng_U);

   function Banner return String is
     ("SYNTHETIC DEMO - not a real booking or payment");

   function Sample_Driver return String is ("Osaro");

   function Sample_Note return String is ("simulated driver");

   function Quote_Note return String is
     ("EXAMPLE QUOTE - not a real price");

   function Fleet_Count return Integer is (12);

   --  Names are the v0.2 simulated roster. "Ada" here is a driver's name.
   function Fleet_Name (I : Integer) return String is
   begin
      case I is
         when 0 => return "Osaro";
         when 1 => return "Efosa";
         when 2 => return "Ehi";
         when 3 => return "Nosa";
         when 4 => return "Ivie";
         when 5 => return "Osas";
         when 6 => return "Uyi";
         when 7 => return "Eki";
         when 8 => return "Ada";
         when 9 => return "Femi";
         when 10 => return "Tunde";
         when 11 => return "Bisi";
         when others => return "";
      end case;
   end Fleet_Name;

   function Fleet_Lat (I : Integer) return Integer is
   begin
      if I not in Cur_Lat'Range then
         return 0;
      end if;
      return Cur_Lat (I);
   end Fleet_Lat;

   function Fleet_Lng (I : Integer) return Integer is
   begin
      if I not in Cur_Lng'Range then
         return 0;
      end if;
      return Cur_Lng (I);
   end Fleet_Lng;

   function Fleet_Veh (I : Integer) return Integer is
   begin
      if I not in Vehs'Range then
         return -1;
      end if;
      return Vehs (I);
   end Fleet_Veh;

   function Fleet_Home (I : Integer) return Integer is
   begin
      if I not in Homes'Range then
         return -1;
      end if;
      return Homes (I);
   end Fleet_Home;

   function Error_Text return String is
   begin
      case Err is
         when Err_Same =>
            return "Choose two different places.";
         when Err_Low =>
            return "Offer is below 70 percent of the suggested fare.";
         when Err_Seats =>
            return "Seats must be from 1 to 18.";
         when Err_Phone =>
            return "Enter a phone number of 7 to 15 digits.";
         when Err_Load =>
            return "Describe the load.";
         when Err_Pax =>
            return "Passengers must be from 1 to 12.";
         when Err_Route =>
            return "Those places are not connected on the schematic map.";
         when Err_Ends =>
            return "Enter from and to.";
         when others =>
            return "";
      end case;
   end Error_Text;

   function Showing_Trip return Boolean is
     (Phase /= St_Idle and then Phase /= St_Cancelled);

   function Suggested return Integer is
   begin
      if Showing_Trip then
         return Trip_Suggested;
      end if;
      return Plan_Suggested;
   end Suggested;

   function Min_Offer return Integer is
     (SD_Fare.Min_Offer (Suggested));

   function Distance_M return Integer is
   begin
      if Showing_Trip then
         return Trip_Meters;
      end if;
      if Plan_Meters < 0 then
         return 0;
      end if;
      return Plan_Meters;
   end Distance_M;

   function Direct_M return Integer is
      D : constant Integer := SD_Geo.Road_Meters (Cur_Pick, Cur_Dest);
   begin
      if D >= SD_Geo.Unreachable then
         return 0;
      end if;
      return D;
   end Direct_M;

   function Route_Len return Integer is
   begin
      if Showing_Trip then
         return Integer (Trip_Len);
      end if;
      return Integer (Plan_Len);
   end Route_Len;

   function Route_Place (K : Integer) return Integer is
   begin
      if Showing_Trip then
         if K < 0 or else K >= Integer (Trip_Len) then
            return -1;
         end if;
         return Integer (Trip_Trail (K));
      end if;
      if K < 0 or else K >= Integer (Plan_Len) then
         return -1;
      end if;
      return Integer (Plan_Trail (K));
   end Route_Place;

   function Price return Integer is
   begin
      if Chosen >= 0 then
         return Agreed_Price;
      end if;
      return Customer_Offer;
   end Price;

   procedure Write_Buf
     (Buf : in out String; Len : in out Natural; Text : String)
   is
   begin
      Buf := (others => ' ');
      Len := Text'Length;
      if Len > Buf'Length then
         Len := Buf'Length;
      end if;
      if Len > 0 then
         Buf (Buf'First .. Buf'First + Len - 1) :=
           Text (Text'First .. Text'First + Len - 1);
      end if;
   end Write_Buf;

   function Load_Slice return String is
   begin
      if Load_Len_N = 0 then
         return "";
      end if;
      return Load_Buf (1 .. Load_Len_N);
   end Load_Slice;

   function Blank (S : String) return Boolean is
   begin
      for C of S loop
         if C /= ' ' then
            return False;
         end if;
      end loop;
      return True;
   end Blank;

   function Phone_OK return Boolean is
      Digit_Count : Natural := 0;
   begin
      if Phone_Len < 7 or else Phone_Len > 16 then
         return False;
      end if;
      for I in 1 .. Phone_Len loop
         if Phone (I) = '+' then
            if I /= 1 then
               return False;
            end if;
         elsif Phone (I) not in '0' .. '9' then
            return False;
         else
            Digit_Count := Digit_Count + 1;
         end if;
      end loop;
      return Digit_Count in 7 .. 15;
   end Phone_OK;

   procedure Restore_Fleet is
   begin
      for I in Cur_Lat'Range loop
         Cur_Lat (I) := SD_Geo.Lat (Homes (I));
         Cur_Lng (I) := SD_Geo.Lng (Homes (I));
      end loop;
   end Restore_Fleet;

   procedure Place_Driver (Lat_U, Lng_U : Integer) is
   begin
      Driver_Lat_U := Lat_U;
      Driver_Lng_U := Lng_U;
      if Active_Fleet in Cur_Lat'Range then
         Cur_Lat (Active_Fleet) := Lat_U;
         Cur_Lng (Active_Fleet) := Lng_U;
      end if;
   end Place_Driver;

   function Trail_Meters
     (Trail : SD_Geo.Trail; Len : Natural) return Integer
   is
      Sum : Integer := 0;
   begin
      if Len < 2 then
         return 0;
      end if;
      for I in 0 .. Len - 2 loop
         Sum := Sum + SD_Geo.Road_Meters
           (Integer (Trail (I)), Integer (Trail (I + 1)));
      end loop;
      return Sum;
   end Trail_Meters;

   procedure Place_Along
     (Trail : SD_Geo.Trail; Len : Natural; Dist_M : Integer)
   is
      Remain                 : Integer := Dist_M;
      Seg                    : Integer;
      Lat1, Lng1, Lat2, Lng2 : Integer;
      Num                    : Integer;
   begin
      if Len = 0 then
         return;
      end if;
      if Len = 1 or else Dist_M <= 0 then
         Place_Driver
           (SD_Geo.Lat (Integer (Trail (0))),
            SD_Geo.Lng (Integer (Trail (0))));
         return;
      end if;
      for I in 0 .. Len - 2 loop
         Seg := SD_Geo.Road_Meters
           (Integer (Trail (I)), Integer (Trail (I + 1)));
         if Remain <= Seg or else I = Len - 2 then
            Lat1 := SD_Geo.Lat (Integer (Trail (I)));
            Lng1 := SD_Geo.Lng (Integer (Trail (I)));
            Lat2 := SD_Geo.Lat (Integer (Trail (I + 1)));
            Lng2 := SD_Geo.Lng (Integer (Trail (I + 1)));
            if Seg <= 0 then
               Place_Driver (Lat2, Lng2);
            else
               Num := Remain;
               if Num > Seg then
                  Num := Seg;
               end if;
               if Num < 0 then
                  Num := 0;
               end if;
               Place_Driver
                 (Lat1 + Integer
                    ((Long_Long_Integer (Lat2 - Lat1) * Long_Long_Integer (Num))
                     / Long_Long_Integer (Seg)),
                  Lng1 + Integer
                    ((Long_Long_Integer (Lng2 - Lng1) * Long_Long_Integer (Num))
                     / Long_Long_Integer (Seg)));
            end if;
            return;
         end if;
         Remain := Remain - Seg;
      end loop;
   end Place_Along;

   procedure Recompute is
      Dist : Integer;
   begin
      if Cur_Pick = Cur_Dest then
         Plan_Len := 1;
         Plan_Trail (0) := SD_Geo.Node (Cur_Pick);
         Plan_Meters := 0;
      else
         SD_Geo.Shortest
           (Cur_Pick, Cur_Dest, Dist, Plan_Trail, Plan_Len);
         if Dist >= SD_Geo.Unreachable or else Plan_Len < 2 then
            Plan_Meters := -1;
            Plan_Len := 0;
         else
            Plan_Meters := Dist;
         end if;
      end if;
      if Plan_Meters < 0 then
         Plan_Suggested := SD_Fare.Quote (Svc, 0, Cur_Seats, Cur_Size);
      else
         Plan_Suggested :=
           SD_Fare.Quote (Svc, Plan_Meters, Cur_Seats, Cur_Size);
      end if;
      if not Offer_Touched then
         Customer_Offer := Plan_Suggested;
      end if;
   end Recompute;

   function Veh_For (S : Integer) return Integer is
   begin
      case S is
         when Bus => return Veh_Bus;
         when Dispatch => return Veh_Bike;
         when Truck => return Veh_Truck;
         when Jet => return Veh_Jet;
         when others => return Veh_Car;
      end case;
   end Veh_For;

   function Contains (Hay, Needle : String) return Boolean is
   begin
      if Needle'Length = 0 or else Hay'Length < Needle'Length then
         return False;
      end if;
      for I in Hay'First .. Hay'Last - Needle'Length + 1 loop
         if Hay (I .. I + Needle'Length - 1) = Needle then
            return True;
         end if;
      end loop;
      return False;
   end Contains;

   function Airport_Token (I : Integer) return Boolean is
      U : String := SD_Geo.Airport_Name (I);
   begin
      if U'Length = 0 then
         return False;
      end if;
      for J in U'Range loop
         if U (J) in 'a' .. 'z' then
            U (J) := Character'Val (Character'Pos (U (J)) - 32);
         end if;
      end loop;
      return Contains (U, "ACC") or else Contains (U, "GHANA");
   end Airport_Token;

   function Jet_Quote (From_I, To_I : Integer) return Integer is
   begin
      if Airport_Token (From_I) or else Airport_Token (To_I) then
         return 32_000_000;
      end if;
      return 18_500_000;
   end Jet_Quote;

   procedure Build_Offers is
      N    : Natural := 0;
      Want : Integer;
   begin
      Offer_N := 0;
      if Svc = Jet then
         Offers (0) :=
           (Fleet => -1, Price => Jet_Quote (From_Air, To_Air),
            Veh => Veh_Jet, Example => True);
         Offer_N := 1;
         return;
      end if;
      Want := Veh_For (Svc);
      for I in Vehs'Range loop
         if Vehs (I) = Want and then N <= Offers'Last then
            Offers (N).Fleet := I;
            Offers (N).Veh := Want;
            Offers (N).Example := False;
            if N = 0 then
               Offers (N).Price := Trip_Customer;
            else
               Offers (N).Price :=
                 SD_Fare.Counter (Trip_Customer, 100 + 10 * Integer (N));
            end if;
            N := N + 1;
         end if;
      end loop;
      Offer_N := N;
   end Build_Offers;

   function Offer_Count return Integer is (Integer (Offer_N));

   function Offer_Name (I : Integer) return String is
   begin
      if I < 0 or else I >= Integer (Offer_N) then
         return "";
      end if;
      if Offers (I).Fleet < 0 then
         return "Demo charter operator";
      end if;
      return Fleet_Name (Offers (I).Fleet);
   end Offer_Name;

   function Offer_Price (I : Integer) return Integer is
   begin
      if I < 0 or else I >= Integer (Offer_N) then
         return 0;
      end if;
      return Offers (I).Price;
   end Offer_Price;

   function Offer_Veh (I : Integer) return Integer is
   begin
      if I < 0 or else I >= Integer (Offer_N) then
         return -1;
      end if;
      return Offers (I).Veh;
   end Offer_Veh;

   function Offer_Sim (I : Integer) return Integer is
   begin
      if I < 0 or else I >= Integer (Offer_N) then
         return 0;
      end if;
      return 1;
   end Offer_Sim;

   function Offer_Example (I : Integer) return Integer is
   begin
      if I < 0 or else I >= Integer (Offer_N) then
         return 0;
      end if;
      if Offers (I).Example then
         return 1;
      end if;
      return 0;
   end Offer_Example;

   function Offer_Chosen (I : Integer) return Integer is
   begin
      if I = Chosen and then I >= 0 then
         return 1;
      end if;
      return 0;
   end Offer_Chosen;

   function Driver_Name return String is
   begin
      if Chosen < 0 then
         return "";
      end if;
      return Offer_Name (Chosen);
   end Driver_Name;

   function Focus_Fleet return Integer is
   begin
      if Active_Fleet >= 0 then
         return Active_Fleet;
      end if;
      if Offer_N > 0 then
         return Offers (0).Fleet;
      end if;
      return 0;
   end Focus_Fleet;

   procedure Clear_Motion is
   begin
      Chosen := -1;
      Active_Fleet := -1;
      Agreed_Price := 0;
      Driver_Lat_U := 0;
      Driver_Lng_U := 0;
      Covered_Now := 0;
      Leg_Now := 0;
      Progress := 0;
      Hold := 0;
      Offer_N := 0;
      Trip_Len := 0;
      Trip_Meters := 0;
   end Clear_Motion;

   procedure Load_Sample is
   begin
      Svc := Ride;
      Cur_Pick := Integer (Pick_Oba);
      Cur_Dest := Integer (Dest_Museum);
      Cur_Seats := 2;
      Cur_Size := 0;
      Cur_Pax := 2;
      From_Air := 0;
      To_Air := 1;
      Offer_Touched := False;
      Write_Buf (Phone, Phone_Len, "08000000000");
      Write_Buf (Load_Buf, Load_Len_N, "synthetic sample crates");
      Phase := St_Idle;
      Err := Ok;
      Auto_Play := 0;
      Clear_Motion;
      Restore_Fleet;
      Recompute;
   end Load_Sample;

   function Request return Integer is
      Code : Integer := Ok;
   begin
      Auto_Play := 0;
      Phase := St_Idle;
      Err := Ok;
      Clear_Motion;
      Restore_Fleet;
      Recompute;

      if Svc = Jet then
         if Cur_Pax < 1 or else Cur_Pax > 12 then
            Code := Err_Pax;
         elsif From_Air not in 0 .. 5 or else To_Air not in 0 .. 5 then
            Code := Err_Ends;
         elsif not Phone_OK then
            Code := Err_Phone;
         end if;
      elsif Svc = Bus and then (Cur_Seats < 1 or else Cur_Seats > 18) then
         Code := Err_Seats;
      elsif Svc = Dispatch and then not Phone_OK then
         Code := Err_Phone;
      elsif Svc = Truck and then Blank (Load_Slice) then
         Code := Err_Load;
      elsif Cur_Pick = Cur_Dest or else Plan_Len < 2 then
         Code := Err_Same;
      elsif Plan_Meters < 0 then
         Code := Err_Route;
      elsif Customer_Offer < SD_Fare.Min_Offer (Plan_Suggested) then
         Code := Err_Low;
      end if;

      Err := Code;
      if Code /= Ok then
         return Code;
      end if;

      Trip_Suggested := Plan_Suggested;
      Trip_Customer := Customer_Offer;
      if Svc = Jet then
         Trip_Len := 0;
         Trip_Meters := 0;
      else
         Trip_Trail := Plan_Trail;
         Trip_Len := Plan_Len;
         if Plan_Meters < 0 then
            Trip_Meters := 0;
         else
            Trip_Meters := Plan_Meters;
         end if;
      end if;
      Build_Offers;
      if Offer_N = 0 then
         Phase := St_Requested;
      else
         Phase := St_Offers;
      end if;
      return Ok;
   end Request;

   function Start_Sample return Integer is
      Code : Integer;
   begin
      Load_Sample;
      Code := Request;
      if Code = Ok then
         Auto_Play := 1;
         Hold := 0;
      end if;
      return Code;
   end Start_Sample;

   procedure Finish is
   begin
      Phase := St_Done;
      Auto_Play := 0;
      if Trip_Len >= 1 then
         Place_Driver
           (SD_Geo.Lat (Integer (Trip_Trail (Trip_Len - 1))),
            SD_Geo.Lng (Integer (Trip_Trail (Trip_Len - 1))));
      end if;
      if Leg_Now > 0 then
         Covered_Now := Leg_Now;
         Progress := Leg_Now;
      end if;
   end Finish;

   procedure Begin_Move is
   begin
      Phase := St_Moving;
      Progress := 0;
      Covered_Now := 0;
      Leg_Now := Trail_Meters (Trip_Trail, Trip_Len);
      if Leg_Now <= 0 or else Trip_Len < 2 then
         Finish;
         return;
      end if;
      Place_Along (Trip_Trail, Trip_Len, 0);
   end Begin_Move;

   procedure Begin_Arrive is
      Dist_Tmp : Integer;
   begin
      if Active_Fleet not in Homes'Range then
         Begin_Move;
         return;
      end if;
      SD_Geo.Shortest
        (Homes (Active_Fleet), Cur_Pick, Dist_Tmp, Approach, Approach_Len);
      Approach_Meters := Trail_Meters (Approach, Approach_Len);
      if Approach_Len < 2 or else Approach_Meters <= 0
        or else Dist_Tmp >= SD_Geo.Unreachable
      then
         Begin_Move;
         return;
      end if;
      Phase := St_Arriving;
      Progress := 0;
      Covered_Now := 0;
      Leg_Now := Approach_Meters;
      Place_Along (Approach, Approach_Len, 0);
   end Begin_Arrive;

   function Accept_Offer (Index : Integer) return Integer is
   begin
      if Index < 0 or else Index >= Integer (Offer_N) then
         return 1;
      end if;
      if Phase /= St_Offers and then Phase /= St_Requested then
         return 1;
      end if;
      Chosen := Index;
      Agreed_Price := Offers (Index).Price;
      Active_Fleet := Offers (Index).Fleet;
      Hold := 0;
      Phase := St_Accepted;
      if Active_Fleet in Cur_Lat'Range then
         Place_Driver (Cur_Lat (Active_Fleet), Cur_Lng (Active_Fleet));
      end if;
      return 0;
   end Accept_Offer;

   procedure Cancel is
   begin
      Phase := St_Cancelled;
      Auto_Play := 0;
      Active_Fleet := -1;
      Driver_Lat_U := 0;
      Driver_Lng_U := 0;
      Restore_Fleet;
   end Cancel;

   function Tick return Integer is
   begin
      if Phase = St_Offers and then Auto_Play = 1 then
         Hold := Hold + 1;
         if Hold >= Offer_Hold then
            if Accept_Offer (0) /= 0 then
               Phase := St_Cancelled;
            end if;
         end if;
         return Phase;
      elsif Phase = St_Accepted then
         Hold := Hold + 1;
         if Hold >= Accept_Pause then
            if Svc = Jet then
               Finish;
            else
               Begin_Arrive;
            end if;
         end if;
         return Phase;
      elsif Phase = St_Arriving then
         Progress := Progress + Step_M;
         if Progress >= Leg_Now then
            Begin_Move;
         else
            Covered_Now := Progress;
            Place_Along (Approach, Approach_Len, Progress);
         end if;
         return Phase;
      elsif Phase = St_Moving then
         Progress := Progress + Step_M;
         if Progress >= Leg_Now then
            Progress := Leg_Now;
            Finish;
         else
            Covered_Now := Progress;
            Place_Along (Trip_Trail, Trip_Len, Progress);
         end if;
         return Phase;
      end if;
      return Phase;
   end Tick;

   function Set_Service (I : Integer) return Integer is
   begin
      if I < Ride or else I > Jet then
         return 1;
      end if;
      Svc := I;
      Offer_Touched := False;
      Recompute;
      return 0;
   end Set_Service;

   function Set_Pick (I : Integer) return Integer is
   begin
      if I < Integer (SD_Geo.Node'First)
        or else I > Integer (SD_Geo.Node'Last)
      then
         return 1;
      end if;
      Cur_Pick := I;
      Offer_Touched := False;
      Recompute;
      return 0;
   end Set_Pick;

   function Set_Dest (I : Integer) return Integer is
   begin
      if I < Integer (SD_Geo.Node'First)
        or else I > Integer (SD_Geo.Node'Last)
      then
         return 1;
      end if;
      Cur_Dest := I;
      Offer_Touched := False;
      Recompute;
      return 0;
   end Set_Dest;

   function Set_Seats (N : Integer) return Integer is
   begin
      Cur_Seats := N;
      Offer_Touched := False;
      Recompute;
      return 0;
   end Set_Seats;

   function Set_Size (N : Integer) return Integer is
   begin
      if N < 0 then
         Cur_Size := 0;
      elsif N > 2 then
         Cur_Size := 2;
      else
         Cur_Size := N;
      end if;
      Offer_Touched := False;
      Recompute;
      return 0;
   end Set_Size;

   function Set_Pax (N : Integer) return Integer is
   begin
      Cur_Pax := N;
      return 0;
   end Set_Pax;

   function Set_Offer (N : Integer) return Integer is
   begin
      Offer_Touched := True;
      if N < 0 then
         Customer_Offer := 0;
      else
         Customer_Offer := N;
      end if;
      return 0;
   end Set_Offer;

   function Set_From_Airport (I : Integer) return Integer is
   begin
      if I not in 0 .. 5 then
         return 1;
      end if;
      From_Air := I;
      return 0;
   end Set_From_Airport;

   function Set_To_Airport (I : Integer) return Integer is
   begin
      if I not in 0 .. 5 then
         return 1;
      end if;
      To_Air := I;
      return 0;
   end Set_To_Airport;

   procedure Set_Contact_Len (N : Integer) is
   begin
      if N <= 0 then
         Phone_Len := 0;
      elsif N >= Phone'Length then
         Phone_Len := Phone'Length;
      else
         Phone_Len := N;
      end if;
   end Set_Contact_Len;

   procedure Set_Contact_Char (I, Code : Integer) is
   begin
      if I < 0 or else I >= Phone'Length then
         return;
      end if;
      if Code < 0 or else Code > 255 then
         return;
      end if;
      Phone (I + 1) := Character'Val (Code);
   end Set_Contact_Char;

   function Contact_Len return Integer is (Integer (Phone_Len));

   function Contact_Char (I : Integer) return Integer is
   begin
      if I < 0 or else I >= Integer (Phone_Len) then
         return 0;
      end if;
      return Character'Pos (Phone (I + 1));
   end Contact_Char;

   procedure Set_Load_Len (N : Integer) is
   begin
      if N <= 0 then
         Load_Len_N := 0;
      elsif N >= Load_Buf'Length then
         Load_Len_N := Load_Buf'Length;
      else
         Load_Len_N := N;
      end if;
   end Set_Load_Len;

   procedure Set_Load_Char (I, Code : Integer) is
   begin
      if I < 0 or else I >= Load_Buf'Length then
         return;
      end if;
      if Code < 0 or else Code > 255 then
         return;
      end if;
      Load_Buf (I + 1) := Character'Val (Code);
   end Set_Load_Char;

   function Load_Len return Integer is (Integer (Load_Len_N));

   function Load_Char (I : Integer) return Integer is
   begin
      if I < 0 or else I >= Integer (Load_Len_N) then
         return 0;
      end if;
      return Character'Pos (Load_Buf (I + 1));
   end Load_Char;
begin
   Restore_Fleet;
   Load_Sample;
end SD_Trip;
