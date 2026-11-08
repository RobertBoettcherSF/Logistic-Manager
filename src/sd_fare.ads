--  Fare rules from the v0.2 prototype, as integers.
--  The minimum is applied before the seat or parcel multiplier.
--  The result is rounded half-up to 50 naira.
--  A private jet has no fixed fare (Quote returns 0).
package SD_Fare is
   function Quote
     (Service, Meters, Seats, Size : Integer) return Integer;

   function Min_Offer (Suggested : Integer) return Integer;

   --  Percent is 110 for the second simulated offer, 120 for the third.
   function Counter (Price, Percent : Integer) return Integer;
end SD_Fare;
