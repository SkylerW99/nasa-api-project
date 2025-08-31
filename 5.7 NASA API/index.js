import express from "express";
import axios from "axios";
import bodyParser from "body-parser";

const app = express();
const port = 3000;
const apiKey = "Tq4RWwRvet4UUi5xqfhNFngS4N4FSOxXw5GaGQ9t";
let lastThreeMonths = [];
let lastThreeMonthsVal = [];
let start_date, end_date;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

//compute last three month
function getLastThreeMonth(selectedMonth){

  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();
  if (month === 0){
    month = 12;
    year -= 1;
  }
  const lastOne = month - 1;
  const lastTwo = month - 2;
  const lastThree = month - 3;

  const allMonths = [
    "January","February","March","April","May","June","July","August","September","October","November","December"
  ]
  //month name
  lastThreeMonths = [allMonths[lastOne],allMonths[lastTwo],allMonths[lastThree]];

  //value
  lastThreeMonthsVal = [lastOne,lastTwo,lastThree];

  //start & end
  const m0 = Number(selectedMonth); //convert to number
  start_date = new Date(year,m0,1);
  end_date = new Date(year,m0 + 1,0);

  //console.log(lastThreeMonths,lastThreeMonthsVal,start_date,end_date);
  return (lastThreeMonths,lastThreeMonthsVal,start_date,end_date);
}

//run the function and get last 3 months
getLastThreeMonth();



//conditional apod API link
const apod = (date) =>
  `https://api.nasa.gov/planetary/apod?api_key=${apiKey}` +
  (date ? `&date=${date}` : "");

//picture of today
app.get("/", async (req, res) => {
  try {
    //today's pic
    const result = (await axios.get(apod())).data;
    console.log(result);

    res.render("index.ejs", {
      //today
      tdDate: result.date,
      tdExplanation: result.explanation,
      tdTitle: result.title,
      tdImage: result.hdurl,

      //last month

      //last 3 month value
      lastThreeMonths,
      lastThreeMonthsVal,
    });
  } catch (error) {
    if (error?.response) {
      console.error(error.response.status, error.response.data);
    } else {
      console.error(error.message);
    }
    return res.status(500).send("Server error.");
  }
});

// JSON: APOD by date (used when the user picks a day)
app.get("/date", async (req, res) => {
  try {
    const selectedDate = req.query.date;
    const result = (await axios.get(apod(selectedDate))).data;
    console.log(result);
    res.json({
      date: result.date,
      title: result.title,
      explanation: result.explanation,
      image: result.media_type === "image" ? (result.hdurl || result.url) : null,
      video: result.media_type === "video" ? result.url : null,
    });
  } catch (e) {
    res.status(502).json({ error: "APOD fetch failed" });
  }
});

app.get("/month",async(req,res)=>{
  try{
  const month = req.query.month;
  getLastThreeMonth(month);
  start_date = start_date.toISOString().slice(0,10);
  end_date = end_date.toISOString().slice(0,10);

  const { data } = await axios.get(
      "https://api.nasa.gov/planetary/apod",
      { params: { api_key: apiKey, start_date, end_date} }
    );

  console.log(data);
  res.json(data);

  } catch (error) {
    if (error?.response) {
      console.error(error.response.status, error.response.data);
    } else {
      console.error(error.message);
    }
    return res.status(500).send("Server error.");
  } 
  });

app.listen(port, () => {
  console.log(`Server is running on ${port}.`);
});

