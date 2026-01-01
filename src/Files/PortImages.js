// Dynamically import all images from each portfolio folder.
// This keeps the file maintainable when images are added/removed.

function importAll(r) {
  return r.keys().sort().map(r);
}

const am = importAll(
  require.context("../Assets/PortfolioPics/AM", false, /\.(png|jpe?g|svg)$/)
);
const cm = importAll(
  require.context("../Assets/PortfolioPics/CM", false, /\.(png|jpe?g|svg)$/)
);
const cp = importAll(
  require.context("../Assets/PortfolioPics/CP", false, /\.(png|jpe?g|svg)$/)
);
const ep = importAll(
  require.context("../Assets/PortfolioPics/EP", false, /\.(png|jpe?g|svg)$/)
);
const eph = importAll(
  require.context("../Assets/PortfolioPics/EPH", false, /\.(png|jpe?g|svg)$/)
);
const tm = importAll(
  require.context("../Assets/PortfolioPics/TM", false, /\.(png|jpe?g|svg)$/)
);

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
    title: "Cultural Potraits",
    description:
      "Embark on a visual journey through diverse cultures with this collection of captivating portraits. From traditional attire to expressive moments, these images celebrate the beauty and diversity of human expression.",
  },

  {
    image: ep,
    title: "Enigmatic Potraits",
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
