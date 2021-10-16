var express = require('express');
const cors = require('cors');
var nodemailer = require('nodemailer');
const ExcelJS = require('exceljs');
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
console.log("index")
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

app.all("/sendmail", async function(req,res){
  console.log(req.body)
  await sendMail(req.body.email)
  res.json({"message":"email sent"})
})

app.all("/download", async function(req,res){
  await download()
  res.json({"message":"download "})
})

function download(){

  let selectfinaldata = "SELECT * FROM stocks.tbl_pcrdaily_final_data"

  let result = con.query(selectfinaldata,function(err,result,fields){
        for(var key in result){
          console.log(JSON.parse(JSON.stringify(result[key])))
        }
  })

}

function sendMail(email="chku456@gmail.com"){
  console.log("email",email)
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    // auth: {
    //   user: 'chku456@gmail.com',
    //   pass: 'M@bile12345'
    // }
    auth: {
    XOAuth2: {
      user: "chku456@gmail.com", // Your gmail address.
      clientId: "902998835135-8q9f60f57d2vghmvddh9q8kk0qdlskje.apps.googleusercontent.com",
      clientSecret: "qW2J3t3WuEAQ2lWH3UYZEs7D",
      refreshToken: "1//0408h33-m04hoCgYIARAAGAQSNwF-L9IrSeP73Nl6hR6CMcfjz3Lo3LaajWZtIs5wYA2Ah5nCmzTxBbTRHf5H5WzqxcNu98kp1ec",
      access_token: "ya29.a0ARrdaM8H4elKWg4fOV4oHyR0b1GQ5oJMGXmtt22F9zSdKndL5fvqpJ4W87bZdttNC8r_TZgx_dC1_MvbQfFBk9S3h2_OG3WAqe2MUdWfamMAn9jq5xb3gk_WAWFIa5ot4NLmYG_GxZ3V9pN0uT7G3QLvCQ_5"
    }
  }
  });
  var toemail = email.split(",").join(",")
  var mailOptions = {
    from: 'chku456@gmail.com',
    to: toemail,
    subject: 'Sending Email using Node.js',
    text: 'That was easy!'
  };
  console.log(mailOptions)
  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
  console.log(toemail)
  return 1;
}

app.all("/bhavinsert",async function(req,res){
  console.log(req.body.date);
 
  let dateObj = new Date();
  
  if(req.body.date){
    dateObj = new Date(req.body.date);
  }
  // dateObj = new Date(dateObj.getTime() + dateObj.getTimezoneOffset() * 60000)
  // dateObj.setHours(0,0,0,0);
  let month = dateObj.getMonth() + 1;
  let monthNUm = dateObj.getMonth()
  let day = dateObj.getDate();
  console.log(day);
  let year = dateObj.getFullYear();
  let date = year + "_" + month + "_" + day;
  let monthArr = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"]
  let droptable = `DROP TABLE IF EXISTS stocks.tbl_pcrbhavcopy_daily_${date}`;
  let droptableresult =  con.query(droptable);

  let createbhav = `CREATE TABLE stocks.tbl_pcrbhavcopy_daily_${date} (
    contractID varchar(255) DEFAULT NULL,
    stockname varchar(255) DEFAULT NULL,
    shortstockname varchar(255) DEFAULT NULL,
    monthname varchar(255) DEFAULT NULL,
    pcrvaluetype varchar(255) DEFAULT NULL,
    contractCount varchar(255) DEFAULT NULL,
    entryDate date DEFAULT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;

  // return ;
  let bhavcreateresult = con.query(createbhav);

  // return ;
  let data = req.body;
  let contractsplit 
  let insert_bhav = `insert into stocks.tbl_pcrbhavcopy_daily_${date} (contractID,contractCount,stockname,shortstockname,monthname,pcrvaluetype,entryDate) values`
  for(let i=0;i<data.data.length;i++){
    contractsplit = data.data[i]['CONTRACT_D'].split("-")
    if(i==0){
      insert_bhav += `('${data.data[i]['CONTRACT_D']}','${data.data[i]['OI_NO_CON']}','${contractsplit[0]}','${contractsplit[0]}','${contractsplit[1]}','${contractsplit[2]}',NOW())`;
    }
    else{
      insert_bhav += `,('${data.data[i]['CONTRACT_D']}','${data.data[i]['OI_NO_CON']}','${contractsplit[0]}','${contractsplit[0]}','${contractsplit[1]}','${contractsplit[2]}',NOW())`;
    }
    
  }
  

  let monthValue = monthNUm;
  let regx_value = [];
  let contractIdNamePE = "";
  let contractIdNameCE = "";
  let indexPE = -1;
  let indexCE = -1;
  let pcrObject = {};
  let obj = {};
  let ratio
  let ratioObj = {};
  let AvgPcrPE,AvgPcrCE; 
  let pcrObjectfinal = {};
  var insert_result =  con.query(insert_bhav,function(){
    let select = `SELECT contractId ,SUM(contractCount) AS contractCount,COUNT(*) AS COUNT FROM stocks.tbl_pcrbhavcopy_daily_${date} GROUP BY contractId ORDER BY contractId `;
    
    con.query(select,function(err,result,fields){
      for(let j=0;j<Object.keys(result).length;j++){
        pcrObject[result[j]["contractId"]] = JSON.parse(JSON.stringify(result[j]));
      }
      for(let key in pcrObject){
         monthValue = monthNUm;
        for(let k=0;k<3;k++){
          regx_value = pcrObject[key]["contractId"].split("-")
          contractIdNamePE = regx_value[0] +"-"+monthArr[monthValue]+"-"+"PE";
          contractIdNameCE = regx_value[0] +"-"+monthArr[monthValue]+"-"+"CE";
          
          
          if(pcrObject[contractIdNameCE]!==undefined && pcrObject[contractIdNameCE]!==undefined){
            AvgPcrPE  += parseInt(pcrObject[contractIdNamePE]['contractCount']);
            AvgPcrCE  += parseInt(pcrObject[contractIdNameCE]['contractCount']);
            if(pcrObject[contractIdNameCE]['contractCount']===0){
              ratio = 0;
            }
            else{
              ratio = pcrObject[contractIdNamePE]['contractCount']/pcrObject[contractIdNameCE]['contractCount']
            }
            

          }
          else{
            ratio = 0;
          }
          ratioObj[regx_value[0] +"-"+monthArr[monthValue]] = Math.round((ratio+ Number.EPSILON) * 1000) / 1000;
          if(monthValue>=11){
            monthValue = 0;
          }
          else{
            monthValue++
          } 
        }

        if(AvgPcrPE && AvgPcrCE){
          ratio = AvgPcrPE/AvgPcrCE
        }
        else{
          ratio = 0
        }
        
        ratioObj[regx_value[0] +"-AVG"] = Math.round((ratio+ Number.EPSILON) * 1000) / 1000;
        AvgPcrPE = 0 ;
        AvgPcrCE = 0;
      }

        let droptableratio = `DROP TABLE IF EXISTS stocks.tbl_pcrbhavcopy_ratio_daily_${date}`;
        let droptableresultration =  con.query(droptableratio);
       
        let createbhavratio = `CREATE TABLE stocks.tbl_pcrbhavcopy_ratio_daily_${date} (
          contractID varchar(255) DEFAULT NULL,
          stockname varchar(255) DEFAULT NULL,
          shortstockname varchar(255) DEFAULT NULL,
          pcrratio varchar(255) DEFAULT NULL,
          monthpcr varchar(255) DEFAULT NULL,
          entryDate date DEFAULT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
        let bhavcreateresultratio = con.query(createbhavratio);

        let insert_bhav_ratio = `insert into stocks.tbl_pcrbhavcopy_ratio_daily_${date} (contractID,stockname,shortstockname,pcrratio,monthpcr,entryDate) values`;
        let count =0;
        let stockdetails;
        for(var keydata in ratioObj){
          stockdetails = keydata.split("-")
          if(count==0){
            insert_bhav_ratio += `('${keydata}','${stockdetails[0]}','${stockdetails[0]}',${ratioObj[keydata]},'${stockdetails[1]}',NOW())`;
          }
          else{
            insert_bhav_ratio += `,('${keydata}','${stockdetails[0]}','${stockdetails[0]}',${ratioObj[keydata]},'${stockdetails[1]}',NOW())`;
          }
          count++;
        }
      let insert_bhav_ratio_result = con.query(insert_bhav_ratio);

      let createdailypcr = `CREATE TABLE IF NOT EXISTS stocks.tbl_pcrdaily_final_data (
        contractID varchar(255) DEFAULT NULL,
        stockname varchar(255) DEFAULT NULL,
        shortname varchar(255) DEFAULT NULL,
        pcrdate date DEFAULT NULL,
        pcrpoints varchar(255) DEFAULT NULL,
        pcrtype varchar(255) DEFAULT NULL,
        monthname varchar(255) DEFAULT NULL,
        entryDate varchar(255) DEFAULT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`;
      let createdailypcrresult = con.query(createdailypcr);

      let select_ratio = `SELECT * FROM stocks.tbl_pcrbhavcopy_ratio_daily_${date}`;
      let ratiovalue;
      let deletefinal = `DELETE FROM stocks.tbl_pcrdaily_final_data WHERE pcrdate = '${date}'`;
      let deletefinalresult = con.query(deletefinal,function(){
        let insertfinal = "INSERT INTO stocks.tbl_pcrdaily_final_data (contractID,stockname,shortname,pcrdate,pcrpoints,pcrtype,monthname,entryDate) values"
        let select_ratio_result = con.query(select_ratio,function(err,result,fields){
          for(let j=0;j<Object.keys(result).length;j++){
            ratiovalue = JSON.parse(JSON.stringify(result[j]));
            if(j==0){
              insertfinal += `('${ratiovalue["contractID"]}','${ratiovalue["stockname"]}','${ratiovalue["shortstockname"]}','${date}','${ratiovalue["pcrratio"]}','${ratiovalue["monthpcr"]}','${ratiovalue["monthpcr"]}',NOW())`
            }
            else{
              insertfinal += `,('${ratiovalue["contractID"]}','${ratiovalue["stockname"]}','${ratiovalue["shortstockname"]}','${date}','${ratiovalue["pcrratio"]}','${ratiovalue["monthpcr"]}','${ratiovalue["monthpcr"]}',NOW())`
            }
          }
          let insertfinalresult = con.query(insertfinal);
          let updatename = "Update stocks.tbl_pcrdaily_final_data a join stocks.tbl_stock_name b on (a.shortname=b.shortname) set a.stockname=b.name";
          let updateresult = con.query(updatename);

           updatename = `Update stocks.tbl_pcrbhavcopy_ratio_daily_${date} a join stocks.tbl_stock_name b on (a.shortstockname=b.shortname) set a.stockname=b.name`;
           updateresult = con.query(updatename);

           updatename = `Update stocks.tbl_pcrbhavcopy_daily_${date} a join stocks.tbl_stock_name b on (a.shortstockname=b.shortname) set a.stockname=b.name`;
           updateresult = con.query(updatename);
        });
      });
    }) 
  })

  

  res.send("hello")
})

app.all("/fetch",async function(req,res){
  console.log(req.body)
  let dateObj =new Date();
  let month = dateObj.getUTCMonth() + 1;
  let monthNUm = dateObj.getUTCMonth()
  let day = dateObj.getUTCDate();
  let year = dateObj.getUTCFullYear();
  let effectivedate =year +"-" + monthNUm + "-01";
  if(!req.body["data"]){
    return;
  }
  let pcrtype = req.body["data"]["pcrMonthformat"]
  if(pcrtype==="AVG"){
    if(monthNUm===0){
      monthNUm = 11;
      year = year-1
    }
    else{
      monthNUm = monthNUm-1
    }
    effectivedate =year +"-" + monthNUm + "-01";
  }
  let query = `SELECT *, DATE_FORMAT(pcrdate, "%d-%M") AS pcrFormatDate from stocks.tbl_pcrdaily_final_data where pcrtype ='${pcrtype}' AND (  shortname='${req.body["data"]["find"]}' OR stockname='${req.body["data"]["find"]}') and pcrdate>= '${effectivedate}'  order by pcrdate asc`;
  console.log(query);
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