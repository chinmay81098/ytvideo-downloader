import {ipcMain} from 'electron';
const fs = require('fs');
const ytdl = require('ytdl-core');
const glob=require('glob');
//const fluent_ffmpeg = require("fluent-ffmpeg");
const path = require('path');
const exec = require('child_process').exec;


const pathToDownloads = process.platform === 'win32'?`${process.env.HOME}\\Downloads`:`${process.env.HOME}/Downloads`;
const pathToAll = process.platform === 'win32'?`${pathToDownloads}\\YTvideo`:`${pathToDownloads}/YTvideo`;;
const pathToMerged = process.platform === 'win32'?`${pathToDownloads}\\YTvideoMerged`:`${pathToDownloads}/YTvideoMerged`;

if(!fs.existsSync('intermediate')){
    fs.mkdirSync('intermediate')
}

async function mergeVideos(inputVideos,pathToMerged,e){
    var ffmpeger = "";
    ffmpeger = inputVideos.map(video => 
    `ffmpeg -y -i ${video} -c copy -bsf:v h264_mp4toannexb -f mpegts intermediate/${path.parse(video).name}.ts`).join("&&");
    var concatenator = '"concat:';
    concatenator += inputVideos.map(video =>`intermediate/${path.parse(video).name}.ts`).join("|");
    concatenator+='"';
    var outputName = inputVideos.map(video=> path.parse(video).name).join("+")
    var mergecmd = `ffmpeg -y -i ${concatenator} -c copy -bsf:a aac_adtstoasc ${pathToMerged}\\${outputName}.mp4`;
    exec(`${ffmpeger}&&${mergecmd}`,(err, stdout, stderr) => {
        if(err) {
            console.log(err);
            e.sender.send('Error','Error while merging')
            return
        };
        e.sender.send('Merge-complete','All videos merged successfuly')
    })
}


function downloadAll(e,pathToAll,urlList){
    let task = []
    let videoId = []
    urlList.forEach(url => {
        task.push(ytdl(url,{ format:'mp4' }))
        videoId.push(path.parse(url).name.split('=')[1])
    })
    Promise.all(task)
        .then(res=>{
            res.forEach((item,index)=>{
               item.pipe(fs.createWriteStream(`${pathToAll}\\${videoId[index]}.mp4`))
            })
            e.sender.send('download-complete',`Downloaded ${urlList.length} videos successfuly`)
        })
        .catch((err)=>{
            console.log(err) 
        })
}

ipcMain.on('download-all',(e,urlList)=>{
    if(!fs.existsSync(pathToAll)){
        fs.mkdirSync(pathToAll)
    }
    downloadAll(e,pathToAll,urlList);
        
})

ipcMain.on('merge',(e,arg)=>{
    if(!fs.existsSync(pathToMerged)){
        fs.mkdirSync(pathToMerged)
    }
    const inputVideos = glob.sync(`${pathToAll}\\*.mp4`)
    mergeVideos(inputVideos,pathToMerged,e);
})

/*
https://www.youtube.com/watch?v=ZgMw__KdjiI,https://www.youtube.com/watch?v=d-UU_lyqcFg,https://www.youtube.com/watch?v=Uw5JOtvFd-k
*/ 