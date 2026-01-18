// Dynamically import all images from each portfolio folder.
// This keeps the file maintainable when images are added/removed.

function importAll(globResult) {
  return Object.keys(globResult)
    .sort()
    .map((key) => globResult[key].default);
}

const amModules = import.meta.glob(
  "../Assets/PortfolioPics/AM/*.{png,jpg,jpeg,svg}",
  { eager: true },
);
const am = importAll(amModules);

const cmModules = import.meta.glob(
  "../Assets/PortfolioPics/CM/*.{png,jpg,jpeg,svg}",
  { eager: true },
);
const cm = importAll(cmModules);

const cpModules = import.meta.glob(
  "../Assets/PortfolioPics/CP/*.{png,jpg,jpeg,svg}",
  { eager: true },
);
const cp = importAll(cpModules);

const epModules = import.meta.glob(
  "../Assets/PortfolioPics/EP/*.{png,jpg,jpeg,svg}",
  { eager: true },
);
const ep = importAll(epModules);

const ephModules = import.meta.glob(
  "../Assets/PortfolioPics/EPH/*.{png,jpg,jpeg,svg}",
  { eager: true },
);
const eph = importAll(ephModules);

const tmModules = import.meta.glob(
  "../Assets/PortfolioPics/TM/*.{png,jpg,jpeg,svg}",
  { eager: true },
);
const tm = importAll(tmModules);

const category = [
  {
    image: am,
    title: "Architectural Marvels",
    description:
      "Explore the grandeur and history of architectural marvels through these captivating images. From historic buildings to modern skyscrapers, this collection showcases the beauty and diversity of architectural design.",
  },

  {
    image: cm,
    title: "Captivating Moments",
    description:
      "Capture the essence of captivating moments with this collection of diverse images. From outdoor performances to intimate encounters, these images evoke a sense of emotion and connection.",
  },

  {
    image: cp,
    title: "Cultural Portraits",
    description:
      "Embark on a visual journey through diverse cultures with this collection of captivating portraits. From traditional attire to expressive moments, these images celebrate the beauty and diversity of human expression.",
  },

  {
    image: ep,
    title: "Enigmatic Portraits",
    description:
      "Step into the enigmatic world of captivating portraits with this collection. From confident poses to introspective gazes, these images capture the essence of mystery and allure.",
  },

  {
    image: eph,
    title: "Elegant Fashion Photography",
    description:
      "A collection of stunning fashion photography capturing the elegance and beauty of various outfits and accessories. From vibrant outdoor scenes to stylish indoor settings, these images showcase the artistry of fashion and style.",
  },

  {
    image: tm,
    title: "Timeless Monochrome",
    description:
      "Step into the timeless allure of monochrome photography with this collection. From classic cars to ornate architectural details, these images capture the essence of black and white elegance.",
  },
];

export default category;
