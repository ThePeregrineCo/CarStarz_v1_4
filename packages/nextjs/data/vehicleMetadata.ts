export interface VehicleMetadata {
  image: string;
  make: string;
  model: string;
  year: string;
  vin: string;
  name: string;
}

export const VEHICLE_METADATA: Record<string, VehicleMetadata> = {
  "1": {
    image: "/images/vehicles/2014_audi_r8.png",
    make: "Audi",
    model: "R8",
    year: "2014",
    vin: "WUAAUAFG4BN123456",
    name: "Audi R8"
  },
  "2": {
    image: "/images/vehicles/1972_ford_bronco.png",
    make: "Ford",
    model: "Bronco",
    year: "1972",
    vin: "F26HLB12345",
    name: "Ford Bronco"
  },
  "3": {
    image: "/images/vehicles/1994_land-rover_defender_90.png",
    make: "Land Rover",
    model: "Defender 90",
    year: "1994",
    vin: "SALLAAA134A123456",
    name: "Land Rover Defender"
  },
  "4": {
    image: "/images/vehicles/1999_lexus_lx470.png",
    make: "Lexus",
    model: "LX470",
    year: "1999",
    vin: "JT6HT00W0X0123456",
    name: "Lexus LX470"
  },
  "5": {
    image: "/images/vehicles/2001_audi_s4.png",
    make: "Audi",
    model: "S4",
    year: "2001",
    vin: "WAUZZZ8DZ1A123456",
    name: "Audi S4"
  },
  "6": {
    image: "/images/vehicles/2009_nissan_gt-r.png",
    make: "Nissan",
    model: "GT-R",
    year: "2009",
    vin: "JN1AR5EF0CM123456",
    name: "Nissan GT-R"
  },
  "7": {
    image: "/images/vehicles/2011_cadillac_cts-v-wagon.png",
    make: "Cadillac",
    model: "CTS-V Wagon",
    year: "2011",
    vin: "1G6DW5ED0B0123456",
    name: "Cadillac CTS-V Wagon"
  },
  "8": {
    image: "/images/vehicles/1967_chevrolet_camaro.png",
    make: "Chevrolet",
    model: "Camaro",
    year: "1967",
    vin: "124377N123456",
    name: "Chevrolet Camaro"
  },
  "9": {
    image: "/images/vehicles/1969_ford_bronco_restobronco.png",
    make: "Ford",
    model: "Bronco Resto",
    year: "1969",
    vin: "U15GLN12345",
    name: "Ford Bronco Resto"
  },
  "10": {
    image: "/images/vehicles/1927_ford_model-t.png",
    make: "Ford",
    model: "Model T",
    year: "1927",
    vin: "A123456",
    name: "Ford Model T"
  }
}; 