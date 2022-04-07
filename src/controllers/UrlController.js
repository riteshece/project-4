const shortenModel = require("../models/UrlModel")

const shortid = require("shortid")

const redis = require("redis");

const {promisify} =require("util");

const {isWebUri} = require("valid-url")

//connecting to redis server
const redisClient = redis.createClient(
    13360,
    "redis-13360.c264.ap-south-1-1.ec2.cloud.redislabs.com",
    { no_ready_check: true }
  );
  redisClient.auth("nByYSvHKvhMgAMVIePMly16v5EvwkCOZ", function (err) {
    if (err) throw err;
  });
  
  redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
  });

//Connection setup for redis
const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);


const isValid = function (value) {
    if (typeof value === "undefined" || value === null) return false
    if (typeof value === "string" &&  value.trim().length === 0) return false
    return true
}
const isValidRequestBody = function(requestBody){

    return Object.keys(requestBody).length > 0;

}


// ==============================================================================================================================
//1.Post Api is used to create shortUrl from LongUrl 
const createShortenUrl = async function (req, res) {
    try {
        let requestBody = req.body;
        let longUrl  = req.body.longUrl
        //mandotary validation
        if (!isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, msg: "No Parameter Passed In RequestBody" })
        }
        if(!isValid(longUrl)){
            return res.status(400).send({status:false,msg:"long url is required"})
        }
        // URL Validation
        if (!(isWebUri(longUrl.trim()))) {
            return res.status(400).send({ status: false, msg: "Not a Valid Url" })
        }
        //unique validation
        let checkUrl = await shortenModel.findOne({ longUrl })
        if (checkUrl) {
            //if url found getting data from redis with key longUrl 
            
            let getUrlFromcache = await GET_ASYNC(`${longUrl}`)
            let parsedUrl = JSON.parse(getUrlFromcache)
            console.log(parsedUrl)
            return res.status(400).send({ status: false, msg: "LongUrl is already Present", data: parsedUrl })
        }
        else {
            let baseUrl = "http://localhost:3000"
            //Generating Short Url Using shortId package
            const urlCode = shortid.generate(longUrl)
            //Concating baseUrl and urlCode
            const shortUrl = baseUrl + "/" + urlCode
            let saveData = { longUrl, shortUrl, urlCode }
            let createDocument = await shortenModel.create(saveData)
            if (createDocument) {
                //Setting/Storing newly created url in redis database
                await SET_ASYNC(`${longUrl}`, JSON.stringify(createDocument))
                return res.status(201).send({ status: true, msg: "ShortUrl Created Successfully", data: createDocument })
            }
        }
    }
    catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}

// ========================================================================================================
//2.Get Api(that is second and  get api which redirect a long link)

const redirectUrl = async function (req, res) {
    try {
        let urlCode = req.params.urlCode;
        //Geting Url from redis database
        let getUrl = await GET_ASYNC(`${urlCode}`)
        let parsedUrl = JSON.parse(getUrl)
        if (parsedUrl) {
            return res.status(302).redirect(parsedUrl.longUrl)
        }
        else {
            let setUrl = await shortenModel.findOne({ urlCode });
            if (!setUrl) {
                return res.status(404).send({ status: false, msg: "No URL Found" })
            }
            //found url is storing in redis database 
            await SET_ASYNC(`${urlCode}`, JSON.stringify(setUrl))
            return res.status(302).redirect(setUrl.longUrl)
        }
    }
    catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}
module.exports = { createShortenUrl, redirectUrl }