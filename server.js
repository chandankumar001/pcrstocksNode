var express = require('express');
const cors = require('cors');
var app = express();
app.use(cors());
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    return res.status(200).json({});
  }
  next();
});
console.log("server")
app.use(express.urlencoded({ extended: false }));
app.use(express.json({ limit: '512mb' }));
var mysql = require('mysql');

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "M@bile12345"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});

app.all("/fetch",async function(req,res){

  let query = `SELECT *, DATE_FORMAT(pcrdate, "%d-%M") AS pcrFormatDate from stocks.tbl_pcrdata_daily where shortname='${req.body["data"]["find"]}' OR name='${req.body["data"]["find"]}' order by pcrdate asc`;
  return new Promise(function(resolve, reject) {
  con.query(query,function(err,result,fields){
      resolve(res.send(JSON.parse(JSON.stringify(result))))
    }) 
  })
})

app.all("/fetchstocks",async function(req,res){

  let query = `SELECT * from stocks.tbl_stock_name`;
  return new Promise(function(resolve, reject) {
  con.query(query,function(err,result,fields){
      resolve(res.send(JSON.parse(JSON.stringify(result))))
    }) 
  })
})

app.all("/bhavinsert",function(req,res){
  let dateObj = new Date();
  let month = dateObj.getUTCMonth() + 1; //months from 1-12
  let day = dateObj.getUTCDate();
  let year = dateObj.getUTCFullYear();
  let date = year + "-" + month + "-" + day;

  let droptable = `DROP TABLE IF EXISTS stocks.tbl_pcrbhavcopy_daily_${date}`;
  let droptableresult = con.query(createbhav);

  let createbhav = `CREATE TABLE stocks.tbl_pcrbhavcopy_daily_${date} (
    'contractID' varchar(255) DEFAULT NULL,
    'contractCount' varchar(255) DEFAULT NULL,
    'entryDate' date DEFAULT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
  let bhavcreateresult = con.query(createbhav);

  console.log(req.body)

  

})

app.all("/insert",function(req,res){
  // console.log(req.body["data"]);
  // var inserData = req.body["data"]
  // for(var j =0;j<req.body["data"].length;j++){
  //   var insert  = `INSERT INTO stocks.tbl_stock_name set name = '${inserData[j]["Name"].replace(/'/g, "\\'")}',shortname = '${inserData[j]["short"].replace(/'/g, "\\'")}',entryDate =  NOW()
  //   ` ;

  //   var insert_result = con.query(insert)
  // }
  // return 1;

  var truncate  = `TRUNCATE stocks.tbl_pcrdata_daily  ` ;
  var truncate_result = con.query(truncate)
  var inserData = []
  let dataParam  = req.body["data"]
  for(var i=0;i<dataParam.length;i++){
    for(var key in dataParam[i]){
     
      if(key!="Name" && key!="short"){
        var dataobj = {}
        dataobj["name"] = dataParam[i]["Name"].replace(/'/g, "\\'");
        dataobj["shortname"] = dataParam[i]["short"].replace(/'/g, "\\'");
        if(key.split(".").length>1){
          dataobj["pcrdate"] = "0000-00-00"
        }
        else{
          dataobj["pcrdate"] = key.split("-").reverse().join("-").split("~").join("-")
        }
        
        dataobj["pcrpoints"] =  Math.round((dataParam[i][key] + Number.EPSILON) * 1000) / 1000

        dataobj["entryDate"] = new Date();

        inserData.push(dataobj);
      }
    }
  }


  for(var j=0;j<inserData.length;j++){
    var insert  = `INSERT INTO stocks.tbl_pcrdata_daily set name = '${inserData[j]["name"]}',shortname = '${inserData[j]["shortname"]}',pcrpoints = '${inserData[j]["pcrpoints"]}',pcrdate = '${inserData[j]["pcrdate"]}',entryDate =  NOW()
                          ` ;

    var insert_result = con.query(insert)
  }
  console.log(insert_result)
  res.send("hello")
})

app.listen(8080, ()=>{
  console.log("server started at 8080")
})