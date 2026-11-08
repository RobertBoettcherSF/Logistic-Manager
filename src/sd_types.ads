--  Shared codes for the Swift Drive demo core.
--  The browser sees these integers through sd_api; it does not
--  re-implement them.
package SD_Types is
   subtype Node is Integer range 0 .. 12;

   Ride     : constant := 0;
   Bus      : constant := 1;
   Dispatch : constant := 2;
   Truck    : constant := 3;
   Jet      : constant := 4;

   Veh_Car   : constant := 0;
   Veh_Bike  : constant := 1;
   Veh_Bus   : constant := 2;
   Veh_Truck : constant := 3;
   Veh_Jet   : constant := 4;

   St_Idle      : constant := 0;
   St_Requested : constant := 1;
   St_Offers    : constant := 2;
   St_Accepted  : constant := 3;
   St_Arriving  : constant := 4;
   St_Moving    : constant := 5;
   St_Done      : constant := 6;
   St_Cancelled : constant := 7;

   Ok        : constant := 0;
   Err_Same  : constant := 1;
   Err_Low   : constant := 2;
   Err_Seats : constant := 3;
   Err_Phone : constant := 4;
   Err_Load  : constant := 5;
   Err_Pax   : constant := 6;
   Err_Route : constant := 7;
   Err_Ends  : constant := 8;

   Pick_Oba    : constant Node := 7;
   Dest_Museum : constant Node := 8;
   Via_Kings   : constant Node := 10;
   Home_Ring   : constant Node := 9;
end SD_Types;
