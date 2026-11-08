package body SD_Geo is
   pragma Suppress (Overflow_Check);
   function Place_Count return Integer is (Node'Last + 1);

   function Place_Name (I : Integer) return String is
   begin
      case I is
         when 0  => return "Ikpoba";
         when 1  => return "Oregbeni";
         when 2  => return "Ramat Park Flyover";
         when 3  => return "Edo College";
         when 4  => return "Akwa Ibom Motor Park";
         when 5  => return "Vegetable Market";
         when 6  => return "Central Hospital";
         when 7  => return "Oba Market";
         when 8  => return "National Museum";
         when 9  => return "Ring Road";
         when 10 => return "King's Square";
         when 11 => return "Akpakpava";
         when 12 => return "Airport Road";
         when others => return "";
      end case;
   end Place_Name;

   --  Microdegrees. 0 .. 8 are the published landmarks. 9 .. 12 are
   --  schematic junctions used only to give the router a road graph.
   function Lat (I : Integer) return Integer is
   begin
      case I is
         when 0  => return 6_350_010;
         when 1  => return 6_349_200;
         when 2  => return 6_349_780;
         when 3  => return 6_332_330;
         when 4  => return 6_345_740;
         when 5  => return 6_346_200;
         when 6  => return 6_330_580;
         when 7  => return 6_334_870;
         when 8  => return 6_332_910;
         when 9  => return 6_335_000;
         when 10 => return 6_333_400;
         when 11 => return 6_340_000;
         when 12 => return 6_345_000;
         when others => return 0;
      end case;
   end Lat;

   function Lng (I : Integer) return Integer is
   begin
      case I is
         when 0  => return 5_650_000;
         when 1  => return 5_656_670;
         when 2  => return 5_660_600;
         when 3  => return 5_646_950;
         when 4  => return 5_635_100;
         when 5  => return 5_632_870;
         when 6  => return 5_622_830;
         when 7  => return 5_619_680;
         when 8  => return 5_622_120;
         when 9  => return 5_603_700;
         when 10 => return 5_621_000;
         when 11 => return 5_628_000;
         when 12 => return 5_640_000;
         when others => return 0;
      end case;
   end Lng;

   function Pickable (I : Integer) return Boolean is
     (I in 0 .. 8);

   function Airport_Count return Integer is (6);

   function Airport_Name (I : Integer) return String is
   begin
      case I is
         when 0 => return "Benin Airport (BNI), Benin City";
         when 1 => return "Lagos (LOS)";
         when 2 => return "Abuja (ABV)";
         when 3 => return "Accra (ACC), Ghana";
         when 4 => return "Port Harcourt (PHC)";
         when 5 => return "Asaba (ABB)";
         when others => return "";
      end case;
   end Airport_Name;

   type Endpoint is record
      A, B : Node;
   end record;

   Edges : constant array (0 .. 18) of Endpoint :=
     ((0, 1), (1, 2),
      (0, 12), (12, 4), (4, 5), (5, 11),
      (12, 3), (3, 11), (3, 9),
      (11, 6), (11, 10), (6, 10), (6, 9), (6, 7),
      (10, 7), (10, 8),
      (7, 9), (8, 9), (9, 11));

   function Edge_Count return Integer is (Edges'Length);

   function Edge_A (I : Integer) return Integer is
   begin
      if I < Edges'First or else I > Edges'Last then
         return -1;
      end if;
      return Integer (Edges (I).A);
   end Edge_A;

   function Edge_B (I : Integer) return Integer is
   begin
      if I < Edges'First or else I > Edges'Last then
         return -1;
      end if;
      return Integer (Edges (I).B);
   end Edge_B;

   function In_Node (I : Integer) return Boolean is
     (I >= Integer (Node'First) and then I <= Integer (Node'Last));

   --  cos(latitude) in parts per million, Taylor series, integer only.
   function Cos_Ppm (Lat_U : Integer) return Integer is
      U  : constant Long_Long_Integer :=
        Long_Long_Integer (abs (Lat_U)) * 17_453_293 / 1_000_000;
      U2 : constant Long_Long_Integer := U * U;
      T1 : constant Long_Long_Integer := U2 / 2_000_000_000_000;
      Q  : constant Long_Long_Integer := U2 / 100_000_000;
      T2 : constant Long_Long_Integer := Q * Q / 24 / 100_000_000_000_000;
   begin
      return Integer (1_000_000 - T1 + T2);
   end Cos_Ppm;

   function Mm_UDeg (U : Integer) return Long_Long_Integer is
      A : constant Long_Long_Integer := Long_Long_Integer (abs (U));
   begin
      return (A * 111_194_926_645 + 500_000_000) / 1_000_000_000;
   end Mm_UDeg;

   function Floor_Sqrt (N : Long_Long_Integer) return Long_Long_Integer is
      Lo  : Long_Long_Integer := 0;
      Hi  : Long_Long_Integer := 100_000_000;
      Mid : Long_Long_Integer;
   begin
      if N <= 0 then
         return 0;
      end if;
      while Lo < Hi loop
         Mid := (Lo + Hi + 1) / 2;
         if Mid * Mid <= N then
            Lo := Mid;
         else
            Hi := Mid - 1;
         end if;
      end loop;
      return Lo;
   end Floor_Sqrt;

   function Nearest_Sqrt (N : Long_Long_Integer) return Long_Long_Integer is
      S : constant Long_Long_Integer := Floor_Sqrt (N);
   begin
      if S >= 100_000_000 then
         return S;
      end if;
      if (S + 1) * (S + 1) - N < N - S * S then
         return S + 1;
      end if;
      return S;
   end Nearest_Sqrt;

   function Straight_Mm
     (Lat1, Lng1, Lat2, Lng2 : Integer) return Long_Long_Integer
   is
      Dy    : constant Long_Long_Integer := Mm_UDeg (Lat2 - Lat1);
      Dx_Eq : constant Long_Long_Integer := Mm_UDeg (Lng2 - Lng1);
      Mean  : constant Integer := (Lat1 + Lat2) / 2;
      C     : constant Long_Long_Integer :=
        Long_Long_Integer (Cos_Ppm (Mean));
      Dx    : constant Long_Long_Integer := Dx_Eq * C / 1_000_000;
   begin
      return Nearest_Sqrt (Dx * Dx + Dy * Dy);
   end Straight_Mm;

   function Meters_XY (Lat1, Lng1, Lat2, Lng2 : Integer) return Integer is
      Sm      : constant Long_Long_Integer :=
        Straight_Mm (Lat1, Lng1, Lat2, Lng2);
      Road_Mm : constant Long_Long_Integer := (Sm * 13 + 5) / 10;
   begin
      --  1.3 road factor, then round half-up to whole metres.
      return Integer ((Road_Mm + 500) / 1_000);
   end Meters_XY;

   function Road_Meters (A, B : Integer) return Integer is
   begin
      if not In_Node (A) or else not In_Node (B) then
         return Unreachable;
      end if;
      if A = B then
         return 0;
      end if;
      return Meters_XY (Lat (A), Lng (A), Lat (B), Lng (B));
   end Road_Meters;

   Weight : array (Node, Node) of Integer;
   Built  : Boolean := False;

   procedure Build_Weights is
   begin
      for A in Node loop
         for B in Node loop
            Weight (A, B) := Unreachable;
         end loop;
         Weight (A, A) := 0;
      end loop;
      for E of Edges loop
         Weight (E.A, E.B) := Road_Meters (Integer (E.A), Integer (E.B));
         Weight (E.B, E.A) := Weight (E.A, E.B);
      end loop;
      Built := True;
   end Build_Weights;

   --  The wasm link does not run Ada elaboration. The first route builds
   --  the graph. The native binder still elaborates Build_Weights itself.
   procedure Ensure_Weights is
   begin
      if not Built then
         Build_Weights;
      end if;
   end Ensure_Weights;

   procedure Shortest
     (Src, Dst  : Integer;
      Dist      : out Integer;
      Trail_Out : out Trail;
      Len       : out Natural)
   is
      DistA : array (Node) of Integer := (others => Unreachable);
      Prev  : array (Node) of Integer := (others => -1);
      Used  : array (Node) of Boolean := (others => False);
      S, D  : Node;
      Best  : Integer;
      U     : Node := Node'First;
   begin
      Trail_Out := (others => Node'First);
      Len := 0;
      Dist := Unreachable;
      Ensure_Weights;
      if not In_Node (Src) or else not In_Node (Dst) then
         return;
      end if;
      S := Node (Src);
      D := Node (Dst);
      DistA (S) := 0;
      for Pass in Node loop
         Best := Unreachable;
         for C in Node loop
            if not Used (C) and then DistA (C) < Best then
               Best := DistA (C);
               U := C;
            end if;
         end loop;
         exit when Best >= Unreachable;
         Used (U) := True;
         for V in Node loop
            if Weight (U, V) < Unreachable
              and then DistA (U) < Unreachable
              and then DistA (U) + Weight (U, V) < DistA (V)
            then
               DistA (V) := DistA (U) + Weight (U, V);
               Prev (V) := Integer (U);
            end if;
         end loop;
         pragma Unreferenced (Pass);
      end loop;
      Dist := DistA (D);
      if Dist >= Unreachable then
         return;
      end if;
      declare
         Stack : array (1 .. 13) of Node := (others => Node'First);
         N     : Natural := 0;
         Cur   : Integer := Integer (D);
      begin
         while Cur >= 0 and then N < Stack'Length loop
            N := N + 1;
            Stack (N) := Node (Cur);
            exit when Cur = Integer (S);
            Cur := Prev (Node (Cur));
         end loop;
         Len := N;
         for I in 1 .. N loop
            Trail_Out (I - 1) := Stack (N - I + 1);
         end loop;
      end;
   end Shortest;
begin
   Build_Weights;
end SD_Geo;
