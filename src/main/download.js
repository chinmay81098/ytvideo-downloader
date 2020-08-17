import {ipcMain} from 'electron';
const fs = require('fs');
const ytdl = require('ytdl-core');
const glob=require('glob');
//const fluent_ffmpeg = require("fluent-ffmpeg");
const path = require('path');
const exec = require('child_process').exec;


const pathToDownloads = `${process.env.HOME}\\Downloads`;
const pathToAll =`${pathToDownloads}\\YTvideo`;
const pathToMerged = `${pathToDownloads}\\YTvideoMerged`;

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
    var mergecmd = `ffmpeg -y -i ${concatenator} -c copy -bsf:a aac_adtstoasc ${pathToMerged}\\output.mp4`;
    exec(`${ffmpeger}&&${mergecmd}`,(err, stdout, stderr) => {
        if(err) {
            console.log(err);
            e.sender.send('Error','Error while merging')
            return
        };
        e.sender.send('Merge-complete','All videos merged successfuly')
    })
}


ipcMain.on('download-all',(e,urlList)=>{
    if(!fs.existsSync(pathToAll)){
        fs.mkdirSync(pathToAll)
    }
    var eachVideo = 100/urlList.length;
    for(let i =0;i<urlList.length;++i){
        let vid = path.parse(urlList[i]).name.split('=')[1]
        ytdl(urlList[i],{ format:'mp4' }
        ).pipe(fs.createWriteStream(`${pathToAll}\\${vid}.mp4`))
        e.sender.send('download-progress',[eachVideo*(i+1),100])
    }
    e.sender.send('download-complete','All videos downloaded successfuly')
        
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