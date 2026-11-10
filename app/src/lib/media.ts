// Photography from Unsplash, used under the Unsplash licence (free for
// commercial use, no permission needed). Each is chosen for one section.

const u = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&q=80`;

export const PHOTOS = {
  hero: { src: u("photo-1545386673-7723f55e5490"), alt: "A woman holding a cup of tea by a sunlit window" },
  resident: { src: u("photo-1536766768598-e09213fdcf22"), alt: "Portrait of a woman wearing a brown headscarf" },
  clinician: { src: u("photo-1758691462878-6edc3d3da1be"), alt: "A doctor in her office talking with a patient" },
  system: { src: u("photo-1606206591513-adbfbdd7a177"), alt: "Rows of blood collection tubes in a laboratory" },
  privacy: { src: u("photo-1480618376353-2950ee462b17"), alt: "Two people holding hands" },
  signIn: { src: u("photo-1506014299253-3725319c0f69"), alt: "Two people holding hands outdoors" },
  /** shown at the top of a resident's own page, matched to them */
  personFemale: { src: u("photo-1718048170732-0ef8a77fce9e"), alt: "A smiling woman in a headscarf" },
  personMale: { src: u("photo-1757744705465-ea08b0ddc38a"), alt: "A smiling young man" },
} as const;
