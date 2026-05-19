const cloudinary = (folder, name) => `https://res.cloudinary.com/dwzx3jib2/image/upload/galleries/${folder}/${name}`;

const Images = [
  {
    image: cloudinary("AM", "AM1.jpg"),
    title: "Architectural Marvels",
  },

  {
    image: cloudinary("CM", "CM1.jpg"),
    title: "Captivating Moments",
  },

  {
    image: cloudinary("CP","CP1_m5lpcy.jpg"),
    title: "Cultural Portraits",
  },

  {
    image: cloudinary("EP", "EP1_kk3szp.jpg"),
    title: "Enigmatic Portraits",
  },

  {
    image: cloudinary("EPH", "EPH1_jyjy9m.jpg"),
    title: "Elegant Fashion Photography",
  },

  {
    image: cloudinary("TM", "TM1_t27nxj.jpg"),
    title: "Timeless Monochrome",
  },
];

export default Images;
