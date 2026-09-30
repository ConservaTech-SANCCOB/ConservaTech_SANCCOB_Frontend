import { ImageContentPosition } from "expo-image";

/** Photos supplied by SANCCOB for use in the app. */
export const SEABIRD_PHOTOS = {
  africanPenguin: require("../../assets/images/bg_penguin.jpg.jpeg"),
  kelpGull: require("../../assets/images/bg_kelpGull.jpg.jpeg"),
  hartlaubsGull: require("../../assets/images/bg_hartlaub.jpg.jpeg"),
};

export interface Seabird {
  key: string;
  name: string;
  scientificName: string;
  /** IUCN Red List status. */
  status: string;
  /** Whether `status` is a threatened category (drives the chip colour). */
  threatened: boolean;
  fact: string;
  photo: number;
  /** Where to anchor the portrait photo when it's cropped into a wide card. */
  photoPosition: ImageContentPosition;
  credit?: string;
}

export const SEABIRDS: Seabird[] = [
  {
    key: "african-penguin",
    name: "African Penguin",
    scientificName: "Spheniscus demersus",
    status: "Critically Endangered",
    threatened: true,
    fact: "Africa's only penguin, found along the coasts of South Africa and Namibia. Each one has its own pattern of chest spots, and SANCCOB's rescue and rehabilitation work is a key part of saving the species.",
    photo: SEABIRD_PHOTOS.africanPenguin,
    photoPosition: { top: "62%", left: "50%" },
  },
  {
    key: "kelp-gull",
    name: "Kelp Gull",
    scientificName: "Larus dominicanus",
    status: "Least Concern",
    threatened: false,
    fact: "The largest gull in southern Africa, easy to spot by its black back and yellow bill with a red spot. Often seen patrolling beaches and harbours along the coast.",
    photo: SEABIRD_PHOTOS.kelpGull,
    photoPosition: { top: "35%", left: "50%" },
  },
  {
    key: "hartlaubs-gull",
    name: "Hartlaub's Gull",
    scientificName: "Chroicocephalus hartlaubii",
    status: "Least Concern",
    threatened: false,
    fact: "Found only along the coasts of South Africa and Namibia. A small, pale gull with a dark red bill and legs, and a familiar sight around Cape Town's harbours.",
    photo: SEABIRD_PHOTOS.hartlaubsGull,
    photoPosition: { top: "38%", left: "50%" },
    credit: "Lasse Olsen",
  },
];
