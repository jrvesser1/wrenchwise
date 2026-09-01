const BASE="https://vpic.nhtsa.dot.gov/api/vehicles";
export async function decodeVin(vin:string) {
  const u=`${BASE}/DecodeVinValuesExtended/${encodeURIComponent(vin)}?format=json`;
  const r=await fetch(u,{next:{revalidate:3600}});
  if(!r.ok) throw new Error("NHTSA VIN service unavailable");
  const j=await r.json();
  const x=j.Results?.[0];
  if(!x) throw new Error("VIN not found");
  return {
    vin,
    make:x.Make||null, model:x.Model||null, year:x.ModelYear||null,
    trim:x.Trim||null, body:x.BodyClass||null, engine:x.EngineModel||null,
    drive:x.DriveType||null, fuel:x.FuelTypePrimary||null,
    transmission:x.TransmissionStyle||null
  };
}
export async function recalls(make:string,model:string,year:string) {
  const u=`https://api.nhtsa.gov/recalls/recallsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${encodeURIComponent(year)}`;
  const r=await fetch(u,{next:{revalidate:900}});
  if(!r.ok) throw new Error("NHTSA recall service unavailable");
  const j=await r.json();
  return j.results||[];
}