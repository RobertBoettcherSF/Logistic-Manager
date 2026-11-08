with SD_Types;

package body SD_Fare is
   --  64-bit products stay inside the ranges the tests check. Overflow
   --  checks would pull in a 128-bit helper the wasm32 link does not have.
   pragma Suppress (Overflow_Check);
   function Round_50 (Milli : Long_Long_Integer) return Integer is
      Units : Long_Long_Integer;
      Naira : Long_Long_Integer;
   begin
      if Milli <= 0 then
         return 0;
      end if;
      Units := (Milli + 25_000) / 50_000;
      Naira := Units * 50;
      if Naira > Long_Long_Integer (Integer'Last) then
         return Integer'Last;
      end if;
      return Integer (Naira);
   end Round_50;

   function Quote
     (Service, Meters, Seats, Size : Integer) return Integer
   is
      Base, Per, Mn : Integer;
      One           : Long_Long_Integer;
      M             : Integer := Meters;
   begin
      case Service is
         when SD_Types.Ride =>
            Base := 600;
            Per  := 250;
            Mn   := 1_500;
         when SD_Types.Bus =>
            Base := 300;
            Per  := 80;
            Mn   := 400;
         when SD_Types.Dispatch =>
            Base := 400;
            Per  := 110;
            Mn   := 600;
         when SD_Types.Truck =>
            Base := 5_000;
            Per  := 800;
            Mn   := 15_000;
         when others =>
            return 0;
      end case;
      if M < 0 then
         M := 0;
      end if;
      One := Long_Long_Integer (Base) * 1_000
        + Long_Long_Integer (Per) * Long_Long_Integer (M);
      if One < Long_Long_Integer (Mn) * 1_000 then
         One := Long_Long_Integer (Mn) * 1_000;
      end if;
      if Service = SD_Types.Bus then
         if Seats > 0 then
            One := One * Long_Long_Integer (Seats);
         end if;
      elsif Service = SD_Types.Dispatch then
         if Size = 1 then
            One := One * 7 / 5;
         elsif Size >= 2 then
            One := One * 2;
         end if;
      end if;
      return Round_50 (One);
   end Quote;

   function Min_Offer (Suggested : Integer) return Integer is
   begin
      if Suggested <= 0 then
         return 0;
      end if;
      --  70 percent, in milli-naira (suggested * 1000 * 7 / 10).
      return Round_50 (Long_Long_Integer (Suggested) * 700);
   end Min_Offer;

   function Counter (Price, Percent : Integer) return Integer is
   begin
      if Price <= 0 or else Percent <= 0 then
         return 0;
      end if;
      --  price * percent / 100 naira = price * percent * 10 milli-naira.
      return Round_50
        (Long_Long_Integer (Price) * Long_Long_Integer (Percent) * 10);
   end Counter;
end SD_Fare;
