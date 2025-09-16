// const mongoose = require("mongoose");
// const Book = require("./models/Book");
// require("dotenv").config();

// mongoose
//   .connect(process.env.MONGO_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   })
//   .then(async () => {
//     console.log("MongoDB connected for seeding!");

// const books = [
//   {
//     title: "خدمة عيد ميلاد السيدة",
//     category: "خدم و صلوات",
//     cover: "https://res.cloudinary.com/firstwork/image/upload/v1757884422/Ekklesia/Books/WhatsApp_Image_2025-09-08_at_01.44.38_vcdu8q.jpg",
//     pdfUrl: "https://res.cloudinary.com/firstwork/image/upload/v1757884302/Ekklesia/Books/%D9%85%D9%8A%D9%84%D8%A7%D8%AF_%D9%88%D8%A7%D9%84%D8%AF%D8%A9_%D8%A7%D9%84%D8%A5%D9%84%D9%87_%D9%81%D9%8A_8_%D8%A3%D9%8A%D9%84%D9%88%D9%84_zlqujm.pdf"
//   },
//   {
//     title: "خدمة الأحد قبل عيد رفع الصليب",
//     category: "خدم و صلوات",
//     cover: "https://res.cloudinary.com/firstwork/image/upload/v1757884379/Ekklesia/Books/WhatsApp_Image_2025-09-13_at_10.53.33_kltkye.jpg",
//     pdfUrl: "https://res.cloudinary.com/firstwork/image/upload/v1757884242/Ekklesia/Books/%D8%A7%D9%84%D8%A3%D8%AD%D8%AF_%D9%82%D8%A8%D9%84_%D8%B9%D9%8A%D8%AF_%D8%B1%D9%81%D8%B9_%D8%A7%D9%84%D8%B5%D9%84%D9%8A%D8%A8_lx7xmb.pdf"
//   },
//   {
//     title: "خدمة عيد رفع الصليب",
//     category: "خدم و صلوات",
//     cover: "https://res.cloudinary.com/firstwork/image/upload/v1757884380/Ekklesia/Books/WhatsApp_Image_2025-09-13_at_21.24.42_1_ljgrl0.jpg",
//     pdfUrl: "https://res.cloudinary.com/firstwork/image/upload/v1757884284/Ekklesia/Books/%D8%B1%D9%81%D8%B9_%D8%A7%D9%84%D8%B5%D9%84%D9%8A%D8%A8_sie1gt.pdf"
//   },
  
// ];

// await Book.insertMany(books);

//     console.log("Books seeded successfully!");
//     process.exit(); // exit after finish
//   })
//   .catch((err) => {
//     console.error("Error seeding data:", err);
//     process.exit(1);
//   });